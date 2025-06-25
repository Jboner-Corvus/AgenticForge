// src/webServer.ts (Version finale - Cible le chemin original)
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
const PROXY_TARGET = `http://server:${config.PORT}`;

app.use(cors({ exposedHeaders: "mcp-session-id" }));

app.use(['/mcp', '/health'], (req: Request, res: Response) => {
    // On garde le chemin original de la requête (/mcp ou /health)
    const targetUrl = `${PROXY_TARGET}${req.originalUrl}`;
    
    logger.info({ originalUrl: req.originalUrl, targetUrl: targetUrl }, "Proxying request to server");

    const proxyReq = http.request(targetUrl, {
        method: req.method,
        headers: {
            ...req.headers,
            host: `server:${config.PORT}`,
        },
    }, (proxyRes) => {
        const newSessionId = proxyRes.headers['mcp-session-id'];
        if (newSessionId) {
            res.setHeader('mcp-session-id', newSessionId);
        }
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
        logger.error({ err, targetUrl }, 'Proxy request failed');
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

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 Agentic Forge Web Server is running on port ${PORT}`);
});