// src/server.ts - Serveur HTTP avec corrections ESLint
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

// Nettoyer les sessions inactives (plus de 1 heure)
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
); // Nettoyer toutes les 30 minutes

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

    // Ajouter le message utilisateur
    session.history.push({ role: 'user', content: goal });

    // Limiter l'historique pour éviter des prompts trop longs
    if (session.history.length > 20) {
      session.history = session.history.slice(-20);
      logger.debug(
        { sessionId: session.id },
        'History trimmed to last 20 messages',
      );
    }

    // Générer le prompt maître
    const masterPrompt = getMasterPrompt(session.history, allTools);

    // Obtenir la réponse du LLM
    const llmResponse = await getLlmResponse(masterPrompt);

    // Ajouter la réponse à l'historique
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

    logger.error(
      {
        error: error as Error,
        sessionId: session.id,
        goal: goal.substring(0, 100),
        processingTimeMs: processingTime,
      },
      'Error processing conversation',
    );

    // Ajouter l'erreur à l'historique pour le contexte
    session.history.push({ role: 'assistant', content: errorMsg });

    return errorMsg;
  }
}

// Gestionnaire de requête principal (avec gestion d'erreur pour ESLint)
async function handleRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void> {
  // CORS headers pour toutes les réponses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Session-ID',
  );

  // Gérer les requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const timestamp = new Date().toISOString();

  logger.info(`${req.method} ${url.pathname} from ${req.socket.remoteAddress}`);

  // Health check
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Agentic Prometheus Server - Healthy');
    return;
  }

  // Status endpoint détaillé
  if (url.pathname === '/status') {
    const memUsage = process.memoryUsage();
    const status = {
      status: 'running',
      name: 'Agentic-Prometheus',
      version: '3.1.0',
      timestamp,
      uptime: Math.round(process.uptime()),
      sessions: {
        active: sessions.size,
        total: sessions.size,
      },
      tools: {
        count: allTools.length,
        names: allTools.map((t) => t.name),
      },
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      },
      environment: {
        nodeEnv: config.NODE_ENV,
        logLevel: config.LOG_LEVEL,
        llmModel: config.LLM_MODEL_NAME,
      },
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(status, null, 2));
    return;
  }

  // API endpoint principal
  if (url.pathname === '/api/v1/agent/stream' && req.method === 'POST') {
    try {
      // Vérifier l'authentification
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.includes(config.AUTH_TOKEN)) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: 'Unauthorized',
            message: 'Invalid or missing authorization token',
            timestamp,
          }),
        );
        return;
      }

      // Lire le body de la requête
      let body = '';

      req.on('data', (chunk) => {
        body += chunk.toString();
      });

      // Gestionnaire pour la fin de la requête (correction ESLint)
      req.on('end', () => {
        void (async () => {
          try {
            const data = JSON.parse(body);
            const goal = data.goal;

            if (!goal || typeof goal !== 'string') {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  error: 'Bad Request',
                  message: 'Missing or invalid goal parameter',
                  timestamp,
                }),
              );
              return;
            }

            // Créer les données d'authentification
            const authData: AuthData = {
              id: randomUUID(),
              type: 'Bearer',
              clientIp: req.socket.remoteAddress || 'unknown',
              authenticatedAt: Date.now(),
            };

            // Récupérer l'ID de session depuis les headers ou en créer un nouveau
            const sessionId = req.headers['x-session-id'] as string;

            // Obtenir ou créer la session
            const session = getOrCreateSession(authData, sessionId);

            // Traiter la conversation
            const response = await processConversation(goal, session);

            // Renvoyer la réponse
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                response,
                sessionId: session.id,
                timestamp,
                metadata: {
                  toolsAvailable: allTools.length,
                  historyLength: session.history.length,
                  processingInfo: 'Processed by Agentic Prometheus v3.1.0',
                },
              }),
            );
          } catch (parseError) {
            logger.error(
              { error: parseError, body },
              'Error parsing request body',
            );
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                error: 'Bad Request',
                message: 'Invalid JSON in request body',
                timestamp,
              }),
            );
          }
        })();
      });

      // Gestionnaire d'erreur pour la requête (correction ESLint)
      req.on('error', (err) => {
        logger.error({ error: err }, 'Request error');
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: 'Internal Server Error',
            message: 'Error reading request',
            timestamp,
          }),
        );
      });
    } catch (error) {
      logger.error({ error }, 'Error in request handler');
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'Internal Server Error',
          message: (error as Error).message,
          timestamp,
        }),
      );
    }
    return;
  }

  // 404 pour les autres routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      error: 'Not Found',
      path: url.pathname,
      availableEndpoints: [
        'GET /health',
        'GET /status',
        'POST /api/v1/agent/stream',
      ],
      timestamp,
    }),
  );
}

// Créer le serveur HTTP avec gestionnaire d'erreur pour ESLint
const server = http.createServer((req, res) => {
  void (async () => {
    try {
      await handleRequest(req, res);
    } catch (error) {
      logger.error({ error }, 'Unhandled error in request handler');
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: 'Internal Server Error',
            message: 'Unexpected server error',
            timestamp: new Date().toISOString(),
          }),
        );
      }
    }
  })();
});

// Configuration du serveur
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// Démarrer le serveur
server.listen(config.PORT, '0.0.0.0', () => {
  logger.info(`🚀 Agentic Prometheus server started successfully`);
  logger.info(`🌐 Server listening on 0.0.0.0:${config.PORT}`);
  logger.info(
    `📡 API endpoint: http://localhost:${config.PORT}/api/v1/agent/stream`,
  );
  logger.info(`🔍 Health check: http://localhost:${config.PORT}/health`);
  logger.info(`📊 Status endpoint: http://localhost:${config.PORT}/status`);
  logger.info(`🛠️  Available tools: ${allTools.map((t) => t.name).join(', ')}`);
  logger.info(`🔧 Environment: ${config.NODE_ENV}`);
  logger.info(`📊 Log level: ${config.LOG_LEVEL}`);
  logger.info(`🤖 LLM Model: ${config.LLM_MODEL_NAME}`);
  logger.info(`💾 Session cleanup: every 30 minutes`);
  logger.info('✅ Server is ready to accept connections');
});

// Gestionnaires d'erreurs du serveur
server.on('error', (err) => {
  logger.fatal({ err }, 'Critical server error');
  process.exit(1);
});

server.on('clientError', (err, socket) => {
  logger.warn({ err }, 'Client error');
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

// Gestionnaires d'erreurs globales
process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught exception - server continuing gracefully');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(
    { reason, promise },
    'Unhandled promise rejection - server continuing',
  );
});

// Arrêt propre du serveur
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received - initiating graceful shutdown`);

  server.close((err) => {
    if (err) {
      logger.error({ err }, 'Error during server shutdown');
      process.exit(1);
    }

    logger.info(
      `Graceful shutdown complete. Sessions cleaned: ${sessions.size}`,
    );
    process.exit(0);
  });

  // Force shutdown après 10 secondes
  setTimeout(() => {
    logger.warn('Force shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Heartbeat pour monitoring
setInterval(() => {
  const memUsage = process.memoryUsage();
  logger.debug(
    {
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      },
      uptime: Math.round(process.uptime()) + 's',
      activeSessions: sessions.size,
    },
    'Server heartbeat',
  );
}, 60000); // Toutes les minutes

export default server;
