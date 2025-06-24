// src/server.ts (Version Finale, Complète et Corrigée)
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

// --- Configuration de Redis ---
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
redis.on('error', (err) => logger.error({ err }, 'Erreur de connexion Redis.'));

const SESSION_EXPIRATION_SECONDS = 24 * 3600;

// --- Fonctions de gestion de session (Implémentation complète) ---

async function saveSession(session: AgentSession): Promise<void> {
    const sessionKey = `session:${session.id}`;
    await redis.set(
        sessionKey,
        JSON.stringify(session),
        'EX',
        SESSION_EXPIRATION_SECONDS,
    );
}

async function getSession(sessionId: string): Promise<AgentSession | null> {
    const sessionKey = `session:${sessionId}`;
    const sessionString = await redis.get(sessionKey);
    if (!sessionString) {
        return null;
    }
    return JSON.parse(sessionString) as AgentSession;
}

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
        const log = logger.child({ op: 'authenticate' });
        const sessionIdHeader = request.headers['mcp-session-id'];
        const sessionId = Array.isArray(sessionIdHeader) ? sessionIdHeader[0] : sessionIdHeader;
        
        if (!sessionId) {
          log.error("Aucun en-tête 'mcp-session-id' valide fourni.");
          throw new Error('Bad Request: No valid session ID provided');
        }
        
        log.info({ sessionId }, "Début du processus d'authentification de session.");
        let agentSession = await getSession(sessionId);

        if (!agentSession) {
          log.warn({ sessionId }, "Session non trouvée. Création d'une nouvelle session.");
          const sanitized = sanitizeHeaders(request.headers);
          const sessionData: SessionData = {
              sessionId: sessionId,
              headers: sanitized,
              clientIp: request.socket?.remoteAddress,
              authenticatedAt: Date.now(),
          };
          agentSession = { id: sessionId, auth: sessionData, history: [], createdAt: Date.now(), lastActivity: Date.now() };
        } else {
            log.info({ sessionId }, "Session existante trouvée.");
            agentSession.lastActivity = Date.now();
        }

        await saveSession(agentSession);
        return agentSession.auth;
      },
      health: { enabled: true, path: '/health' },
    });

    const goalHandlerTool: Tool<z.ZodObject<{ goal: z.ZodString }>> = {
        name: 'internal_goalHandler',
        description: "Handles the user's primary goal.",
        parameters: z.object({ goal: z.string() }),
        execute: async (args, ctx) => {
            if (!ctx.session) throw new Error('Contexte de session manquant.');
            const session = await getSession(ctx.session.sessionId);
            if (!session) throw new Error(`Erreur critique: Session ${ctx.session.sessionId} introuvable.`);
            
            const history: History = session.history;
            if (history.length === 0 || history[history.length - 1].content !== args.goal) {
                history.push({ role: 'user', content: args.goal });
            }
            const masterPrompt = getMasterPrompt(history, allTools);
            const llmResponse = await getLlmResponse(masterPrompt);
            history.push({ role: 'assistant', content: llmResponse });
            session.history = history;
            await saveSession(session);
            return { type: 'text', text: llmResponse } as TextContent;
        }
    };
    
    for (const tool of allTools) {
      if (tool.name !== 'internal_goalHandler') mcpServer.addTool(tool);
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