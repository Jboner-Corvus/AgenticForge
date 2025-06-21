// src/server.ts - Version corrigée et fonctionnelle
import { FastMCP, UserError } from 'fastmcp';
import type { IncomingMessage } from 'http';
import { randomUUID } from 'crypto';
import { config } from './config.js';
import logger from './logger.js';
import { allTools } from './tools/index.js';
import type { AgentSession, Ctx, AuthData } from './types.js';
import { getMasterPrompt } from './prompts/orchestrator.prompt.js';
import { getLlmResponse } from './utils/llmProvider.js';

// Configuration de session avec gestion robuste des erreurs
const sessionOptions = {
  async create(req: IncomingMessage): Promise<Partial<AgentSession>> {
    try {
      const url = new URL(req.url || '/', `http://${req.headers.host}`);

      // Permettre l'accès sans auth pour health check
      if (url.pathname === '/health') {
        return {
          history: [],
          auth: {
            id: 'health-check',
            type: 'anonymous',
            clientIp: req.socket.remoteAddress || 'unknown',
            authenticatedAt: Date.now(),
          },
        };
      }

      // Vérification d'auth pour les autres routes
      const authHeader = req.headers.authorization;
      if (!authHeader || authHeader !== `Bearer ${config.AUTH_TOKEN}`) {
        throw new UserError('Invalid or missing authorization token', {
          statusCode: 401,
        });
      }

      const authData: AuthData = {
        id: randomUUID(),
        type: 'Bearer',
        clientIp: req.socket.remoteAddress || 'unknown',
        authenticatedAt: Date.now(),
      };

      return {
        history: [],
        auth: authData,
      };
    } catch (error) {
      logger.error({ error }, 'Error in session creation');
      throw error;
    }
  },
};

// Configuration FastMCP optimisée pour la stabilité
const mcp = new FastMCP<AgentSession>({
  session: sessionOptions,
  tools: allTools,
  transport: {
    transportType: 'httpStream',
    httpStream: {
      endpoint: '/api/v1/agent/stream',
      port: config.PORT,
      host: '0.0.0.0',
      // Options pour éviter les timeouts de connexion
      clientCapabilityTimeout: 0, // Désactiver le timeout de détection des capacités
      keepAliveTimeout: 65000, // Keep-alive timeout de 65 secondes
      headersTimeout: 60000, // Timeout des headers de 60 secondes
    },
  },
  logger: {
    level: config.LOG_LEVEL,
    customLogger: logger,
  },
  healthCheckOptions: {
    path: '/health',
    enabled: true,
    message: 'Agentic Prometheus Server - Healthy',
    status: 200,
  },
  // Désactiver le ping automatique qui peut causer des problèmes
  pingOptions: {
    enabled: false,
    intervalMs: 0,
  },

  // Gestionnaire de conversation avec gestion d'erreurs robuste
  async conversationHandler(goal: string, ctx: Ctx) {
    try {
      logger.info(
        { goal, sessionId: ctx.session?.auth?.id },
        'Processing conversation request',
      );

      if (!ctx.session) {
        throw new Error('Session is not available in conversationHandler');
      }

      // Ajouter le message utilisateur à l'historique
      ctx.session.history.push({ role: 'user', content: goal });

      // Générer le prompt maître avec l'historique et les outils
      const masterPrompt = getMasterPrompt(ctx.session.history, allTools);

      // Obtenir la réponse du LLM
      const llmResponse = await getLlmResponse(masterPrompt);

      // Ajouter la réponse à l'historique
      ctx.session.history.push({ role: 'assistant', content: llmResponse });

      logger.info(
        {
          sessionId: ctx.session.auth.id,
          responseLength: llmResponse.length,
        },
        'Conversation processed successfully',
      );

      return llmResponse;
    } catch (error) {
      const errorMessage = `Erreur lors du traitement: ${(error as Error).message}`;
      logger.error(
        {
          error: error as Error,
          goal,
          sessionId: ctx.session?.auth?.id,
        },
        'Error in conversation handler',
      );

      return errorMessage;
    }
  },
} as any);

// Fonction pour maintenir le serveur en vie et gérer les erreurs
const setupServerStability = () => {
  // Empêcher la fermeture automatique du processus
  process.stdin.resume();

  // Heartbeat silencieux
  const heartbeatInterval = setInterval(() => {
    logger.debug('Server heartbeat - alive and responsive');
  }, 30000);

  // Gestionnaire pour les exceptions non capturées
  process.on('uncaughtException', (error) => {
    logger.error(
      { error },
      'Uncaught exception - server continuing gracefully',
    );
    // Ne pas quitter, continuer le fonctionnement
  });

  // Gestionnaire pour les promesses rejetées non gérées
  process.on('unhandledRejection', (reason, promise) => {
    logger.error(
      { reason, promise },
      'Unhandled promise rejection - server continuing',
    );
    // Ne pas quitter, continuer le fonctionnement
  });

  // Gestionnaires de signaux pour arrêt propre
  const gracefulShutdown = (signal: string) => {
    logger.info(`${signal} received - initiating graceful shutdown`);
    clearInterval(heartbeatInterval);

    // Fermer le serveur MCP proprement
    try {
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  return heartbeatInterval;
};

// Démarrage du serveur avec gestion d'erreur complète
async function startServer() {
  try {
    await mcp.start();

    logger.info(`🚀 Agentic Prometheus server started successfully`);
    logger.info(`🌐 Server listening on 0.0.0.0:${config.PORT}`);
    logger.info(
      `📡 API endpoint: http://localhost:${config.PORT}/api/v1/agent/stream`,
    );
    logger.info(`🔍 Health check: http://localhost:${config.PORT}/health`);
    logger.info(
      `🛠️  Available tools: ${allTools.map((t) => t.name).join(', ')}`,
    );
    logger.info(`🔧 Environment: ${config.NODE_ENV}`);
    logger.info(`📊 Log level: ${config.LOG_LEVEL}`);

    // Configurer la stabilité du serveur
    setupServerStability();

    // Message de succès final
    logger.info('✅ Server is ready to accept connections');
  } catch (error) {
    logger.fatal({ error }, '💀 Failed to start server');

    // Attendre un peu avant de quitter pour permettre la lecture des logs
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }
}

// Lancer le serveur
void startServer();

// Export pour usage externe si nécessaire
export default mcp;
