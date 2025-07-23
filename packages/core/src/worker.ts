console.log('<<<<< STARTING worker.ts >>>>>');
// ATTENTION : Ce fichier est le point d'entrée du worker de l'agent.
// Son rôle principal est d'écouter la file d'attente (queue) sur Redis
// et de traiter les "jobs" (tâches) qui y sont ajoutés.
//
// SI LE WORKER NE DÉMARRE PAS OU NE TRAITE PAS DE TÂCHES :
// 1. VÉRIFIEZ LA CONNEXION À REDIS : Assurez-vous que les variables d'environnement
//    (REDIS_HOST, REDIS_PORT, etc.) sont correctement configurées et accessibles.
//    Le client Redis est configuré dans `redisClient.ts`.
// 2. VÉRIFIEZ LE NOM DE LA QUEUE : Le nom de la queue ('tasks' par défaut) doit
//    correspondre exactement à celui utilisé par l'application qui ajoute les jobs.
//
// Toute modification dans ce fichier peut affecter la capacité du système à
// traiter des tâches en arrière-plan.

// import dotenv from 'dotenv';
// dotenv.config();
console.log('Starting worker...');
console.log(`[Worker] process.env.DOCKER: ${process.env.DOCKER}`);
import { Job, Queue, Worker } from 'bullmq';
import { Content } from 'fastmcp';
import { z } from 'zod';

import { Ctx, Message, SessionData, Tool } from '@/types.js';

import { config } from './config.js';
import logger from './logger.js';
import { Agent } from './modules/agent/agent.js';
import shellCommandWorker from './modules/queue/shellCommandWorker.js';
import { redis } from './modules/redis/redisClient.js';
import { SessionManager } from './modules/session/sessionManager.js';
import { summarizeTool } from './modules/tools/definitions/ai/summarize.tool.js';
import { getAllTools } from './modules/tools/definitions/index.js'; // Import getAllTools
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
  // NOTE: Ensure all potential error messages are logged with enough context
  // (e.g., job ID, session ID, full error object) for effective debugging in production.
  logger.info(`[processJob] Received job ${job.id}`);
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
      let rawErrorMessage = error.message;
      try {
        const parsedError = JSON.parse(rawErrorMessage);
        if (
          parsedError.tool === 'error' &&
          parsedError.parameters &&
          parsedError.parameters.message
        ) {
          rawErrorMessage = parsedError.parameters.message;
        }
      } catch (_parseError) {
        // Not a JSON error message, proceed with rawErrorMessage
      }

      eventMessage = rawErrorMessage;
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
  logger.info('Starting worker...');
  console.log('[worker] Before getAllTools call');
  const tools = await getAllTools(); // Load all tools
  console.log('[worker] After getAllTools call');
  logger.info(`Found ${tools.length} tools.`);

  logger.info('Creating worker...');
  const worker = new Worker(
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

  worker.on('completed', (job: Job) => {
    logger.info(`Job ${job.id} completed.`);
    redis.incr('leaderboard:successfulRuns').catch((error) => {
      logger.error({ error }, 'Failed to increment successfulRuns in Redis');
    });
  });

  worker.on('failed', (job: Job | undefined, err: Error) => {
    logger.error({ err, jobId: job?.id }, `Job ${job?.id} failed.`);
  });

  logger.info('Worker started and listening for tasks...');
  console.log('Worker started and listening for tasks...');

  // Start the detached shell command worker
  shellCommandWorker.run();
  logger.info('Detached shell command worker started.');
}

async function summarizeHistory(sessionData: SessionData, log: typeof logger) {
  if (sessionData.history.length > config.HISTORY_MAX_LENGTH) {
    log.info('History length exceeds max length, summarizing...');
    const historyToSummarize = sessionData.history.slice(0, -10);
    const textToSummarize = historyToSummarize
      .map((msg: Message) => `${msg.role}: ${msg.content}`)
      .join('\n');

    try {
      // NOTE: summarizeTool.execute might be a blocking LLM call. If summarization
      // is a long-running process and impacts worker performance, consider offloading
      // it to a separate, dedicated worker or process, or making it truly asynchronous.
      const summary = await summarizeTool.execute({ text: textToSummarize }, {
        log,
        reportProgress: async (progress: {
          current: number;
          total: number;
          unit?: string;
        }) => {
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

if (process.env.NODE_ENV !== 'test') {
  startWorker().catch((err) => {
    console.error('Failed to start worker:', err);
    logger.error({ err }, 'Failed to start worker');
    process.exit(1);
  });
}
