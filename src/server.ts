// src/server.ts (Version Finale avec Connexion Redis Robuste)
import { FastMCP, type TextContent } from 'fastmcp';
import { z } from 'zod';
import { Redis } from 'ioredis';
import { config } from './config.js';
import logger from './logger.js';
import { getAllTools, type Tool } from './tools/index.js';
import { getMasterPrompt } from './prompts/orchestrator.prompt.js';
import { getLlmResponse } from './utils/llmProvider.js';
import type { AgentSession, History, SessionData } from './types.js';
import type { IncomingMessage } from 'http';

// Configuration Redis améliorée pour la robustesse
const redis = new Redis({
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD,
  maxRetriesPerRequest: 3, // Limite les tentatives pour éviter les boucles infinies
  enableReadyCheck: true,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000); // Réessaie rapidement, puis attend jusqu'à 3s
    logger.warn(`Redis: Tentative de reconnexion #${times}. Prochaine dans ${delay}ms.`);
    return delay;
  },
});

redis.on('connect', () => logger.info('✅ Connexion à Redis établie.'));
redis.on('ready', () => logger.info('✅ Redis est prêt à recevoir des commandes.'));
redis.on('error', (err) => logger.error({ err }, 'Erreur de connexion Redis.'));

const SESSION_EXPIRATION_SECONDS = 24 * 3600;

async function getOrCreateSession(sessionData: SessionData): Promise<AgentSession> {
    const { sessionId } = sessionData;
    const sessionKey = `session:${sessionId}`;
    logger.info({ sessionKey }, "Recherche de la session dans Redis...");
    const sessionString = await redis.get(sessionKey);
    
    if (sessionString) {
        logger.info({ sessionId }, "Session existante trouvée.");
        return JSON.parse(sessionString) as AgentSession;
    }
    
    logger.warn({ sessionId }, "Session non trouvée. Création d'une nouvelle session.");
    const newSession: AgentSession = {
        id: sessionId,
        auth: sessionData,
        history: [],
        createdAt: Date.now(),
        lastActivity: Date.now(),
    };
    await redis.set(
        sessionKey,
        JSON.stringify(newSession),
        'EX',
        SESSION_EXPIRATION_SECONDS,
    );
    logger.info({ sessionId }, "Nouvelle session créée et sauvegardée dans Redis.");
    return newSession;
}

const goalHandlerParams = z.object({ goal: z.string() });

async function main() {
  try {
    const allTools = await getAllTools();
    const mcpServer = new FastMCP<SessionData>({
      name: 'Agentic-Forge-Server',
      version: '1.0.0',
      authenticate: async (request: IncomingMessage): Promise<SessionData> => {
        const sessionIdHeader = request.headers['x-session-id'];
        const sessionId = Array.isArray(sessionIdHeader) ? sessionIdHeader[0] : sessionIdHeader;

        if (!sessionId) {
          throw new Error('Bad Request: No valid session ID provided');
        }

        return {
          sessionId,
          headers: request.headers,
          clientIp: request.socket?.remoteAddress,
          authenticatedAt: Date.now(),
        };
      },
      health: { enabled: true, path: '/health' },
    });

    const goalHandlerTool: Tool<typeof goalHandlerParams> = {
        name: 'internal_goalHandler',
        description: "Handles the user's primary goal.",
        parameters: goalHandlerParams,
        execute: async (args, ctx) => {
            if (!ctx.session) throw new Error('Contexte de session manquant.');
            
            const session = await getOrCreateSession(ctx.session);
            const history: History = session.history;
            
            if (history.length === 0 || history[history.length - 1].content !== args.goal) {
                history.push({ role: 'user', content: args.goal });
            }

            const masterPrompt = getMasterPrompt(history, allTools);
            const llmResponse = await getLlmResponse(masterPrompt);
            history.push({ role: 'assistant', content: llmResponse });
            
            session.history = history;
            session.lastActivity = Date.now();
            await redis.set(
                `session:${session.id}`,
                JSON.stringify(session),
                'EX',
                SESSION_EXPIRATION_SECONDS,
            );

            const response: TextContent = { type: 'text', text: llmResponse };
            return response;
        }
    };
    
    for (const tool of allTools) {
      if(tool.name !== 'internal_goalHandler') mcpServer.addTool(tool);
    }
    mcpServer.addTool(goalHandlerTool);

    await mcpServer.start({
      transportType: 'httpStream',
      httpStream: { port: config.PORT },
    });
    logger.info(`🐉 Agentic Forge server started on 0.0.0.0:${config.PORT}`);
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to start server.');
    process.exit(1);
  }
}

void main();