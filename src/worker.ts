import { Worker } from 'bullmq';
import { config } from './config.js';
import logger from './logger.js';
import { taskQueue, deadLetterQueue, redisConnection } from './queue.js';
import { allTools } from './tools/index.js';
import { getContentWorkerLogic } from './tools/browser/getContent.tool.js';
import { navigateWorkerLogic } from './tools/browser/navigate.tool.js';
import type { AsyncTaskJob, Ctx, AgentSession, AuthData } from './types.js';

const worker = new Worker(
  taskQueue.name,
  async (job: AsyncTaskJob) => {
    const { toolName, params, auth } = job.data;
    const log = logger.child({ jobId: job.id, toolName });

    log.info({ toolArgs: params }, `Processing job for tool: ${toolName}`);

    const tool = allTools.find((t) => t.name === toolName);
    if (!tool) {
      throw new Error(`Tool "${toolName}" not found.`);
    }

    if (!auth) {
      throw new Error(`Authentication data is missing for job ${job.id}`);
    }
    
    // Création d'un mock de la session pour satisfaire les types.
    // Seules les propriétés utilisées par les outils/workers sont nécessaires.
    const mockSession: AgentSession = {
        auth,
        history: [],
        sessionId: auth.id,
        createdAt: auth.authenticatedAt,
        // Propriétés de base pour la compatibilité
        isClosed: false,
        clientCapabilities: { streaming: true },
        loggingLevel: 'info',
    };
    
    const ctx: Ctx = {
      session: mockSession,
      log,
      reportProgress: async (p: any) => log.debug({p}, 'Progress report (worker)'),
      streamContent: async (c: any) => log.debug({c}, 'Content stream (worker)'),
    };

    let result: any;
    if (toolName === 'browser_getContent') {
        result = await getContentWorkerLogic(params as any, ctx);
    } else if (toolName === 'browser_navigate') {
        result = await navigateWorkerLogic(params as any, ctx);
    }
    else {
        result = await tool.execute(params as any, ctx);
    }
    
    log.info({ result }, 'Job completed successfully.');
    return result;
  },
  {
    connection: redisConnection,
    concurrency: config.WORKER_CONCURRENCY,
  }
);

worker.on('failed', async (job, error) => {
  const log = logger.child({ jobId: job?.id, toolName: job?.data.toolName });
  log.error({ err: error }, 'Job failed.');

  if (job && job.opts && job.opts.attempts && job.attemptsMade >= job.opts.attempts) {
    log.warn(`Job failed all attempts. Moving to dead-letter queue.`);
    await deadLetterQueue.add(job.name, job.data, job.opts);
  }
});

worker.on('error', (err) => {
  logger.error({ err }, 'A critical error occurred in the worker.');
});

logger.info(`🚀 Agentic-MCP worker started. Waiting for jobs...`);

const shutdown = async (signal: string) => {
  logger.warn(`Received ${signal}. Shutting down worker.`);
  await worker.close();
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
