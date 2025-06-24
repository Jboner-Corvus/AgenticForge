// src/server.ts (Version Finale avec Connexion Redis Robuste et Correction de Session)
import { FastMCP, type TextContent } from 'fastmcp';
import { z } from 'zod';
import { Redis } from 'ioredis';
import { config } from './config.js';
import logger from './logger.js';
import { getAllTools, type Tool } from './tools/index.js';
import { getMasterPrompt } from './prompts/orchestrator.prompt.js';
import { getLlmResponse } from './utils/llmProvider.js';
import type { AgentSession, History, SessionData } from './types.js';
import type { IncomingMessage, IncomingHttpHeaders } from 'http';

// Configuration Redis (inchangée)
const redis = new Redis({
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    logger.warn(`Redis: Tentative de reconnexion #${times}. Prochaine dans ${delay}ms.`);
    return delay;
  },
});

redis.on('connect', () => logger.info('✅ Connexion à Redis établie.'));
redis.on('ready', () => logger.info('✅ Redis est prêt à recevoir des commandes.'));
redis.on('error', (err) => logger.error({ err }, 'Erreur de connexion Redis.'));

const SESSION_EXPIRATION_SECONDS = 24 * 3600;

// Fonction pour sauvegarder/mettre à jour la session (inchangée)
async function saveSession(session: AgentSession) {
    await redis.set(
        `session:${session.id}`,
        JSON.stringify(session),
        'EX',
        SESSION_EXPIRATION_SECONDS,
    );
}

// Fonction pour récupérer la session (inchangée)
async function getSession(sessionId: string): Promise<AgentSession | null> {
    const sessionString = await redis.get(`session:${sessionId}`);
    return sessionString ? JSON.parse(sessionString) as AgentSession : null;
}

/**
 * NOUVELLE FONCTION: Assainit les en-têtes pour éviter les erreurs de sérialisation.
 * Ne conserve que les en-têtes simples et utiles.
 */
function sanitizeHeaders(headers: IncomingHttpHeaders): Record<string, string> {
  const serializableHeaders: Record<string, string> = {};
  const allowedHeaders = ['user-agent', 'referer', 'accept-language', 'content-type'];
  for (const key in headers) {
    if (allowedHeaders.includes(key.toLowerCase())) {
      const value = headers[key];
      if (typeof value === 'string') {
        serializableHeaders[key] = value;
      }
    }
  }
  return serializableHeaders;
}

async function main() {
  try {
    const allTools = await getAllTools();
    const mcpServer = new FastMCP<SessionData>({
      name: 'Agentic-Forge-Server',
      version: '1.0.0',
      authenticate: async (request: IncomingMessage): Promise<SessionData> => {
        // CORRECTION 1: Utiliser 'mcp-session-id' pour correspondre au client.
        const sessionIdHeader = request.headers['mcp-session-id'];
        const sessionId = Array.isArray(sessionIdHeader) ? sessionIdHeader[0] : sessionIdHeader;

        if (!sessionId) {
          throw new Error('Bad Request: No valid session ID provided');
        }
        
        // CORRECTION 2: Assainir les en-têtes avant de les stocker.
        const serializableHeaders = sanitizeHeaders(request.headers);

        return {
          sessionId,
          headers: serializableHeaders, // Utiliser l'objet assaini
          clientIp: request.socket?.remoteAddress,
          authenticatedAt: Date.now(),
        };
      },
      health: { enabled: true, path: '/health' },
    });
    
    // ... La logique de getOrCreateSession est déplacée à l'intérieur du goalHandler pour plus de clarté
    const getOrCreateSession = async (sessionData: SessionData): Promise<AgentSession> => {
        const existingSession = await getSession(sessionData.sessionId);
        if (existingSession) {
            return existingSession;
        }

        const newSession: AgentSession = {
            id: sessionData.sessionId,
            auth: sessionData,
            history: [],
            createdAt: Date.now(),
            lastActivity: Date.now(),
        };
        await saveSession(newSession);
        logger.info({ sessionId: newSession.id }, "Nouvelle session créée et sauvegardée.");
        return newSession;
    }


    const goalHandlerTool: Tool<z.ZodObject<{ goal: z.ZodString }>> = {
        name: 'internal_goalHandler',
        description: "Handles the user's primary goal.",
        parameters: z.object({ goal: z.string() }),
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
            await saveSession(session);

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