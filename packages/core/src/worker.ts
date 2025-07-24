import { Job, Queue, Worker } from 'bullmq';
import { spawn } from 'child_process';
import { Redis } from 'ioredis';
import { Client as PgClient } from 'pg';

import { Tool } from '@/types';

import { config } from './config';
import logger from './logger';
import { Agent } from './modules/agent/agent';
import { redis } from './modules/redis/redisClient';
import { SessionManager } from './modules/session/sessionManager';
import { AppError, getErrDetails, UserError } from './utils/errorUtils';
import { getTools } from './utils/toolLoader';

// Initialisation du Worker
export async function initializeWorker(
  redisConnection: Redis,
  pgClient: Client,
) {
  const tools = await getTools();
  const jobQueue = new Queue('tasks', { connection: redisConnection });
  const sessionManager = new SessionManager(pgClient);

  const worker = new Worker(
    'tasks',
    async (job) => {
      if (job.name === 'process-message') {
        return processJob(job, tools, jobQueue, sessionManager);
      }

      if (job.name === 'execute-shell-command-detached') {
        const { command, notificationChannel } = job.data;
        const log = logger.child({
          jobId: job.id,
          originalJobId: job.data.jobId,
        });
        log.info(`Executing detached shell command: ${command}`);

        return new Promise((resolve, reject) => {
          const child = spawn(command, {
            cwd: config.WORKSPACE_PATH,
            detached: true,
            shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash',
            stdio: 'pipe',
          });

          const streamToFrontend = (
            type: 'stderr' | 'stdout',
            content: string,
            toolName: string, // Add toolName parameter
          ) => {
            const data = {
              data: { content, type },
              toolName,
              type: 'tool_stream',
            }; // Include toolName
            redis.publish(notificationChannel, JSON.stringify(data));
          };

          child.stdout.on('data', (data: Buffer) => {
            const chunk = data.toString();
            log.info(`[stdout] ${chunk}`);
            streamToFrontend('stdout', chunk, 'executeShellCommand');
          });

          child.stderr.on('data', (data: Buffer) => {
            const chunk = data.toString();
            log.error(`[stderr] ${chunk}`);
            streamToFrontend('stderr', chunk, 'executeShellCommand');
          });

          child.on('error', (error) => {
            log.error(
              { err: error },
              `Failed to start detached shell command: ${command}`,
            );
            redis.publish(
              notificationChannel,
              JSON.stringify({
                message: `Failed to start command: ${error.message}`,
                type: 'error',
              }),
            );
            reject(error);
          });

          child.on('close', (code) => {
            const finalMessage = `--- DETACHED COMMAND FINISHED ---\nCommand: ${command}\nExit Code: ${code}`;
            log.info(finalMessage);
            streamToFrontend(
              'stdout',
              `
${finalMessage}`,
              'executeShellCommand',
            );
            resolve(`Detached command finished with code ${code}`);
          });
        });
      }
    },
    {
      concurrency: config.WORKER_CONCURRENCY,
      connection: redisConnection,
    },
  );

  worker.on('completed', (job) => {
    logger.info(`Job ${job.id} terminé avec succès.`);
  });

  worker.on('failed', (job, err) => {
    logger.error({ err }, `Le job ${job?.id} a échoué`);
  });

  logger.info('Worker initialisé et prêt à traiter les jobs.');
  return worker;
}

// Fonction principale de traitement des tâches
export async function processJob(
  job: Job,
  tools: Tool[],
  jobQueue: Queue,
  sessionManager: SessionManager,
): Promise<string> {
  const log = logger.child({ jobId: job.id, sessionId: job.data.sessionId });
  log.info(`Traitement du job ${job.id} avec les données:`, job.data);

  const channel = `job:${job.id}:events`;

  try {
    const session = await sessionManager.getSession(job.data.sessionId);
    const agent = new Agent(job, session, jobQueue, tools);
    const finalResponse = await agent.run();

    session.history.push({
      content: finalResponse,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: 'agent_response',
    });

    await sessionManager.saveSession(session, job, jobQueue);
    return finalResponse;
  } catch (error: unknown) {
    const errDetails = getErrDetails(error);
    log.error({ err: errDetails }, "Erreur dans l'exécution de l'agent");

    let errorMessage = errDetails.message;
    let eventType = 'error';

    // Personnalisation des messages d'erreur courants pour l'utilisateur
    if (error instanceof AppError || error instanceof UserError) {
      if (errorMessage.includes('Quota exceeded')) {
        errorMessage = 'Quota API dépassé. Veuillez réessayer plus tard.';
        eventType = 'quota_exceeded';
      } else if (
        errorMessage.includes('Gemini API request failed with status 500')
      ) {
        errorMessage =
          "Une erreur interne est survenue avec l'API du LLM. Veuillez réessayer plus tard ou vérifier votre clé API.";
      } else if (errorMessage.includes('is not found for API version v1')) {
        errorMessage =
          "Le modèle de LLM spécifié n'a pas été trouvé ou n'est pas supporté. Veuillez vérifier votre LLM_MODEL_NAME dans le fichier .env.";
      }
    }

    redis.publish(
      channel,
      JSON.stringify({ message: errorMessage, type: eventType }),
    );
    throw error; // Relance l'erreur pour marquer le job comme échoué dans BullMQ
  } finally {
    // Publie toujours un événement de fermeture pour notifier le frontend
    redis.publish(
      channel,
      JSON.stringify({ content: 'Stream terminé.', type: 'close' }),
    );
    log.info(`Traitement du job ${job.id} terminé`);
  }
}

// Démarrage direct du worker
if (process.env.NODE_ENV !== 'test') {
  initializeWorker(redis, {} as PgClient).catch((err) => {
    logger.error({ err }, "Échec de l'initialisation du worker");
    process.exit(1);
  });
}
