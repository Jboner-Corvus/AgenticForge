// src/server.ts
import http from 'http';
import { randomUUID } from 'crypto';
import { config } from './config.js';
import logger from './logger.js';
import { loadTools } from './utils/toolLoader.js';
import { getMasterPrompt } from './prompts/orchestrator.prompt.js';
import { getLlmResponse } from './utils/llmProvider.js';
import { runQualityGate } from './utils/qualityGate.js';
import { getErrDetails } from './utils/errorUtils.js';
import type { AuthData, Tool } from './types.js';

let allTools: Tool[] = [];

interface ServerSession {
  id: string;
  auth: AuthData;
  history: { role: 'user' | 'assistant'; content: string }[];
  createdAt: number;
  lastActivity: number;
}
const sessions = new Map<string, ServerSession>();

setInterval(
  () => {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    for (const [id, session] of sessions.entries()) {
      if (now - session.lastActivity > oneHour) {
        sessions.delete(id);
        logger.debug({ sessionId: id }, 'Session cleaned up due to inactivity');
      }
    }
  },
  30 * 60 * 1000,
);

function getOrCreateSession(
  authData: AuthData,
  sessionId?: string,
): ServerSession {
  const id = sessionId || randomUUID();
  let session = sessions.get(id);
  if (!session) {
    session = {
      id,
      auth: authData,
      history: [],
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };
    sessions.set(id, session);
    logger.info(
      { sessionId: id, clientIp: authData.clientIp },
      'New session created',
    );
  } else {
    session.lastActivity = Date.now();
  }
  return session;
}

async function runAutonomousLoop(session: ServerSession): Promise<string> {
  const MAX_LOOPS = 15;
  let loopCount = 0;
  const codeExecutionTools = [
    'executeDevCommand',
    'executePython',
    'system_createTool',
  ];

  while (loopCount < MAX_LOOPS) {
    loopCount++;
    const masterPrompt = getMasterPrompt(session.history, allTools);
    const llmResponse = await getLlmResponse(masterPrompt);
    session.history.push({ role: 'assistant', content: llmResponse });

    const toolCallMatch = llmResponse.match(
      /<tool_code>([\s\S]*?)<\/tool_code>/,
    );
    if (toolCallMatch && toolCallMatch[1]) {
      try {
        const toolCall = JSON.parse(toolCallMatch[1].trim());
        const toolName = toolCall.tool;

        if (codeExecutionTools.includes(toolName)) {
          const qualityResult = await runQualityGate();
          if (!qualityResult.success) {
            session.history.push({
              role: 'user',
              content: `Résultat: Le Quality Gate a échoué.\n${qualityResult.output}`,
            });
            continue;
          }
        }

        if (toolName === 'finish') {
          return toolCall.parameters.response || 'Tâche terminée.';
        }

        const tool = allTools.find((t) => t.name === toolName);
        if (tool) {
          const result = `Simulation du résultat pour l'outil ${toolName}.`;
          session.history.push({
            role: 'user',
            content: `Résultat: ${result}`,
          });
        } else {
          session.history.push({
            role: 'user',
            content: `Erreur: Outil '${toolName}' non trouvé.`,
          });
        }
      } catch (e) {
        session.history.push({
          role: 'user',
          content: `Erreur interne: ${(e as Error).message}`,
        });
      }
    } else {
      logger.info(
        { sessionId: session.id },
        "L'agent a répondu sans utiliser d'outil. Continuation de la boucle.",
      );
    }
  }
  return "L'agent a atteint sa limite d'actions sans terminer la tâche.";
}

async function processConversation(
  goal: string,
  session: ServerSession,
): Promise<string> {
  session.history.push({ role: 'user', content: goal });
  return await runAutonomousLoop(session);
}

async function handleRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Session-ID',
  );

  if (req.method === 'OPTIONS') {
    res.writeHead(200).end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  if (url.pathname === '/health') {
    res
      .writeHead(200, { 'Content-Type': 'text/plain' })
      .end('Agentic Forge Server - Healthy');
    return;
  }

  if (url.pathname === '/api/v1/agent/stream' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      void (async () => {
        try {
          if (
            (req.headers.authorization || '') !== `Bearer ${config.AUTH_TOKEN}`
          ) {
            res
              .writeHead(401, { 'Content-Type': 'application/json' })
              .end(JSON.stringify({ error: 'Unauthorized' }));
            return;
          }
          const data = JSON.parse(body);
          const authData: AuthData = {
            id: randomUUID(),
            type: 'Bearer',
            clientIp: req.socket.remoteAddress,
            authenticatedAt: Date.now(),
          };
          const session = getOrCreateSession(
            authData,
            req.headers['x-session-id'] as string,
          );
          const response = await processConversation(data.goal, session);
          res
            .writeHead(200, { 'Content-Type': 'application/json' })
            .end(JSON.stringify({ response, sessionId: session.id }));
        } catch (parseError) {
          // CORRECTION: Le message est maintenant fourni par getErrDetails.
          logger.error({
            ...getErrDetails(parseError),
            logContext: 'Error parsing request body',
            body,
          });
          res
            .writeHead(400, { 'Content-Type': 'application/json' })
            .end(
              JSON.stringify({ error: 'Bad Request', message: 'Invalid JSON' }),
            );
        }
      })();
    });
    return;
  }

  res
    .writeHead(404, { 'Content-Type': 'application/json' })
    .end(JSON.stringify({ error: 'Not Found' }));
}

async function startServer() {
  try {
    allTools = await loadTools();
    const server = http.createServer((req, res) => {
      handleRequest(req, res).catch((err) => {
        // CORRECTION: Le message est maintenant fourni par getErrDetails.
        logger.error({
          ...getErrDetails(err),
          logContext: 'Unhandled error in request handler',
        });
        if (!res.headersSent) {
          res
            .writeHead(500, { 'Content-Type': 'application/json' })
            .end(JSON.stringify({ error: 'Internal Server Error' }));
        }
      });
    });
    server.listen(config.PORT, '0.0.0.0', () => {
      logger.info(`🐉 Agentic Forge server started on 0.0.0.0:${config.PORT}`);
    });
  } catch (error) {
    // CORRECTION: Le message est maintenant fourni par getErrDetails.
    logger.fatal({
      ...getErrDetails(error),
      logContext: 'Impossible de démarrer le serveur.',
    });
    process.exit(1);
  }
}

void startServer();
