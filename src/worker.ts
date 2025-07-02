import { Job, Worker } from 'bullmq';
import { FastMCP, FastMCPSession } from 'fastmcp';

import { config } from './config.js';
import logger from './logger.js';
import { jobQueue } from './queue.js'; // Import jobQueue
import { redis } from './redisClient.js';
import { Message, SessionData } from './types.js'; // Removed Tool
import { getTools } from './utils/toolLoader.js'; // Added .js
import { sendWebhook } from './utils/webhookUtils.js'; // Added .js

const availableTools = await getTools();

// Initialize FastMCP server in the worker
const mcpWorkerServer = new FastMCP<SessionData>({
  name: 'agentic-forge-server',
  version: '1.0.0',
});

// Register tools with FastMCP server
for (const tool of availableTools) {
  mcpWorkerServer.addTool(tool);
}

// Map to store active SessionData by sessionId
const activeSessions = new Map<string, SessionData>();

export async function processJob(job: Job): Promise<any> {
  const { prompt, sessionId } = job.data;
  const log = logger.child({ jobId: job.id, sessionId });
  const historyKey = `session:${sessionId}:history`;

  let sessionData: SessionData;
  if (activeSessions.has(sessionId)) {
    sessionData = activeSessions.get(sessionId)!;
    log.info('Reusing existing session data.');
  } else {
    const storedHistory = await redis.get(historyKey);
    const initialHistory: Message[] = storedHistory ? JSON.parse(storedHistory) : [];

    sessionData = {
      history: initialHistory,
      id: sessionId,
      identities: [{ id: 'user', type: 'email' }],
    };
    activeSessions.set(sessionId, sessionData);
    log.info('Created new session data.');
  }

  try {
    // Add user prompt to session history
    sessionData.history.push({ content: prompt, role: 'user' });

    const session = new FastMCPSession<SessionData>({
      auth: sessionData,
      name: 'agentic-forge-session',
      prompts: [], // No prompts directly in session
      resources: [], // No resources directly in session
      resourcesTemplates: [], // No resource templates directly in session
      tools: availableTools as any, // Pass tools to the session
      version: '1.0.0',
    });

    // Use FastMCP's requestSampling to get model response and trigger tools
    const result = await session.requestSampling({
      messages: sessionData.history.map((msg: Message) => ({
        content: { type: 'text', text: msg.content },
        role: msg.role === 'user' ? 'user' : 'assistant',
      })),
      maxTokens: 2000, // Add maxTokens as required by the error
    });

    const modelResponseContent: string = (() => {
      if (result.content && 'text' in result.content && typeof result.content.text === 'string') {
        return result.content.text;
      }
      return JSON.stringify(result.content ?? {});
    })();

    const modelMessage: Message = { content: modelResponseContent, role: 'model' };
    sessionData.history.push(modelMessage);

    // Save updated history to Redis
    await redis.set(historyKey, JSON.stringify(sessionData.history), 'EX', 7 * 24 * 60 * 60);

    if (config.MCP_WEBHOOK_URL && config.MCP_API_KEY) {
      const webhookUrl: string = config.MCP_WEBHOOK_URL;
      await sendWebhook(webhookUrl, {
        inParams: { prompt, sessionId }, // Include original parameters
        msg: 'Job completed successfully.',
        result: modelResponseContent ?? '',
        status: 'completed',
        taskId: job.id,
        ts: new Date().toISOString(),
      }, job.id, 'process-message', false);
    }
    return modelResponseContent;
  } catch (error) {
    log.error({ error }, 'Erreur dans le worker');
    if (config.MCP_WEBHOOK_URL && config.MCP_API_KEY) {
      const webhookUrl: string = config.MCP_WEBHOOK_URL;
      await sendWebhook(webhookUrl, {
        inParams: { prompt, sessionId }, // Include original parameters
        error: { message: (error as Error).message ?? 'Unknown error', name: (error as Error).name ?? 'UnknownError' },
        msg: 'Job failed.',
        status: 'error',
        taskId: job.id,
        ts: new Date().toISOString(),
      }, job.id, 'process-message', false);
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
    concurrency: config.WORKER_CONCURRENCY,
    connection: redis,
  });

  worker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed.`);
  });

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, `Job ${job?.id} failed.`);
  });

  logger.info('Worker démarré et écoute les tâches...');
}