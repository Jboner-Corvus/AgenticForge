// src/server.ts (Version Corrigée pour la Gestion de Session)
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

const redis = new Redis({
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  retryStrategy: times => Math.min(times * 50, 2000),
});

redis.on('error', (err) => logger.error({ err }, 'Redis Connection Error'));

const SESSION_EXPIRATION_SECONDS = 24 * 3600;

async function getOrCreateSession(sessionData: SessionData): Promise<AgentSession> {
    const { sessionId } = sessionData;
    const sessionKey = `session:${sessionId}`;
    const sessionString = await redis.get(sessionKey);
    
    if (sessionString) {
        return JSON.parse(sessionString) as AgentSession;
    }
    
    logger.warn({ sessionId }, "Session not found in Redis. Creating a new one.");
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
    logger.info({ sessionId }, "New session created and saved.");
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
            if (!ctx.session) throw new Error('Session context is missing.');
            
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

            return { type: 'text', text: llmResponse };
        }
    };
    
    // On ajoute tous les outils au serveur
    for (const tool of allTools) {
      if(tool.name !== 'internal_goalHandler') {
        mcpServer.addTool(tool);
      }
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