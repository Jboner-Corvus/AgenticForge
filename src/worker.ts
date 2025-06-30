import { Job, Worker } from 'bullmq';
import { redis } from './redisClient';
import logger from './logger';
import { getLlmResponse } from './utils/llmProvider.js';
import { loadTools } from './utils/toolLoader';
import { sendWebhook } from './utils/webhookUtils';
import { config } from './config';
import { Message, Tool, SessionData } from './types';
import { FastMCP, FastMCPSession } from 'fastmcp';

const availableTools = loadTools();

// Initialize FastMCP server in the worker
const mcpWorkerServer = new FastMCP<SessionData>({
  name: 'agentic-forge-server',
  version: '1.0.0',
});

// Register tools with FastMCP server
for (const tool of availableTools) {
  mcpWorkerServer.addTool(tool);
}

// Map to store active FastMCPSessions by sessionId
const activeSessions = new Map<string, FastMCPSession<SessionData>>();

export async function processJob(job: Job): Promise<any> {
  const { prompt, sessionId } = job.data;
  const log = logger.child({ jobId: job.id, sessionId });
  const historyKey = `session:${sessionId}:history`;

  let session: FastMCPSession<SessionData>;
  if (activeSessions.has(sessionId)) {
    session = activeSessions.get(sessionId)!;
    log.info('Reusing existing FastMCP session.');
  } else {
    const storedHistory = await redis.get(historyKey);
    const initialHistory: Message[] = storedHistory ? JSON.parse(storedHistory) : [];

    const sessionData: SessionData = {
      id: sessionId,
      identities: [{ id: 'user', type: 'email' }],
      history: initialHistory,
    };

    session = new FastMCPSession<SessionData>({
      name: 'agentic-forge-session',
      version: '1.0.0',
      auth: sessionData,
      prompts: [], // No prompts directly in session
      resources: [], // No resources directly in session
      resourcesTemplates: [], // No resource templates directly in session
      tools: availableTools, // Pass tools to the session
    });
    activeSessions.set(sessionId, session);
    log.info('Created new FastMCP session.');
  }

  try {
    // Add user prompt to session history
    session.auth!.history.push({ role: 'user', content: prompt });

    // Use FastMCP's requestSampling to get model response and trigger tools
    const result = await session.requestSampling({
      messages: session.auth!.history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
    });

    const modelResponseContent = result.content.text; // Assuming text content
    const modelMessage: Message = { role: 'model', content: modelResponseContent };
    session.auth!.history.push(modelMessage);

    // Save updated history to Redis
    await redis.set(historyKey, JSON.stringify(session.auth!.history), 'EX', 7 * 24 * 60 * 60);

    if (config.MCP_WEBHOOK_URL && config.MCP_API_KEY) {
      await sendWebhook(config.MCP_WEBHOOK_URL, {
        jobId: job.id, sessionId, status: 'completed', output: modelResponseContent,
      }, job.id, 'process-message', false, config.MCP_API_KEY);
    }
    return modelResponseContent;
  } catch (error) {
    log.error({ error }, 'Erreur dans le worker');
    if (config.MCP_WEBHOOK_URL && config.MCP_API_KEY) {
      await sendWebhook(config.MCP_WEBHOOK_URL, {
        jobId: job.id, sessionId, status: 'failed', error: (error as Error).message,
      }, job.id, 'process-message', false, config.MCP_API_KEY);
    }
    throw error;
  } finally {
    // Optionally close session if it's short-lived, or manage lifecycle elsewhere
    // For now, keep it active for subsequent messages in the same session
  }
}

export async function startWorker() {
  const worker = new Worker('tasks', async (job) => {
    logger.info(`Processing job ${job.id} of type ${job.name}`);
    return processJob(job);
  }, {
    connection: redis,
    concurrency: config.WORKER_CONCURRENCY,
  });

  worker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed.`);
  });

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, `Job ${job?.id} failed.`);
  });

  logger.info('Worker démarré et écoute les tâches...');
}