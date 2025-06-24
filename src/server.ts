// src/server.ts (Version finale corrigée selon la documentation FastMCP)
import { FastMCP, type TextContent } from 'fastmcp';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { Redis } from 'ioredis';
import { config } from './config.js';
import logger from './logger.js';
import { getAllTools, type Tool } from './tools/index.js';
import { getMasterPrompt } from './prompts/orchestrator.prompt.js';
import { getLlmResponse } from './utils/llmProvider.js';
import { getErrDetails } from './utils/errorUtils.js';
import type { AgentSession, History } from './types.js';
import type { IncomingHttpHeaders } from 'http';

// Interface pour les données de session FastMCP
interface SessionData {
  sessionId: string;
  headers: IncomingHttpHeaders;
  clientIp?: string;
  authenticatedAt: number;
  [key: string]: unknown;
}

// --- GESTION DE SESSION VIA REDIS ---
const redis = new Redis({
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
});
redis.on('error', (err) => logger.error({ err }, 'Redis connection error'));
const SESSION_EXPIRATION_SECONDS = 24 * 3600;

async function getOrCreateSession(sessionData: SessionData): Promise<AgentSession> {
    const { sessionId } = sessionData;
    const sessionKey = `session:${sessionId}`;
    const sessionString = await redis.get(sessionKey);
    if (sessionString) {
        const session: AgentSession = JSON.parse(sessionString);
        session.lastActivity = Date.now();
        await redis.set(
        sessionKey,
        JSON.stringify(session),
        'EX',
        SESSION_EXPIRATION_SECONDS,
        );
        return session;
    }
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
    logger.info({ sessionId }, 'New session created in Redis');
    return newSession;
}

const goalHandlerParams = z.object({
  goal: z.string().describe("The user's main objective."),
  sessionId: z.string().min(1).describe('The session identifier.'),
});

const goalHandlerTool: Tool<typeof goalHandlerParams> = {
  name: 'internal_goalHandler',
  description: "Handles the user's goal to start the agent loop.",
  parameters: goalHandlerParams,
  execute: async (args, ctx) => {
    if (!ctx.session) throw new Error('Session data not found in context');
    const allAvailableTools = await getAllTools();
    const session = await getOrCreateSession(ctx.session as SessionData);
    const history: History = session.history;
    if (
      history.length === 0 ||
      history[history.length - 1].content !== args.goal
    ) {
      history.push({ role: 'user', content: args.goal });
    }
    let finalResponse = 'Agent loop limit reached.';
    for (let i = 0; i < 15; i++) {
      const masterPrompt = getMasterPrompt(history, allAvailableTools);
      const llmResponse = await getLlmResponse(masterPrompt);
      history.push({ role: 'assistant', content: llmResponse });
      const toolCallMatch = llmResponse.match(
        /<tool_code>([\s\S]*?)<\/tool_code>/,
      );
      if (!toolCallMatch?.[1]) {
        finalResponse = llmResponse
          .replace(/<thought>[\s\S]*?<\/thought>/, '')
          .trim();
        break;
      }
      try {
        const toolCall = JSON.parse(toolCallMatch[1].trim());
        const { tool: toolName, parameters } = toolCall;
        if (toolName === 'finish') {
          finalResponse = parameters.response || 'Task completed.';
          break;
        }
        const toolToExecute = allAvailableTools.find(
          (t) => t.name === toolName,
        );
        if (toolToExecute) {
          ctx.log.info(`Executing tool: ${toolName}`, { parameters });
          const result = await toolToExecute.execute(parameters, ctx);
          const resultText =
            typeof result === 'string'
              ? result
              : (result as TextContent)?.text ||
                JSON.stringify(result) ||
                'Tool executed with no text output.';
          history.push({ role: 'user', content: `Tool Output: ${resultText}` });
        } else {
          history.push({
            role: 'user',
            content: `Error: Tool '${toolName}' not found.`,
          });
        }
      } catch (e) {
        history.push({
          role: 'user',
          content: `Error executing tool: ${(e as Error).message}`,
        });
      }
    }
    session.history = history;
    await redis.set(
      `session:${session.id}`,
      JSON.stringify(session),
      'EX',
      SESSION_EXPIRATION_SECONDS,
    );
    return { type: 'text', text: finalResponse };
  },
};

async function main() {
  try {
    const allTools = await getAllTools();
    const mcpServer = new FastMCP<SessionData>({
      name: 'Agentic-Forge-Server',
      version: '1.0.0',
      // Authentification selon la vraie documentation FastMCP
      authenticate: async (request) => {
        logger.info('Authentication request', { 
          headers: Object.keys(request.headers),
          method: request.method,
          url: request.url 
        });

        // Vérifier le token Bearer
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          logger.warn('Missing or invalid Authorization header');
          throw new Response(null, {
            status: 401,
            statusText: 'Unauthorized: Missing Bearer token',
          });
        }

        const token = authHeader.split(' ')[1];
        if (token !== config.AUTH_TOKEN) {
          logger.warn('Invalid auth token provided');
          throw new Response(null, {
            status: 401,
            statusText: 'Unauthorized: Invalid token',
          });
        }

        // Récupérer ou générer un ID de session
        let sessionId = request.headers['x-session-id'] as string | undefined;
        if (!sessionId) {
          sessionId = `session-${randomUUID()}`;
          logger.info('Generated new session ID', { sessionId });
        }

        // Retourner les données de session selon le format FastMCP
        const sessionData: SessionData = {
          sessionId,
          headers: request.headers,
          clientIp: request.socket?.remoteAddress,
          authenticatedAt: Date.now(),
        };

        logger.info('Authentication successful', { sessionId });
        return sessionData;
      },
      health: { enabled: true, path: '/health' },
    });

    // Écouter les événements de connexion pour le debug
    mcpServer.on('connect', (event) => {
      logger.info('Client connected', { 
        hasSession: !!event.session
      });
    });

    mcpServer.on('disconnect', (event) => {
      logger.info('Client disconnected', { 
        hasSession: !!event.session
      });
    });

    for (const tool of allTools) {
      mcpServer.addTool(tool);
    }
    mcpServer.addTool(goalHandlerTool);

    await mcpServer.start({
      transportType: 'httpStream',
      httpStream: { port: config.PORT, endpoint: '/mcp' },
    });

    logger.info(
      `🐉 Agentic Forge (FastMCP) server started on 0.0.0.0:${config.PORT}`,
    );
  } catch (error) {
    logger.fatal({ ...getErrDetails(error) }, 'Failed to start server.');
    process.exit(1);
  }
}

void main();