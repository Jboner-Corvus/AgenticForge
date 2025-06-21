// src/worker.ts
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

    const mockSession: Partial<AgentSession> = {
      auth,
      history: [],
      sessionId: auth.id,
      createdAt: auth.authenticatedAt,
      isClosed: false,
    };

    const ctx: Ctx = {
      session: mockSession as AgentSession,
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result = await tool.execute(params as any, ctx);
    }

    log.info({ result }, 'Job completed successfully.');
    return result;
  },
  {
    connection: redisConnection,
    concurrency: config.WORKER_CONCURRENCY,
  },
);

worker.on('failed', (job, error) => {
  const log = logger.child({ jobId: job?.id, toolName: job?.data.toolName });
  log.error({ err: error }, 'Job failed.');

  if (
    job &&
    job.opts &&
    job.opts.attempts &&
    job.attemptsMade >= job.opts.attempts
  ) {
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

worker.on('error', (err) => {
  logger.error({ err }, 'A critical error occurred in the worker.');
});

logger.info(`🚀 Agentic-MCP worker started. Waiting for jobs...`);
