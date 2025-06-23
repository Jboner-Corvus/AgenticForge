// src/webServer.ts (version corrigée et finale du proxy)

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';
import { config } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WEB_PORT = parseInt(process.env.WEB_PORT || '3000');
// On construit une URL de base SANS chemin pour le proxy.
const PROXY_TARGET = `http://server:${config.PORT}`;

const mimeTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS',
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Session-ID',
  );

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const incomingUrl = new URL(req.url || '/', `http://${req.headers.host}`);
  logger.info(
    `${req.method} ${incomingUrl.pathname} from ${req.socket.remoteAddress}`,
  );

  // ---- BLOC PROXY SIMPLIFIÉ ----
  if (
    incomingUrl.pathname.startsWith('/api/') || // Pour la compatibilité si besoin
    incomingUrl.pathname.startsWith('/mcp') ||
    incomingUrl.pathname === '/health'
  ) {
    // On combine la base du serveur cible avec le chemin de la requête entrante.
    const targetUrl = new URL(
      incomingUrl.pathname + incomingUrl.search,
      PROXY_TARGET,
    );

    logger.info(`Proxying request to: ${targetUrl.href}`);

    const proxyReq = http.request(
      targetUrl,
      {
        method: req.method,
        headers: { ...req.headers, host: targetUrl.host },
        timeout: 60000, // Augmentation du timeout pour les réponses longues du LLM
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        proxyRes.pipe(res);
      },
    );

    proxyReq.on('error', (err: Error) => {
      logger.error(
        { err: err.message, targetUrl: targetUrl.href },
        'Proxy request failed',
      );
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'Bad Gateway',
          message: 'Could not reach the main API server.',
        }),
      );
    });

    req.pipe(proxyReq);
    return;
  }

  // ---- SERVEUR DE FICHIERS STATIQUES ----
  try {
    const requestedPath =
      incomingUrl.pathname === '/' ? '/index.html' : incomingUrl.pathname;
    const publicDir = path.resolve(__dirname, '..', 'public');
    const fullPath = path.join(publicDir, requestedPath);

    if (!fullPath.startsWith(publicDir)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }

    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      const extname = String(path.extname(fullPath)).toLowerCase();
      const contentType = mimeTypes[extname] || 'application/octet-stream';
      const content = fs.readFileSync(fullPath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } else {
      const indexPath = path.join(publicDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        const content = fs.readFileSync(indexPath);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    }
  } catch (error) {
    logger.error({ error }, 'Error serving static file');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Server Error');
  }
});

server.listen(WEB_PORT, '0.0.0.0', () => {
  logger.info(`🌐 Web server started on 0.0.0.0:${WEB_PORT}`);
});

export default server;
