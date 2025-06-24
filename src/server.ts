// src/server.ts (Tentative Finale - Authentification Désactivée)
import { FastMCP, type TextContent } from 'fastmcp';
import { z } from 'zod';
import { Redis } from 'ioredis';
import { config } from './config.js';
import logger from './logger.js';
import { getAllTools, type Tool } from './tools/index.js';
import { getMasterPrompt } from './prompts/orchestrator.prompt.js';
import { getLlmResponse } from './utils/llmProvider.js';
import { getErrDetails } from './utils/errorUtils.js';
import type { AgentSession, History, SessionData } from './types.js';
import type { IncomingMessage } from 'http';

const redis = new Redis({
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 2000);
    logger.warn(`Redis: Tentative de reconnexion #${times}. Prochaine dans ${delay}ms.`);
    return delay;
  },
});

redis.on('connect', () => logger.info('✅ Connecté à Redis avec succès.'));
redis.on('error', (err) => logger.error({ err }, 'Erreur de connexion Redis'));

const SESSION_EXPIRATION_SECONDS = 24 * 3600;

// Cette fonction est maintenant appelée manuellement
async function getOrCreateSession(
  sessionId: string,
  request: IncomingMessage,
): Promise<AgentSession> {
  const sessionKey = `session:${sessionId}`;
  const sessionString = await redis.get(sessionKey);
  if (sessionString) {
    return JSON.parse(sessionString);
  }
  const newSession: AgentSession = {
    id: sessionId,
    // On crée un objet SessionData manuellement
    auth: {
      sessionId,
      headers: request.headers,
      clientIp: request.socket?.remoteAddress,
      authenticatedAt: Date.now(),
    },
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
});

async function main() {
  try {
    const allTools = await getAllTools();
    const mcpServer = new FastMCP<SessionData>({
      name: 'Agentic-Forge-Server',
      version: '1.0.0',
      // --- CORRECTION RADICALE : ON RETIRE LA FONCTION D'AUTHENTIFICATION ---
      // Le framework ne tentera plus de valider la session en amont.
      // Nous le ferons nous-mêmes au début de l'exécution de l'outil.
      health: { enabled: true, path: '/health' },
    });

    const goalHandlerTool: Tool<typeof goalHandlerParams> = {
      name: 'internal_goalHandler',
      description: "Handles the user's goal to start the agent loop.",
      parameters: goalHandlerParams,
      // La logique de session est déplacée ici
      execute: async (args, ctx) => {
        // On récupère l'en-tête ici, au sein de l'outil
        const sessionIdHeader = ctx.rawRequest?.headers['x-session-id'];
        const sessionId = Array.isArray(sessionIdHeader) ? sessionIdHeader[0] : sessionIdHeader;
        
        if (!sessionId || !ctx.rawRequest) {
            const errorMsg = "Session ID missing inside tool execution. This is a critical failure.";
            logger.error({ headers: ctx.rawRequest?.headers }, errorMsg);
            throw new Error(errorMsg);
        }
        
        const session = await getOrCreateSession(sessionId, ctx.rawRequest);
        const history: History = session.history;
        if (
          history.length === 0 ||
          history[history.length - 1].content !== args.goal
        ) {
          history.push({ role: 'user', content: args.goal });
        }
        let finalResponse = "La limite de la boucle de l'agent a été atteinte.";
        for (let i = 0; i < 15; i++) {
          const masterPrompt = getMasterPrompt(history, allTools);
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
              finalResponse = parameters.response || 'Tâche terminée.';
              break;
            }
            const toolToExecute = allTools.find((t) => t.name === toolName);
            if (toolToExecute) {
              const result = await toolToExecute.execute(parameters, ctx);
              const resultText =
                typeof result === 'string'
                  ? result
                  : (result as TextContent)?.text ||
                    JSON.stringify(result) ||
                    "L'outil a été exécuté sans sortie de texte.";
              history.push({
                role: 'user',
                content: `Tool Output: ${resultText}`,
              });
            } else {
              history.push({
                role: 'user',
                content: `Erreur : Outil '${toolName}' non trouvé.`,
              });
            }
          } catch (e) {
            history.push({
              role: 'user',
              content: `Erreur lors de l'exécution de l'outil : ${(e as Error).message}`,
            });
          }
        }
        session.history = history;
        session.lastActivity = Date.now();
        await redis.set(
          `session:${session.id}`,
          JSON.stringify(session),
          'EX',
          SESSION_EXPIRATION_SECONDS,
        );
        return { type: 'text', text: finalResponse };
      },
    };

    for (const tool of allTools) mcpServer.addTool(tool);
    mcpServer.addTool(goalHandlerTool);

    await mcpServer.start({
      transportType: 'httpStream',
      httpStream: { port: config.PORT },
    });

    logger.info(
      `🐉 Agentic Forge (FastMCP) server started on 0.0.0.0:${config.PORT} with default endpoint /mcp`,
    );
  } catch (error) {
    const errorDetailsString = JSON.stringify(getErrDetails(error), null, 2);
    logger.fatal(
      `Failed to start server. Error details: ${errorDetailsString}`,
    );
    process.exit(1);
  }
}

void main();
