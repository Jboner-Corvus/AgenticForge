// src/server.ts (Finalisé)
import { FastMCP } from 'fastmcp';
// CORRECTION : Le type 'Context' a été retiré car il est inféré et non utilisé directement.
import type { TextContent } from 'fastmcp';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { config } from './config.js';
import logger from './logger.js';
import { loadTools } from './utils/toolLoader.js';
import { getMasterPrompt } from './prompts/orchestrator.prompt.js';
import { getLlmResponse } from './utils/llmProvider.js';
import { getErrDetails } from './utils/errorUtils.js';
import type { AgentSession, AuthData, History, Tool } from './types.js';

const sessions = new Map<string, AgentSession>();

function getOrCreateSession(
  authData: AuthData,
  sessionId?: string,
): AgentSession {
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

const goalHandlerParams = z.object({
  goal: z.string().describe("The user's main objective."),
  sessionId: z.string().describe('The session identifier.'),
});

const goalHandlerTool: Tool<typeof goalHandlerParams> = {
  name: 'internal_goalHandler',
  description: "Handles the user's goal to start the agent loop.",
  parameters: goalHandlerParams,
  execute: async (args, ctx) => {
    if (!ctx.session) throw new Error('AuthData not found in context');

    const allAvailableTools = await loadTools();
    const session = sessions.get(args.sessionId);
    if (!session) {
      throw new Error(`Session with ID ${args.sessionId} not found.`);
    }

    const history: History = session.history;
    if (history.length === 0) {
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
              : (result as TextContent)?.text || 'Tool executed.';
          history.push({
            role: 'user',
            content: `Tool Output: ${resultText}`,
          });
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
    return { type: 'text', text: finalResponse };
  },
};

async function main() {
  try {
    const allTools = await loadTools();
    const mcpServer = new FastMCP<AuthData>({
      name: 'Agentic-Forge-Server',
      version: '1.0.0',
      authenticate: async (req) => {
        const token = req.headers.authorization?.split(' ')[1];
        if (token !== config.AUTH_TOKEN) throw new Error('Invalid auth token');

        const sessionIdHeader = req.headers['x-session-id'] as
          | string
          | undefined;
        let session = sessions.get(sessionIdHeader || '');

        const authData: AuthData = {
          id: randomUUID(),
          sessionId: session?.id || sessionIdHeader || randomUUID(),
          type: 'Bearer',
          clientIp: req.socket.remoteAddress,
          authenticatedAt: Date.now(),
        };

        if (!session) {
          session = getOrCreateSession(authData, authData.sessionId);
          sessions.set(session.id, session);
        }

        return authData;
      },
      health: { enabled: true, path: '/health' },
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

// CORRECTION : `void` est ajouté pour gérer correctement la promesse "flottante".
void main();
