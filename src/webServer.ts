// src/webServer.ts (version améliorée pour servir tous les fichiers statiques)

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';
import { config } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WEB_PORT = parseInt(process.env.WEB_PORT || '3000');
const MCP_SERVER_URL = config.MCP_SERVER_URL || 'http://localhost:8080';

// Dictionnaire des types MIME pour les fichiers statiques
const mimeTypes: { [key: string]: string } = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  // ... (gestion des CORS et OPTIONS reste identique) ...
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const timestamp = new Date().toISOString();

  logger.info(`${req.method} ${url.pathname} from ${req.socket.remoteAddress}`);

  // Proxy pour l'API
  if (url.pathname.startsWith('/api/') || url.pathname === '/health') {
    // ... (la logique du proxy reste identique) ...
    const targetUrl = `${MCP_SERVER_URL}${url.pathname}${url.search}`;
    logger.info(`Proxying to: ${targetUrl}`);
    const proxyReq = http.request(
      targetUrl,
      { method: req.method, headers: req.headers, timeout: 30000 },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        proxyRes.pipe(res);
      }
    );
    proxyReq.on('error', (err: Error) => {
      logger.error({ err, targetUrl }, 'Proxy request failed');
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Bad Gateway' }));
    });
    req.pipe(proxyReq);
    return;
  }

  // Logique améliorée pour servir les fichiers statiques
  try {
    let filePath = url.pathname;
    if (filePath === '/') {
      filePath = '/index.html';
    }

    const publicDir = path.join(__dirname, '..', 'public');
    const fullPath = path.join(publicDir, filePath);

    // Mesure de sécurité : s'assurer que le chemin est bien dans le dossier public
    if (!fullPath.startsWith(publicDir)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
    }

    if (fs.existsSync(fullPath)) {
      const extname = String(path.extname(fullPath)).toLowerCase();
      const contentType = mimeTypes[extname] || 'application/octet-stream';
      const content = fs.readFileSync(fullPath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    } else {
      // Si un fichier n'est pas trouvé, renvoyer index.html (utile pour les routeurs front-end)
      const indexPath = path.join(publicDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        const content = fs.readFileSync(indexPath, 'utf-8');
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