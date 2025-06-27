// src/server.ts (Version consolidée et finale avec authentification statique)
import { FastMCP, type TextContent } from 'fastmcp';
import { z } from 'zod';
import { Redis } from 'ioredis';
import { config } from './config.js';
import logger from './logger.js';
import { getAllTools, type Tool } from './tools/index.js';
import { getMasterPrompt } from './prompts/orchestrator.prompt.js';
import { getLlmResponse } from './utils/llmProvider.js';
import type { AgentSession, SessionData } from './types.js';
import type { IncomingMessage } from 'http'; // CORRECTION: IncomingHttpHeaders retiré

const redis = new Redis({
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
});
redis.on('connect', () =>
  logger.info('✅ [Server] Connexion à Redis établie.'),
);
redis.on('error', (err) =>
  logger.error({ err }, '[Server] Erreur de connexion Redis.'),
);

const SESSION_EXPIRATION_SECONDS = 24 * 3600;

async function saveSession(session: AgentSession): Promise<void> {
  await redis.set(
    `session:${session.id}`,
    JSON.stringify(session),
    'EX',
    SESSION_EXPIRATION_SECONDS,
  );
}

async function getSession(sessionId: string): Promise<AgentSession | null> {
  const s = await redis.get(`session:${sessionId}`);
  return s ? (JSON.parse(s) as AgentSession) : null;
}

// CORRECTION : La fonction sanitizeHeaders a été supprimée car elle n'était pas utilisée.

async function main() {
  try {
    const allTools = await getAllTools();

    const mcpServer = new FastMCP<SessionData>({
      name: 'Agentic-Forge-Server',
      version: '1.0.0',
      authenticate: async (request: IncomingMessage): Promise<SessionData> => {
        const sessionIdHeader = request.headers['mcp-session-id'];
        const sessionId = Array.isArray(sessionIdHeader)
          ? sessionIdHeader[0]
          : sessionIdHeader;

        const log = logger.child({ op: 'authenticate', sessionId });
        log.info("Début de l'authentification de la requête MCP...");

        if (!sessionId) {
          log.warn(
            "Aucun ID de session valide fourni dans l'en-tête mcp-session-id.",
          );
          throw new Error('Bad Request: No valid session ID provided');
        }

        const agentSession = await getSession(sessionId);

        if (agentSession) {
          log.info(
            { session: { id: agentSession.id } },
            'Session autorisée trouvée.',
          );
          agentSession.lastActivity = Date.now();
          await saveSession(agentSession);
          return agentSession.auth;
        } else {
          log.warn(
            `Tentative de connexion avec un ID de session inconnu et non autorisé : ${sessionId}`,
          );
          throw new Error('Unauthorized: Unknown or invalid session ID');
        }
      },
      health: { enabled: true, path: '/health' },
    });

    const goalHandlerTool: Tool<z.ZodObject<{ goal: z.ZodString }>> = {
      name: 'internal_goalHandler',
      description: "Handles the user's primary goal.",
      parameters: z.object({ goal: z.string() }),
      execute: async (args, ctx) => {
        if (!ctx.session) throw new Error('Contexte de session manquant.');

        const agentSession = await getSession(ctx.session.sessionId);
        if (!agentSession) {
          throw new Error(
            `Erreur critique: Session ${ctx.session.sessionId} introuvable.`,
          );
        }

        agentSession.history.push({ role: 'user', content: args.goal });
        const llmResponse = await getLlmResponse(
          getMasterPrompt(agentSession.history, allTools),
        );
        agentSession.history.push({ role: 'assistant', content: llmResponse });

        await saveSession(agentSession);

        return { type: 'text', text: llmResponse } as TextContent;
      },
    };

    allTools.forEach((tool) => {
      if (tool.name !== 'internal_goalHandler') {
        mcpServer.addTool(tool);
      }
    });
    mcpServer.addTool(goalHandlerTool);

    await mcpServer.start({
      transportType: 'httpStream',
      httpStream: {
        port: config.PORT,
        endpoint: '/mcp',
      },
    });

    logger.info(
      `🐉 Agentic Forge server started on 0.0.0.0:${config.PORT}, listening at endpoint /mcp`,
    );
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to start server.');
    process.exit(1);
  }
}

void main();
