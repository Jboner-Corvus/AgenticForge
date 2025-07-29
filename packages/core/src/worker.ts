import { Job, Queue, Worker } from 'bullmq';
import { spawn as _spawn } from 'child_process';
import { Redis } from 'ioredis';
import { Client as PgClient } from 'pg';

import { Tool } from '@/types';

import { config } from './config';
import logger from './logger';
import { Agent } from './modules/agent/agent';
import * as redisClient from './modules/redis/redisClient.js';
import { SessionManager } from './modules/session/sessionManager';
import { summarizeTool } from './modules/tools/definitions/ai/summarize.tool.js';
import { AppError, getErrDetails, UserError } from './utils/errorUtils';
import { getTools } from './utils/toolLoader';

// ... rest of the file

export async function initializeWorker(
  redisConnection: Redis,
  pgClient: PgClient,
) {
  const _tools = await getTools();
  const _jobQueue = new Queue('tasks', { connection: redisConnection });
  const sessionManager = new SessionManager(pgClient);

  const worker = new Worker(
    'tasks',
    async (_job) => {
      if (_job.name === 'process-message') {
        return processJob(
          _job,
          _tools,
          _jobQueue,
          sessionManager,
          redisConnection,
        );
      }

      if (_job.name === 'execute-shell-command-detached') {
        const { command, notificationChannel } = _job.data;
        const log = logger.child({
          jobId: _job.id,
          originalJobId: _job.data.jobId,
        });
        log.info(`Executing detached shell command: ${command}`);

        return new Promise((resolve, reject) => {
          const child = _spawn(command, {
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
            redisConnection.publish(notificationChannel, JSON.stringify(data));
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

          child.on('error', (error: Error) => {
            log.error(
              { err: error },
              `Failed to start detached shell command: ${command}`,
            );
            redisConnection.publish(
              notificationChannel,
              JSON.stringify({
                message: `Failed to start command: ${error.message}`,
                type: 'error',
              }),
            );
            reject(error);
          });

          child.on('close', (code: null | number) => {
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

  worker.on('completed', (_job) => {
    logger.info(`Job ${_job.id} terminé avec succès.`);
  });

  worker.on('failed', (_job, err) => {
    logger.error({ err }, `Le job ${_job?.id} a échoué`);
  });

  logger.info('Worker initialisé et prêt à traiter les jobs.');
  return worker;
}

// Fonction principale de traitement des tâches
export async function processJob(
  _job: Job,
  _tools: Tool[],
  _jobQueue: Queue,
  _sessionManager: SessionManager,
  redisConnection: Redis,
): Promise<string> {
  const log = logger.child({ jobId: _job.id, sessionId: _job.data.sessionId });
  log.info(`Traitement du job ${_job.id} avec les données:`, _job.data);

  const channel = `job:${_job.id}:events`;

  try {
    const session = await _sessionManager.getSession(_job.data.sessionId);
    const activeLlmProvider = session.activeLlmProvider || config.LLM_PROVIDER; // Use session's provider or default
    const agent = new Agent(
      _job,
      session,
      _jobQueue,
      _tools,
      activeLlmProvider,
      _sessionManager, // Pass sessionManager
    );
    const finalResponse = await agent.run();

    session.history.push({
      content: finalResponse,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: 'agent_response',
    });

    if (session.history.length > config.HISTORY_MAX_LENGTH) {
      const summarizedHistory = await summarizeTool.execute(
        {
          text: session.history
            .map((m) => ('content' in m ? m.content : ''))
            .join('\n'),
        },
        {
          job: _job,
          llm: null as any,
          log: log,
          reportProgress: async () => {},
          session: session,
          streamContent: async () => {},
          taskQueue: _jobQueue,
        },
      );
      session.history = [
        {
          content: summarizedHistory as string,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          type: 'agent_response',
        },
      ];
    }

    await _sessionManager.saveSession(session, _job, _jobQueue);
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

    redisConnection.publish(
      channel,
      JSON.stringify({ message: errorMessage, type: eventType }),
    );
    throw error; // Relance l'erreur pour marquer le job comme échoué dans BullMQ
  } finally {
    // Publie toujours un événement de fermeture pour notifier le frontend
    redisConnection.publish(
      channel,
      JSON.stringify({ content: 'Stream terminé.', type: 'close' }),
    );
    log.info(`Traitement du job ${_job.id} terminé`);
  }
}

// Démarrage direct du worker
if (process.env.NODE_ENV !== 'test') {
  const connectionString = `postgresql://${config.POSTGRES_USER}:${config.POSTGRES_PASSWORD}@${config.POSTGRES_HOST}:${config.POSTGRES_PORT}/${config.POSTGRES_DB}`;
  const pgClient = new PgClient({
    connectionString: connectionString,
  });
  pgClient.connect();
  const redisConnection = redisClient.redis;
  initializeWorker(redisConnection, pgClient).catch((err) => {
    logger.error({ err }, "Échec de l'initialisation du worker");
    process.exit(1);
  });
}
