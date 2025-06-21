import { FastMCP, UserError, type ServerOptions } from 'fastmcp';
import type { IncomingMessage } from 'http';
import { randomUUID } from 'crypto';
import { config } from './config.js';
import logger from './logger.js';
import { allTools } from './tools/index.js';
import type { AgentSession, Ctx, AuthData } from './types.js';
import { getMasterPrompt } from './prompts/orchestrator.prompt.js';
import { getLlmResponse } from './utils/llmProvider.js';

// La configuration de la session, incluant la factory pour la créer.
const sessionOptions = {
  async create(req: IncomingMessage): Promise<Partial<AgentSession>> {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${config.AUTH_TOKEN}`) {
      throw new UserError('Invalid token', { statusCode: 403 });
    }

    const authData: AuthData = {
      id: randomUUID(),
      type: 'Bearer',
      clientIp: req.socket.remoteAddress,
      authenticatedAt: Date.now(),
    };

    return {
      history: [],
      auth: authData,
    };
  },
};

const mcp = new FastMCP<AgentSession>({
  session: sessionOptions,
  tools: allTools,
  transport: {
    transportType: 'httpStream',
    httpStream: {
      endpoint: '/api/v1/agent/stream',
      port: config.PORT,
    },
  },
  logger: { level: config.LOG_LEVEL, customLogger: logger },
  healthCheckOptions: { path: '/health' },

  async conversationHandler(goal: string, ctx: Ctx) {
    if (!ctx.session) {
      throw new Error('Session is not available in conversationHandler');
    }
    ctx.session.history.push({ role: 'user', content: goal });
    const masterPrompt = getMasterPrompt(ctx.session.history, allTools);
    const llmResponse = await getLlmResponse(masterPrompt);
    ctx.session.history.push({ role: 'assistant', content: llmResponse });
    return llmResponse;
  },
} as any);

mcp
  .start()
  .then(() => {
    logger.info(`🚀 Agentic Prometheus server started on port ${config.PORT}`);
  })
  .catch((err) => {
    logger.fatal({ err }, '💀 Server startup failed.');
    process.exit(1);
  });
