// src/webServer.ts (Version Finale et Stable)
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

// Middlewares
// CORRECTION: Expose the 'mcp-session-id' header instead of 'x-session-id'.
app.use(cors({ exposedHeaders: "mcp-session-id" }));

// Route de proxy pour MCP et health check
app.use(['/mcp', '/health'], (req: Request, res: Response) => {
    const targetUrl = `${PROXY_TARGET}${req.originalUrl}`;
    
    // Log crucial pour voir ce qui est transféré
    logger.info({
        method: req.method,
        url: req.originalUrl,
        headers: req.headers,
    }, "Proxying request to main server");

    const proxyReq = http.request(targetUrl, {
        method: req.method,
        headers: {
            ...req.headers,
            host: `server:${config.PORT}`,
        } as http.OutgoingHttpHeaders,
    }, (proxyRes) => {
        // CORRECTION: Forward the 'mcp-session-id' header back to the client.
        const newSessionId = proxyRes.headers['mcp-session-id'];
        if (newSessionId) {
            res.setHeader('mcp-session-id', newSessionId);
        }
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
        logger.error({ err, targetUrl }, 'Proxy request failed');
        res.status(502).json({ error: 'Bad Gateway' });
    });

    req.pipe(proxyReq);
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