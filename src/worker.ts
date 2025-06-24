// src/worker.ts (Corrigé pour SessionData)
import { Worker, type Job } from 'bullmq';
import { config } from './config.js';
import logger from './logger.js';
import { taskQueue, deadLetterQueue, redisConnection } from './queue.js';
import { getAllTools } from './tools/index.js';
import { getContentWorkerLogic } from './tools/browser/getContent.tool.js';
import { navigateWorkerLogic } from './tools/browser/navigate.tool.js';
import type { AsyncTaskJob, Ctx, SessionData } from './types.js';
import { getErrDetails } from './utils/errorUtils.js';

const worker = new Worker(
  taskQueue.name,
  async (job: AsyncTaskJob) => {
    const { toolName, params, auth } = job.data;
    const log = logger.child({ jobId: job.id, toolName });

    log.info({ toolArgs: params }, `Processing job for tool: ${toolName}`);

    const allTools = await getAllTools();
    const tool = allTools.find((t) => t.name === toolName);
    if (!tool) {
      throw new Error(`Tool "${toolName}" not found.`);
    }

    if (!auth) {
      throw new Error(`Authentication data is missing for job ${job.id}`);
    }

    // CORRECTION: Utilisation correcte du type SessionData
    const ctx: Ctx = {
      session: auth as SessionData,
      log,
      reportProgress: async (p: unknown) =>
        log.debug({ p }, 'Progress report (worker)'),
      streamContent: async (c: unknown) =>
        log.debug({ c }, 'Content stream (worker)'),
    };

    let result: unknown;
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

/**
 * Ce gestionnaire d'événements est déclenché lorsqu'une tâche échoue.
 */
worker.on('failed', (job: Job | undefined, error: Error) => {
  const log = logger.child({ jobId: job?.id, toolName: job?.data.toolName });
  log.error({ err: getErrDetails(error) }, 'Job failed.');

  if (job && job.opts.attempts && job.attemptsMade >= job.opts.attempts) {
    log.warn(`Job failed all attempts. Moving to dead-letter queue.`);
    void (async () => {
      try {
        await deadLetterQueue.add(job.name, job.data, job.opts);
      } catch (e) {
        log.error({ err: e }, 'Failed to move job to dead-letter queue.');
      }
    })();
  }
});

/**
 * Ce gestionnaire est déclenché pour les erreurs critiques du worker lui-même.
 */
worker.on('error', (err) => {
  logger.error(
    { err: getErrDetails(err) },
    'A critical error occurred in the worker.',
  );
});

logger.info(`🚀 Agentic-MCP worker started. Waiting for jobs...`);

// Ajout d'une fonction pour gérer la fermeture propre du worker
const gracefulShutdown = async () => {
  logger.info('Shutting down worker gracefully...');
  await worker.close();
  process.exit(0);
};

// CORRECTION : Les appels à gracefulShutdown sont enveloppés dans une fonction
// synchrone qui gère les erreurs de la promesse pour éviter les "unhandled rejections".
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