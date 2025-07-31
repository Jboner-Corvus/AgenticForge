import { Job, Queue, Worker } from 'bullmq';
import { spawn as _spawn } from 'child_process';
import { Redis } from 'ioredis';
import { Client as PgClient } from 'pg';

import { Tool } from '@/types';

import { config, loadConfig } from './config.js';
import { getLoggerInstance } from './logger.js';
import { Agent } from './modules/agent/agent.js';
import { LlmKeyManager } from './modules/llm/LlmKeyManager.js';
import { getRedisClientInstance } from './modules/redis/redisClient.js';
import { SessionManager } from './modules/session/sessionManager.js';
import { summarizeTool } from './modules/tools/definitions/ai/summarize.tool.js';
import { AppError, getErrDetails, UserError } from './utils/errorUtils.js';
import { getTools } from './utils/toolLoader.js';

export async function initializeWorker(
  redisConnection: Redis,
  pgClient: PgClient,
) {
  const _tools = await getTools();
  const _jobQueue = new Queue('tasks', { connection: redisConnection });
  const sessionManager = new SessionManager(pgClient);

  if (config.LLM_API_KEY && config.LLM_PROVIDER) {
    await LlmKeyManager.addKey(
      config.LLM_PROVIDER,
      config.LLM_API_KEY,
      config.LLM_MODEL_NAME,
    );
    getLoggerInstance().info(
      `[INIT LLM] Added LLM API key for provider: ${config.LLM_PROVIDER} with model: ${config.LLM_MODEL_NAME}`,
    );
  }

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
        const log = getLoggerInstance().child({
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
            toolName: string,
          ) => {
            const data = {
              data: { content, type },
              toolName,
              type: 'tool_stream',
            };
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
    getLoggerInstance().info(`Job ${_job.id} terminé avec succès.`);
  });

  worker.on('failed', (_job, err) => {
    getLoggerInstance().error({ err }, `Le job ${_job?.id} a échoué`);
  });

  getLoggerInstance().info('Worker initialisé et prêt à traiter les jobs.');
  return worker;
}

export async function processJob(
  _job: Job,
  _tools: Tool[],
  _jobQueue: Queue,
  _sessionManager: SessionManager,
  redisConnection: Redis,
): Promise<string> {
  const log = getLoggerInstance().child({
    jobId: _job.id,
    sessionId: _job.data.sessionId,
  });
  log.info(`Traitement du job ${_job.id} avec les données:`, _job.data);

  const channel = `job:${_job.id}:events`;

  try {
    const session = await _sessionManager.getSession(_job.data.sessionId);
    const activeLlmProvider = session.activeLlmProvider || config.LLM_PROVIDER;
    const { apiKey, llmApiKey, llmModelName, llmProvider } = _job.data;
    const agent = new Agent(
      _job,
      session,
      _jobQueue,
      _tools,
      llmProvider || activeLlmProvider,
      _sessionManager,
      llmApiKey || apiKey,
      llmModelName,
      llmApiKey,
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
    throw error;
  } finally {
    redisConnection.publish(
      channel,
      JSON.stringify({ content: 'Stream terminé.', type: 'close' }),
    );
    log.info(`Traitement du job ${_job.id} terminé`);
  }
}

if (process.env.NODE_ENV !== 'test') {
  // Load configuration for the worker process
  await loadConfig();

  getLoggerInstance().info(
    `[INIT LLM] LLM_PROVIDER détecté : ${process.env.LLM_PROVIDER}`,
  );
  getLoggerInstance().info(
    `[INIT LLM] LLM_API_KEY détecté : ${process.env.LLM_API_KEY || 'NON DÉTECTÉ'}`,
  );
  getLoggerInstance().info(
    `[INIT LLM] LLM_MODEL_NAME détecté : ${process.env.LLM_MODEL_NAME}`,
  );

  getLoggerInstance().info(
    `PostgreSQL Host for Worker: ${config.POSTGRES_HOST}`,
  );
  const connectionString = `postgresql://${config.POSTGRES_USER}:${config.POSTGRES_PASSWORD}@${config.POSTGRES_HOST}:${config.POSTGRES_PORT}/${config.POSTGRES_DB}`;
  const redisConnection = getRedisClientInstance();
  const pgClient = new PgClient({
    connectionString: connectionString,
  });
  pgClient.connect();
  initializeWorker(redisConnection, pgClient).catch((err) => {
    getLoggerInstance().error({ err }, "Échec de l'initialisation du worker");
    process.exit(1);
  });
}
