// src/webServer.ts (version corrigée et nettoyée)

import * as http from 'http';
import * as fs from 'fs'; // 'fs' est bien utilisé pour servir les fichiers statiques.
import * as path from 'path';
import { posix } from 'path'; // Utiliser posix pour la manipulation des chemins d'URL
import { fileURLToPath } from 'url';
import logger from './logger.js';
import { config } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // '__dirname' est nécessaire pour localiser le dossier 'public'

const WEB_PORT = parseInt(process.env.WEB_PORT || '3000');
const MCP_SERVER_URL = config.MCP_SERVER_URL || 'http://localhost:8080';

const mimeTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

const server = http.createServer((req, res) => {
  // Configuration des en-têtes CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS',
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Session-ID',
  );

  // Réponse immédiate pour les requêtes pre-flight OPTIONS
  if (req.method === 'OPTIONS') {
    res.writeHead(204); // 204 No Content est plus approprié
    res.end();
    return;
  }

  const incomingUrl = new URL(req.url || '/', `http://${req.headers.host}`);
  logger.info(
    `${req.method} ${incomingUrl.pathname} from ${req.socket.remoteAddress}`,
  );

  // ---- BLOC PROXY ----
  if (
    incomingUrl.pathname.startsWith('/api/') ||
    incomingUrl.pathname.startsWith('/mcp') ||
    incomingUrl.pathname === '/health'
  ) {
    if (!MCP_SERVER_URL) {
      logger.error('Configuration Error: MCP_SERVER_URL is not defined.');
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal Server Configuration Error' }));
      return;
    }

    const mcpBaseUrl = new URL(MCP_SERVER_URL);
    const targetUrl = new URL(mcpBaseUrl.origin);
    targetUrl.pathname = posix.join(mcpBaseUrl.pathname, incomingUrl.pathname);
    targetUrl.search = incomingUrl.search;

    logger.info(`Proxying request to: ${targetUrl.href}`);

    const proxyReq = http.request(
      targetUrl,
      {
        method: req.method,
        headers: { ...req.headers, host: targetUrl.host },
        timeout: 30000,
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
    // Correction ici : le dossier public est au même niveau que le dossier 'dist' où ce fichier sera exécuté.
    const publicDir = path.resolve(__dirname, '..', 'public');
    const fullPath = path.join(publicDir, requestedPath);

    // Sécurité : Vérifier que le chemin ne sort pas du dossier public
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
      // Pour les applications Single-Page, renvoyer index.html pour n'importe quelle route non trouvée
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
