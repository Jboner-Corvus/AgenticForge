// src/worker.ts (Corrigé pour utiliser les bons types)
import { Worker, type Job } from 'bullmq';
import { config } from './config.js';
import logger from './logger.js';
import { taskQueue, deadLetterQueue, redisConnection } from './queue.js';
import { getAllTools } from './tools/index.js';
import { getContentWorkerLogic } from './tools/browser/getContent.tool.js';
import { navigateWorkerLogic } from './tools/browser/navigate.tool.js';
import type { AsyncTaskJobPayload, Ctx, SessionData } from './types.js'; // CORRECTION: On importe AsyncTaskJobPayload
import { getErrDetails } from './utils/errorUtils.js';

const worker = new Worker(
  taskQueue.name,
  // CORRECTION: Le type du paramètre 'job' est maintenant Job<AsyncTaskJobPayload>
  // C'est le type standard fourni par BullMQ, dont la data est notre payload.
  async (job: Job<AsyncTaskJobPayload>) => {
    const { toolName, params, auth, taskId, cbUrl } = job.data;
    const log = logger.child({ jobId: job.id, toolName, taskId });

    log.info({ toolArgs: params }, `Processing job for tool: ${toolName}`);

    const allTools = await getAllTools();
    const tool = allTools.find((t) => t.name === toolName);
    if (!tool) {
      throw new Error(`Tool "${toolName}" not found.`);
    }

    if (!auth) {
      throw new Error(`Authentication data is missing for job ${job.id}`);
    }

    const ctx: Ctx = {
      session: auth,
      log,
      reportProgress: async (p: unknown) =>
        log.debug({ p }, 'Progress report (worker)'),
      streamContent: async (c: unknown) =>
        log.debug({ c }, 'Content stream (worker)'),
    };

    let result: unknown;
    // La logique existante pour les workers spécifiques est conservée
    if (toolName === 'browser_getContent') {
      result = await getContentWorkerLogic(
        params as Parameters<typeof getContentWorkerLogic>[0],
        ctx,
      );
    } else if (toolName === 'browser_navigate') {
      result = await navigateWorkerLogic(
        params as Parameters<typeof navigateWorkerLogic>[0],
        ctx,
      );
    } else {
      result = await tool.execute(params as Record<string, unknown>, ctx);
    }

    log.info({ result }, 'Job completed successfully.');
    return result;
  },
  {
    connection: redisConnection,
    concurrency: config.WORKER_CONCURRENCY,
  },
);

worker.on('failed', (job: Job | undefined, error: Error) => {
  const log = logger.child({ jobId: job?.id, toolName: job?.data.toolName });
  log.error({ err: getErrDetails(error) }, 'Job failed.');

  if (job && job.opts.attempts && job.attemptsMade >= job.opts.attempts) {
    log.warn(`Job failed all attempts. Moving to dead-letter queue.`);
    deadLetterQueue.add(job.name, job.data, job.opts).catch((e) => {
      log.error({ err: e }, 'Failed to move job to dead-letter queue.');
    });
  }
});

worker.on('error', (err) => {
  logger.error(
    { err: getErrDetails(err) },
    'A critical error occurred in the worker.',
  );
});

logger.info(`🚀 Agentic-MCP worker started. Waiting for jobs...`);

const gracefulShutdown = async () => {
  logger.info('Shutting down worker gracefully...');
  await worker.close();
  process.exit(0);
};

process.on('SIGINT', () => {
  gracefulShutdown().catch((err) => {
    logger.error({ err: getErrDetails(err) }, 'Error during SIGINT shutdown');
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  gracefulShutdown().catch((err) => {
    logger.error({ err: getErrDetails(err) }, 'Error during SIGTERM shutdown');
    process.exit(1);
  });
});
