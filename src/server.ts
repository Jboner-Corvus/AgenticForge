// src/server.ts - Serveur HTTP avec toutes les corrections
import http from 'http';
import { randomUUID } from 'crypto';
import { config } from './config.js';
import logger from './logger.js';
import { allTools } from './tools/index.js';
import { getMasterPrompt } from './prompts/orchestrator.prompt.js';
import { getLlmResponse } from './utils/llmProvider.js';
import type { AuthData } from './types.js';

// Session simple en mémoire
interface ServerSession {
  id: string;
  auth: AuthData;
  history: { role: 'user' | 'assistant'; content: string }[];
  createdAt: number;
  lastActivity: number;
}

// Map des sessions actives
const sessions = new Map<string, ServerSession>();

// Nettoyer les sessions inactives
setInterval(
  () => {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    for (const [id, session] of sessions.entries()) {
      if (now - session.lastActivity > oneHour) {
        sessions.delete(id);
        logger.debug({ sessionId: id }, 'Session cleaned up due to inactivity');
      }
    }
  },
  30 * 60 * 1000,
);

// Créer ou récupérer une session
function getOrCreateSession(
  authData: AuthData,
  sessionId?: string,
): ServerSession {
  const id = sessionId || randomUUID();

  let session = sessions.get(id);
  if (!session) {
    session = {
      id,
      auth: authData,
      history: [],
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };
    sessions.set(id, session);
    logger.info(
      { sessionId: id, clientIp: authData.clientIp },
      'New session created',
    );
  } else {
    session.lastActivity = Date.now();
  }

  return session;
}

// Fonction pour traiter une conversation
async function processConversation(
  goal: string,
  session: ServerSession,
): Promise<string> {
  const startTime = Date.now();

  try {
    logger.info(
      {
        sessionId: session.id,
        goal: goal.substring(0, 100) + (goal.length > 100 ? '...' : ''),
        historyLength: session.history.length,
      },
      'Processing conversation',
    );

    session.history.push({ role: 'user', content: goal });

    if (session.history.length > 20) {
      session.history = session.history.slice(-20);
    }

    const masterPrompt = getMasterPrompt(session.history, allTools);

    const llmResponse = await getLlmResponse(masterPrompt);

    session.history.push({ role: 'assistant', content: llmResponse });

    const processingTime = Date.now() - startTime;

    logger.info(
      {
        sessionId: session.id,
        responseLength: llmResponse.length,
        processingTimeMs: processingTime,
        historyLength: session.history.length,
      },
      'Conversation processed successfully',
    );

    return llmResponse;
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMsg = `Erreur lors du traitement: ${(error as Error).message}`;

    // CORRECTION : La variable 'processingTime' est maintenant utilisée dans le log.
    logger.error(
      {
        error: error as Error,
        sessionId: session.id,
        goal: goal.substring(0, 100),
        processingTimeMs: processingTime, // Utilisation de la variable
      },
      'Error processing conversation',
    );

    session.history.push({ role: 'assistant', content: errorMsg });

    return errorMsg;
  }
}

// Gestionnaire de requête principal
async function handleRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Session-ID',
  );

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const timestamp = new Date().toISOString();

  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Agentic Prometheus Server - Healthy');
    return;
  }

  if (url.pathname === '/api/v1/agent/stream' && req.method === 'POST') {
    try {
      const authHeader = req.headers.authorization;
      const expectedToken = `Bearer ${config.AUTH_TOKEN}`;

      if (!authHeader || authHeader !== expectedToken) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }

      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        void (async () => {
          try {
            const data = JSON.parse(body);
            if (!data.goal || typeof data.goal !== 'string') {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  error: 'Bad Request',
                  message: 'Missing goal',
                }),
              );
              return;
            }

            const authData: AuthData = {
              id: randomUUID(),
              type: 'Bearer',
              clientIp: req.socket.remoteAddress || 'unknown',
              authenticatedAt: Date.now(),
            };

            const session = getOrCreateSession(
              authData,
              req.headers['x-session-id'] as string,
            );
            const response = await processConversation(data.goal, session);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                response,
                sessionId: session.id,
                timestamp,
              }),
            );
          } catch (parseError) {
            logger.error(
              { error: parseError, body },
              'Error parsing request body',
            );
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({ error: 'Bad Request', message: 'Invalid JSON' }),
            );
          }
        })();
      });
    } catch (error) {
      logger.error({ error }, 'Error in request handler');
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
}

// Création et démarrage du serveur
const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((err) => {
    logger.error({ error: err }, 'Unhandled error in request handler');
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  });
});

server.listen(config.PORT, '0.0.0.0', () => {
  logger.info(
    `🚀 Agentic Prometheus server started successfully on 0.0.0.0:${config.PORT}`,
  );
});

// Gestionnaires d'arrêt
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received - shutting down`);
  server.close(() => process.exit(0));
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default server;
