import { FastMCP, UserError } from 'fastmcp';
import type { IncomingMessage } from 'http';
import { config } from './config.js';
import logger from './logger.js';
import { allTools } from './tools/index.js';
import type { AgentSession, Ctx } from './types.js';
import { getMasterPrompt } from './prompts/orchestrator.prompt.js';
import { getLlmResponse } from './utils/llmProvider.js';

// Auth handler creates the initial session data
const authHandler = async (req: IncomingMessage): Promise<Partial<AgentSession>> => {
  const authHeader = req.headers.authorization;
  // Use a more secure comparison
  if (authHeader !== `Bearer ${config.AUTH_TOKEN}`) {
    // Correctly throw UserError with an extras object
    throw new UserError('Invalid token', { statusCode: 403 });
  }
  // Return only the custom parts of the session
  return { history: [] };
};

// Instantiate FastMCP with the correct session type
const mcp = new FastMCP<AgentSession>({
  authHandler,
  tools: allTools,
  // Pass the full options object for the transport
  transport: {
    transportType: "httpStream",
    httpStream: {
      endpoint: '/api/v1/agent/stream',
      port: config.PORT,
    }
  },
  logger: { level: config.LOG_LEVEL, customLogger: logger },
  healthCheckOptions: { path: '/health' },

  // The conversation handler orchestrates the agent's logic
  async conversationHandler(goal: string, ctx: Ctx) {
    ctx.session.history.push({ role: 'user', content: goal });
    const masterPrompt = getMasterPrompt(ctx.session.history, allTools);
    const llmResponse = await getLlmResponse(masterPrompt);
    ctx.session.history.push({ role: 'assistant', content: llmResponse });
    return llmResponse;
  },
});

// Start the server
mcp.start().then(() => {
  logger.info(`🚀 Agentic Prometheus server started on port ${config.PORT}`);
}).catch(err => {
  logger.fatal({ err }, '💀 Server startup failed.');
  process.exit(1);
});
