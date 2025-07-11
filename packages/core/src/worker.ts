import dotenv from 'dotenv';
dotenv.config();

console.log('Starting worker...');
import { Job, Queue, Worker } from 'bullmq';

import { Agent } from './agent.js';
import { config } from './config.js';
import logger from './logger.js';
import { redis } from './redisClient.js';
import { SessionManager } from './sessionManager.js';
import { summarizeTool } from './tools/ai/summarize.tool.js';
import { AgentProgress, Content, Ctx, Message, SessionData } from './types.js';

console.log('Imports complete');

const jobQueue = new Queue('tasks', { connection: redis });

export async function processJob(job: Job): Promise<string> {
  const { sessionId } = job.data;
  const log = logger.child({ jobId: job.id, sessionId });

  const sessionData = await SessionManager.getSession(sessionId);
  const agent = new Agent(job, sessionData, jobQueue);
  const channel = `job:${job.id}:events`; // Définir le nom du canal une seule fois

  try {
    const finalResponse = await agent.run();

    sessionData.history.push({ content: finalResponse, role: 'model' });

    // --- LIGNE À AJOUTER ---
    // Publier la réponse finale sur le canal pour que le front-end la reçoive.
    await redis.publish(
      channel,
      JSON.stringify({ type: 'agent_response', content: finalResponse }),
    );
    // --- FIN DE L'AJOUT ---

    await summarizeHistory(sessionData, log);
    await SessionManager.saveSession(sessionData, job, jobQueue);

    return finalResponse;
  } catch (error) {
    log.error({ error }, 'Error in agent execution');
    // En cas d'erreur, on peut aussi notifier le front
    await redis.publish(
      channel,
      JSON.stringify({ message: (error as Error).message, type: 'error' }),
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
  const worker = new Worker(
    'tasks',
    async (job) => {
      logger.info(`Processing job ${job.id} of type ${job.name}`);
      return processJob(job);
    },
    {
      concurrency: config.WORKER_CONCURRENCY,
      connection: redis,
    },
  );

  worker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed.`);
  });

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, `Job ${job?.id} failed.`);
  });

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
