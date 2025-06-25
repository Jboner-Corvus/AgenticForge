// src/server.ts (Version finale et correcte)
import { FastMCP, type TextContent } from 'fastmcp';
import { z } from 'zod';
import { Redis } from 'ioredis';
import { config } from './config.js';
import logger from './logger.js';
import { getAllTools, type Tool } from './tools/index.js';
import { getMasterPrompt } from './prompts/orchestrator.prompt.js';
import { getLlmResponse } from './utils/llmProvider.js';
import type { AgentSession, SessionData } from './types.js';
import type { IncomingMessage, IncomingHttpHeaders } from 'http';

// ... (Le reste du code reste identique)
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
function sanitizeHeaders(headers: IncomingHttpHeaders): Record<string, string> {
  const serializableHeaders: Record<string, string> = {};
  const allowed = ['user-agent', 'referer', 'accept-language', 'content-type'];
  for (const key in headers) {
    if (allowed.includes(key.toLowerCase())) {
      const value = headers[key];
      if (typeof value === 'string') serializableHeaders[key] = value;
    }
  }
  return serializableHeaders;
}
// ...

async function main() {
  try {
    const allTools = await getAllTools();

    const mcpServer = new FastMCP<SessionData>({
      name: 'Agentic-Forge-Server',
      version: '1.0.0',
      authenticate: async (request: IncomingMessage): Promise<SessionData> => {
        // ... (la logique d'authentification reste identique)
        const log = logger.child({ op: 'authenticate', sessionId: request.headers['mcp-session-id'] });
        log.info('Début de l\'authentification de la requête MCP...');
        const sessionIdHeader = request.headers['mcp-session-id'];
        const sessionId = Array.isArray(sessionIdHeader) ? sessionIdHeader[0] : sessionIdHeader;
        if (!sessionId) {
          log.warn('Aucun ID de session valide fourni dans l\'en-tête mcp-session-id.');
          throw new Error('Bad Request: No valid session ID provided');
        }
        let agentSession = await getSession(sessionId);
        if (agentSession) {
          log.info('Session existante trouvée.');
          agentSession.lastActivity = Date.now();
        } else {
          log.info('Aucune session existante, création d\'une nouvelle session.');
          const sessionData: SessionData = { sessionId, headers: sanitizeHeaders(request.headers), clientIp: request.socket?.remoteAddress, authenticatedAt: Date.now() };
          agentSession = { id: sessionId, auth: sessionData, history: [], createdAt: Date.now(), lastActivity: Date.now() };
        }
        await saveSession(agentSession);
        log.info('Authentification terminée avec succès.');
        return agentSession.auth;
      },
      health: { enabled: true, path: '/health' },
    });
    
    // ... (la logique d'ajout des outils reste identique)
    const goalHandlerTool: Tool<z.ZodObject<{ goal: z.ZodString }>> = { name: 'internal_goalHandler', description: "Handles the user's primary goal.", parameters: z.object({ goal: z.string() }), execute: async (args, ctx) => { if (!ctx.session) throw new Error('Contexte de session manquant.'); const session = await getSession(ctx.session.sessionId); if (!session) throw new Error(`Erreur critique: Session ${ctx.session.sessionId} introuvable.`); session.history.push({ role: 'user', content: args.goal }); const llmResponse = await getLlmResponse(getMasterPrompt(session.history, allTools)); session.history.push({ role: 'assistant', content: llmResponse }); await saveSession(session); return { type: 'text', text: llmResponse } as TextContent; }, }; allTools.forEach((tool) => { if (tool.name !== 'internal_goalHandler') { mcpServer.addTool(tool); } }); mcpServer.addTool(goalHandlerTool);


    // LA CORRECTION FINALE EST ICI :
    await mcpServer.start({
      transportType: 'httpStream',
      httpStream: {
        port: config.PORT,
        endpoint: '/mcp', // Utilisation de 'endpoint' au lieu de 'path'
      },
    });

    logger.info(`🐉 Agentic Forge server started on 0.0.0.0:${config.PORT}, listening at endpoint /mcp`);
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to start server.');
    process.exit(1);
  }
}

void main();