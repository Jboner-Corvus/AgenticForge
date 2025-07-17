import dotenv from 'dotenv';
dotenv.config();
console.log('Starting worker...');

// --- AJOUTEZ CES LIGNES POUR LE DÉBOGAGE ---
console.log(`[DEBUG] REDIS_URL vue par le worker: ${process.env.REDIS_URL}`);
console.log(`[DEBUG] REDIS_PORT vue par le worker: ${process.env.REDIS_PORT}`);
console.log('-----------------------------------------');
// --- FIN DE L'AJOUT ---

console.log('Starting worker...');
import { Job, Queue, Worker } from 'bullmq';
import { z } from 'zod';

import { Agent } from './agent.js';
import { config } from './config.js';
import logger from './logger.js';
import { redis } from './redisClient.js';
import { SessionManager } from './sessionManager.js';
import { summarizeTool } from './tools/ai/summarize.tool.js';
import { getAllTools } from './tools/index.js'; // Import getAllTools
import {
  AgentProgress,
  Content,
  Ctx,
  Message,
  SessionData,
  Tool,
} from './types.js';
import { AppError, UserError } from './utils/errorUtils.js';

console.log('Imports complete');
console.log(
  `[Worker] Redis URL from redisClient: ${redis.options.host}:${redis.options.port}`,
);

const jobQueue = new Queue('tasks', { connection: redis });

export async function processJob(
  job: Job,
  tools: Tool<z.AnyZodObject, z.ZodTypeAny>[],
): Promise<string> {
  const { sessionId } = job.data;
  const log = logger.child({ jobId: job.id, sessionId });

  const sessionData = await SessionManager.getSession(sessionId);
  const agent = new Agent(job, sessionData, jobQueue, tools);
  const channel = `job:${job.id}:events`; // Définir le nom du canal une seule fois

  try {
    const finalResponse = await agent.run();

    sessionData.history.push({ content: finalResponse, role: 'model' });

    await summarizeHistory(sessionData, log);
    await SessionManager.saveSession(sessionData, job, jobQueue);

    return finalResponse;
  } catch (error) {
    const log = logger.child({ jobId: job.id, sessionId });
    log.error({ error }, 'Error in agent execution');

    let eventType = 'error';
    let eventMessage: string;

    if (error instanceof AppError || error instanceof UserError) {
      eventMessage = error.message;
    } else if (error instanceof Error) {
      eventMessage = error.message;
      if (eventMessage.includes('Quota exceeded')) {
        eventType = 'quota_exceeded';
        eventMessage = 'API quota exceeded. Please try again later.';
      } else if (
        eventMessage.includes('Gemini API request failed with status 500')
      ) {
        eventMessage =
          'An internal error occurred with the LLM API. Please try again later or check your API key.';
      } else if (eventMessage.includes('is not found for API version v1')) {
        eventMessage =
          'The specified LLM model was not found or is not supported. Please check your LLM_MODEL_NAME in .env.';
      }
    } else {
      eventMessage = 'An unknown error occurred during agent execution.';
    }

    // En cas d'erreur, on peut aussi notifier le front
    await redis.publish(
      channel,
      JSON.stringify({ message: eventMessage, type: eventType }),
    );
    throw error;
  } finally {
    // AJOUT : Toujours envoyer un événement de fermeture à la fin du traitement
    log.info(`Publishing 'close' event to channel ${channel}`);
    await redis.publish(
      channel,
      JSON.stringify({ content: 'Stream ended.', type: 'close' }),
    );
  }
}

export async function startWorker() {
  console.log('startWorker function called');
  const tools = await getAllTools(); // Load all tools
  const _worker = new Worker(
    'tasks',
    async (job) => {
      logger.info(`Processing job ${job.id} of type ${job.name}`);
      return processJob(job, tools);
    },
    {
      concurrency: config.WORKER_CONCURRENCY,
      connection: redis,
    },
  );

  // The BullMQ worker is already defined outside this function as `jobQueue`
  // and its event listeners are not part of fastmcp.start().
  // The original `worker.on` calls were for a BullMQ worker, not the fastmcp server.
  // We need to ensure the BullMQ worker is properly set up and its events are handled.
  // For now, removing the incorrect `worker.on` calls.
  // The BullMQ worker setup should be handled separately if needed.

  // Example of how BullMQ worker events would be handled if a worker instance was available:
  // const bullMqWorker = new Worker('tasks', processJob, { connection: redis, concurrency: config.WORKER_CONCURRENCY });
  // bullMqWorker.on('completed', (job: Job) => {
  //   logger.info(`Job ${job.id} completed.`);
  // });
  // bullMqWorker.on('failed', (job: Job, err: Error) => {
  //   logger.error({ err, jobId: job?.id }, `Job ${job?.id} failed.`);
  // });

  logger.info('Worker démarré et écoute les tâches...');
  console.log('Worker started and listening for tasks...');
}

async function summarizeHistory(sessionData: SessionData, log: typeof logger) {
  if (sessionData.history.length > config.HISTORY_MAX_LENGTH) {
    log.info('History length exceeds max length, summarizing...');
    const historyToSummarize = sessionData.history.slice(0, -10);
    const textToSummarize = historyToSummarize
      .map((msg: Message) => `${msg.role}: ${msg.content}`)
      .join('\n');

    try {
      const summary = await summarizeTool.execute({ text: textToSummarize }, {
        log,
        reportProgress: async (progress: AgentProgress) => {
          log.debug(
            `Summarize progress: ${progress.current}/${progress.total} ${progress.unit || ''}`,
          );
        },
        session: sessionData,
        streamContent: async (content: Content | Content[]) => {
          log.debug(`Summarize stream: ${JSON.stringify(content)}`);
        },
        taskQueue: jobQueue,
      } as Ctx);
      const summarizedMessage: Message = {
        content: `Summarized conversation: ${summary}`,
        role: 'model',
      };
      sessionData.history = [
        summarizedMessage,
        ...sessionData.history.slice(-10),
      ];
      log.info('History summarized successfully.');
    } catch (error) {
      log.error({ error }, 'Error summarizing history');
    }
  }
}

startWorker().catch((err) => {
  console.error('Failed to start worker:', err);
  logger.error({ err }, 'Failed to start worker');
  process.exit(1);
});
