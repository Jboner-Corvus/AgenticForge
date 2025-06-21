/**
 * src/webServer.ts (Linted et Corrigé)
 *
 * Ce serveur web fournit l'interface utilisateur et agit comme point d'entrée pour les requêtes de conversation.
 * Il déclenche l'orchestrateur d'agent (`runAgent`) et streame les résultats en temps réel.
 * Il valide désormais le jeton d'authentification.
 */
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';
import { runAgent } from './agent.js';
import { config } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WEB_PORT = parseInt(process.env.WEB_PORT || '3000');

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  logger.info(`[WebServer] ${req.method} ${url.pathname}`);

  if (
    req.method === 'GET' &&
    (url.pathname === '/' || url.pathname === '/index.html')
  ) {
    const indexPath = path.join(__dirname, '..', 'public', 'index.html');
    fs.readFile(indexPath, 'utf8', (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading index.html');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/v1/agent/run') {
    const authHeader = req.headers['authorization'];
    const expectedToken = `Bearer ${config.AUTH_TOKEN}`;

    if (!authHeader || authHeader !== expectedToken) {
      logger.warn(
        { ip: req.socket.remoteAddress },
        'Unauthorized attempt to run agent',
      );
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const { goal } = JSON.parse(body);
        if (!goal) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Goal is required' }));
          return;
        }

        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        });

        const streamCallback = (data: Record<string, unknown>) => {
          res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        runAgent(goal, streamCallback).catch((err) => {
          logger.error({ err }, 'Error in runAgent');
          streamCallback({ type: 'error', message: 'Agent execution failed.' });
        });
      } catch {
        // Variable 'error' retirée
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/web-health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }),
    );
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(WEB_PORT, '0.0.0.0', () => {
  logger.info(
    `🌐 Web interface server started on http://localhost:${WEB_PORT}`,
  );
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));
