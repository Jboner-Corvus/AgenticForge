// src/webServer.ts (Version Finale avec Correction du Proxy)
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

// Middlewares
app.use(cors({ exposedHeaders: "mcp-session-id" }));

// --- NOUVELLE LOGIQUE DE PROXY ---

// Proxy pour l'API MCP
app.use('/mcp', (req: Request, res: Response) => {
    const options = {
        hostname: PROXY_TARGET_HOST,
        port: PROXY_TARGET_PORT,
        path: '/', // CORRECTION : On cible la racine pour les appels API
        method: req.method,
        headers: {
            ...req.headers,
            host: `${PROXY_TARGET_HOST}:${PROXY_TARGET_PORT}`,
        } as http.OutgoingHttpHeaders,
    };

    const proxyReq = http.request(options, (proxyRes) => {
        const newSessionId = proxyRes.headers['mcp-session-id'];
        if (newSessionId) {
            res.setHeader('mcp-session-id', newSessionId);
        }
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
        logger.error({ err }, 'Erreur du proxy vers /mcp');
        res.status(502).json({ error: 'Bad Gateway' });
    });

    req.pipe(proxyReq);
});

// Proxy pour le Health Check (reste inchangé)
app.use('/health', (req: Request, res: Response) => {
    const options = {
        hostname: PROXY_TARGET_HOST,
        port: PROXY_TARGET_PORT,
        path: '/health',
        method: req.method,
        headers: req.headers,
    };
    const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        proxyRes.pipe(res);
    });
    proxyReq.on('error', (err) => {
        logger.error({ err }, 'Erreur du proxy vers /health');
        res.status(502).json({ error: 'Bad Gateway' });
    });
    proxyReq.end();
});


// Servir les fichiers statiques de l'interface utilisateur
const publicDir = path.resolve(__dirname, '..', 'public');
app.use(express.static(publicDir));
app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(publicDir, 'index.html'));
});


const PORT = parseInt(process.env.WEB_PORT || '3000');
app.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 Agentic Forge Web Server is running on port ${PORT}`);
});