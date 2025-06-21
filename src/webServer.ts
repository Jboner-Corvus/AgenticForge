// src/webServer.ts - Serveur web simple et robuste (sans manipulation de token)
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

const server = http.createServer((req, res) => {
  // CORS headers pour toutes les réponses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS',
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Gérer les requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const timestamp = new Date().toISOString();

  logger.info(`${req.method} ${url.pathname} from ${req.socket.remoteAddress}`);

  // Route principale - Interface web
  if (url.pathname === '/' || url.pathname === '/index.html') {
    // Chemin corrigé pour pointer vers le bon fichier
    const indexPath = path.join(__dirname, '..', 'public', 'index.html');

    if (fs.existsSync(indexPath)) {
      try {
        const content = fs.readFileSync(indexPath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content);
        return;
      } catch (error) {
        logger.error({ error }, 'Error reading index.html');
      }
    }

    // Fallback si index.html n'est pas trouvé
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('index.html not found');
    return;
  }

  // Health check du serveur web
  if (url.pathname === '/web-health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        timestamp,
        webPort: WEB_PORT,
        mcpServer: MCP_SERVER_URL,
      }),
    );
    return;
  }

  // Proxy vers le serveur MCP pour les appels API et le health check du serveur principal
  if (url.pathname.startsWith('/api/') || url.pathname === '/health') {
    const targetUrl = `${MCP_SERVER_URL}${url.pathname}${url.search}`;

    logger.info(`Proxying to: ${targetUrl}`);

    const proxyReq = http.request(
      targetUrl,
      {
        method: req.method,
        headers: req.headers,
        timeout: 30000,
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        proxyRes.pipe(res);
      },
    );

    proxyReq.on('error', (err: Error) => {
      logger.error({ err, targetUrl }, 'Proxy request failed');
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Bad Gateway' }));
    });

    req.pipe(proxyReq);
    return;
  }

  // 404 pour les autres routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(WEB_PORT, '0.0.0.0', () => {
  logger.info(`🌐 Web server started on 0.0.0.0:${WEB_PORT}`);
});

export default server;
