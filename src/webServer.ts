// src/webServer.ts (Version proxy correcte, sans logique FastMCP)
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import * as http from 'http';
import * as path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';
import { config } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PROXY_TARGET_HOST = 'server';
const PROXY_TARGET_PORT = config.PORT;

app.use(cors({ exposedHeaders: 'mcp-session-id' }));

app.use(['/mcp', '/health'], (req: Request, res: Response) => {
  const targetPath = req.originalUrl;

  const options = {
    hostname: PROXY_TARGET_HOST,
    port: PROXY_TARGET_PORT,
    path: targetPath,
    method: req.method,
    headers: {
      ...req.headers,
      host: `${PROXY_TARGET_HOST}:${PROXY_TARGET_PORT}`,
    },
  };

  logger.info({ ...options }, 'Proxying request to main server');

  const proxyReq = http.request(options, (proxyRes) => {
    const newSessionId = proxyRes.headers['mcp-session-id'];
    if (newSessionId) {
      res.setHeader('mcp-session-id', newSessionId);
    }
    res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    logger.error({ err, ...options }, 'Proxy request failed');
    res.status(502).json({ error: 'Bad Gateway', details: err.message });
  });

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    req.pipe(proxyReq);
  } else {
    proxyReq.end();
  }
});

const publicDir = path.resolve(__dirname, '..', 'public');
app.use(express.static(publicDir));
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

const WEB_SERVER_PORT = 3000;
app.listen(WEB_SERVER_PORT, '0.0.0.0', () => {
  logger.info(
    `🚀 Agentic Forge Web Server is running on port ${WEB_SERVER_PORT}`,
  );
});
