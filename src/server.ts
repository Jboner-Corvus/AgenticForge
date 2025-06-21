// ===== src/server.ts =====
// Version entièrement corrigée et fonctionnelle

import { FastMCP } from 'fastmcp';
import type { IncomingMessage } from 'http';
import { randomUUID } from 'crypto';
import { config } from './config.js';
import logger from './logger.js';
import { allTools } from './tools/index.js';
import type { AgentSession, Ctx, AuthData } from './types.js';
import { getMasterPrompt } from './prompts/orchestrator.prompt.js';
import { getLlmResponse } from './utils/llmProvider.js';

/**
 * Logique d'authentification et de création de session.
 * Retourne les données de session personnalisées que FastMCP fusionnera.
 */
async function createSession(req: IncomingMessage): Promise<any> {
  // CORRECTION: Utilise 'any' pour contourner le problème de type complexe.
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);

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

    const authHeader = req.headers.authorization;
    let isAuthorized = false;

    if (authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        if (token === config.AUTH_TOKEN) {
          isAuthorized = true;
        }
      } else if (authHeader === config.AUTH_TOKEN) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      logger.warn(
        {
          ip: req.socket.remoteAddress,
          path: url.pathname,
          method: req.method,
        },
        'Failed authentication attempt',
      );
      throw new Response('Unauthorized', { status: 401 });
    }

    const authData: AuthData = {
      id: randomUUID(),
      type: 'Bearer',
      clientIp: req.socket.remoteAddress || 'unknown',
      authenticatedAt: Date.now(),
    };

    // Retourne uniquement les données initiales. Pas de cast nécessaire.
    return {
      history: [],
      auth: authData,
    };
  } catch (error) {
    if (!(error instanceof Response)) {
      logger.error({ err: error }, 'Internal error during session creation');
    }
    throw error;
  }
}

// Configuration FastMCP optimisée pour la stabilité
const mcp = new FastMCP<AgentSession>({
  authenticate: createSession,

  // CORRECTION: La propriété 'tools' n'existe pas dans le constructeur.
  // Les outils sont ajoutés après l'initialisation.

  // Handler de conversation principal
  async conversationHandler(goal: string, ctx: Ctx) {
    try {
      if (!ctx.session) {
        throw new Error('Session is not available in conversationHandler');
      }

      // CORRECTION: Les signatures de log Pino sont (objet, message).
      ctx.log.info({ goal }, 'Processing conversation request');
      ctx.session.history.push({ role: 'user', content: goal });
      const masterPrompt = getMasterPrompt(ctx.session.history, allTools);
      const llmResponse = await getLlmResponse(masterPrompt);
      ctx.session.history.push({ role: 'assistant', content: llmResponse });

      return llmResponse;
    } catch (error) {
      const errorMessage = `Error during processing: ${(error as Error).message}`;
      ctx.log.error({ err: error, goal }, 'Error in conversation handler');
      return `<tool_code>{"tool": "error", "parameters": {"message": "${errorMessage}"}}</tool_code>`;
    }
  },

  transport: {
    transportType: 'httpStream',
    httpStream: {
      endpoint: '/api/v1/agent/stream',
      port: config.PORT,
      host: '0.0.0.0',
    },
  },

  logger: {
    level: config.LOG_LEVEL,
    customLogger: logger,
  },

  healthCheckOptions: {
    path: '/health',
    enabled: true,
  },

  pingOptions: {
    enabled: false,
  },
});

// CORRECTION: Ajout des outils via la méthode .addTool()
for (const tool of allTools) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mcp.addTool(tool as any);
}

// Démarrage du serveur avec gestion d'erreur complète
async function startServer() {
  try {
    await mcp.start();
    logger.info(
      {
        port: config.PORT,
        env: config.NODE_ENV,
        logLevel: config.LOG_LEVEL,
        tools: allTools.map((t) => t.name),
      },
      `🚀 Agentic Prometheus server started successfully`,
    );
  } catch (error) {
    logger.fatal({ err: error }, '💀 Failed to start server');
    process.exit(1);
  }
}

// Gestion des arrêts propres
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully.`);
  mcp
    .stop()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught Exception!');
  gracefulShutdown('uncaughtException');
});

// Lancer le serveur
void startServer();

export default mcp;
