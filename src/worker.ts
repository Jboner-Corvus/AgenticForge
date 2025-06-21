/**
 * src/worker.ts
 *
 * Le worker BullMQ qui exécute les tâches asynchrones en arrière-plan.
 * Il traite les jobs de la file d'attente (comme l'exécution de code ou le scraping).
 */
import { Worker } from 'bullmq';
import { config } from './config.js';
import logger from './logger.js';
import { taskQueue, deadLetterQueue, redisConnection } from './queue.js';
import { allTools } from './tools/index.js';
import type { AsyncTaskJob } from './types.js';

const worker = new Worker(
  taskQueue.name,
  async (job: AsyncTaskJob) => {
    const { toolName, toolArgs, session } = job.data;
    const log = logger.child({ jobId: job.id, toolName });

    log.info({ toolArgs }, `Processing job for tool: ${toolName}`);

    const tool = allTools.find((t) => t.name === toolName);

    if (!tool) {
      throw new Error(`Tool "${toolName}" not found.`);
    }

    // Crée un contexte minimal pour l'outil
    const ctx = {
      session,
      log,
      // Les fonctions de progression et de streaming ne sont pas disponibles dans le worker,
      // mais on pourrait les simuler en écrivant dans Redis.
      reportProgress: async (p: any) => log.debug(p, 'Progress report'),
      streamContent: async (c: any) => log.debug(c, 'Content stream'),
    };

    // Exécute l'outil
    const result = await tool.execute(toolArgs, ctx);
    log.info({ result }, 'Job completed successfully.');
    return result;
  },
  {
    connection: redisConnection,
    concurrency: config.WORKER_CONCURRENCY,
  }
);

// --- Gestion des Événements du Worker ---

worker.on('failed', async (job, error) => {
  const log = logger.child({ jobId: job?.id, toolName: job?.data.toolName });
  log.error({ err: error }, 'Job failed.');

  // Si le job a échoué après toutes les tentatives, le déplace vers la DLQ
  if (job && job.attemptsMade >= (job.opts.attempts || 1)) {
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
