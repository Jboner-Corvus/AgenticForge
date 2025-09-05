import { Job, Queue, Worker } from 'bullmq';
import { spawn as _spawn } from 'child_process';
import { Redis } from 'ioredis';

import { config, loadConfig } from './config.ts';

// Add debug log at the very beginning
getLoggerInstance().info('🚀 [WORKER] Worker file loaded and starting...');
import { getLoggerInstance } from './logger.ts';
import { Agent } from './modules/agent/agent.ts';
import { LlmKeyManager } from './modules/llm/LlmKeyManager.ts';
import { getRedisClientInstance } from './modules/redis/redisClient.ts';
import { getPostgresPool, DatabaseCircuitBreaker } from './modules/database/index.ts';
import { SessionManager } from './modules/session/sessionManager.ts';
import { summarizeTool } from './modules/tools/definitions/ai/summarize.tool.ts';
import { AppError, getErrDetails, UserError } from './utils/errorUtils.ts';
import { getTools } from './utils/toolLoader.ts';

getLoggerInstance().debug('[WORKER-STARTUP] process.cwd():', process.cwd());
getLoggerInstance().debug(
  '[WORKER-STARTUP] process.env.PATH:',
  process.env.PATH,
);

// Add memory monitoring function
function logMemoryUsage(label: string, log: any) {
  if (global.gc) {
    global.gc(); // Force garbage collection if exposed
  }
  const usage = process.memoryUsage();
  log.debug(
    `[MEMORY] ${label} - RSS: ${Math.round(usage.rss / 1024 / 1024)} MB, ` +
      `Heap Used: ${Math.round(usage.heapUsed / 1024 / 1024)} MB, ` +
      `Heap Total: ${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
  );
}

// Start periodic key cleanup to maintain healthy key pool
function startPeriodicKeyCleanup() {
  const log = getLoggerInstance().child({ module: 'KeyCleanup' });
  
  // Run initial cleanup after 30 seconds
  setTimeout(async () => {
    try {
      const result = await LlmKeyManager.cleanupFailedKeys();
      if (result.cleaned > 0) {
        log.info(result, 'Initial key cleanup completed');
      }
    } catch (error) {
      log.error({ error }, 'Failed to run initial key cleanup');
    }
  }, 30000);
  
  // Run periodic cleanup every 15 minutes
  const cleanupInterval = setInterval(async () => {
    try {
      const result = await LlmKeyManager.cleanupFailedKeys();
      if (result.cleaned > 0) {
        log.info(result, 'Periodic key cleanup completed');
      } else {
        log.debug({ total: result.total }, 'No keys needed cleanup');
      }
    } catch (error) {
      log.error({ error }, 'Failed to run periodic key cleanup');
    }
  }, 15 * 60 * 1000); // 15 minutes
  
  // Cleanup on process exit
  process.on('SIGTERM', () => {
    clearInterval(cleanupInterval);
    log.info('Key cleanup task stopped');
  });
  
  process.on('SIGINT', () => {
    clearInterval(cleanupInterval);
    log.info('Key cleanup task stopped');
  });
  
  log.info('Periodic key cleanup task started (every 15 minutes)');
}

export async function initializeWorker(
  redisConnection: Redis,
) {
  getLoggerInstance().info(
    { path: process.env.PATH },
    'Worker process.env.PATH at startup:',
  );

  // Initialize PostgreSQL pool and circuit breaker
  const poolManager = getPostgresPool();
  const circuitBreaker = new DatabaseCircuitBreaker();

  // Afficher les outils détectés au démarrage
  const tools = await getTools();
  getLoggerInstance().info(`${tools.length} tools detected at startup`);

  const _jobQueue = new Queue('tasks', { connection: redisConnection });

  // Create session manager with pool manager (temporary wrapper)
  const sessionManager = await SessionManager.create(poolManager as any);

  // Start periodic key cleanup task
  startPeriodicKeyCleanup();

  const worker = new Worker(
    'tasks',
    async (_job) => {
      if (_job.name === 'process-message') {
        try {
          return await processJob(_job, _jobQueue, sessionManager, redisConnection);
        } catch (error) {
          getLoggerInstance().error({ err: error, jobId: _job.id }, 'Error processing job');
          throw error;
        }
      }

      if (_job.name === 'execute-shell-command-detached') {
        const { command, notificationChannel } = _job.data;
        const log = getLoggerInstance().child({
          jobId: _job.id,
          originalJobId: _job.data.jobId,
        });
        log.info(`Executing detached shell command: ${command}`);

        return new Promise((resolve, reject) => {
          const env = {
            ...process.env,
            PATH: process.env.HOST_SYSTEM_PATH || process.env.PATH,
          };
          getLoggerInstance().debug(
            `[WORKER-SPAWN-DEBUG] Spawning command: ${command}`,
          );
          getLoggerInstance().debug(
            `[WORKER-SPAWN-DEBUG] With shell: /usr/bin/env bash`,
          );
          getLoggerInstance().debug(
            `[WORKER-SPAWN-DEBUG] With cwd: ${config.WORKSPACE_PATH}`,
          );
          getLoggerInstance().debug(
            `[WORKER-SPAWN-DEBUG] With env.PATH: ${env.PATH}`,
          );

          const child = _spawn(command, {
            cwd: config.WORKSPACE_PATH,
            detached: false,
            env: env, // Utiliser l'environnement corrigé
            shell: '/bin/sh', // Utiliser sh directement
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
            const finalMessage = `--- DETACHED COMMAND FINISHED ---
Command: ${command}
Exit Code: ${code}`;
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
      autorun: true,
      concurrency: config.WORKER_CONCURRENCY, // Now optimized for memory usage
      connection: redisConnection,
      maxStalledCount: config.WORKER_MAX_STALLED_COUNT,
      stalledInterval: config.WORKER_STALLED_INTERVAL_MS,
    },
  );

  worker.on('completed', (_job) => {
    getLoggerInstance().info(`Job ${_job.id} terminé avec succès.`);
  });

  worker.on('failed', (_job, err) => {
    getLoggerInstance().error({ err }, `Le job ${_job?.id} a échoué`);
  });

  worker.on('error', (err) => {
    getLoggerInstance().error({ err }, 'Worker error');
  });

  console.log('Worker initialisé et prêt à traiter les jobs.');
  getLoggerInstance().info('Worker initialisé et prêt à traiter les jobs.');
  return worker;
}

export async function processJob(
  _job: Job,
  _jobQueue: Queue,
  _sessionManager: SessionManager,
  redisConnection: Redis,
): Promise<string> {
  const log = getLoggerInstance().child({
    jobId: _job.id,
    sessionId: _job.data.sessionId,
  });

  // Log initial memory usage
  logMemoryUsage('Job Start', log);
  log.info(`Traitement du job ${_job.id}`);

  const channel = `job:${_job.id}:events`;

  // Add a small delay to ensure frontend can establish EventSource connection
  await new Promise((resolve) => setTimeout(resolve, 100));
  log.info(`Job ${_job.id} starting after synchronization delay`);

  try {
    const tools = await getTools();
      const session = await _sessionManager.getSession(_job.data.sessionId);
      const activeLlmProvider = session.activeLlmProvider || config.LLM_PROVIDER; // Use configured provider as default
      const { llmApiKey, llmModelName, llmProvider } = _job.data;
 
      // Debug provider selection
      log.info('🔍 PROVIDER DEBUG:', {
        session_active_provider: session.activeLlmProvider,
        config_default_provider: config.LLM_PROVIDER,
        job_llm_provider: llmProvider,
        final_provider: llmProvider || activeLlmProvider,
        config_hierarchy: config.LLM_PROVIDER_HIERARCHY
      });
 
      log.info(`Agent starting with ${tools.length} tools available`);
      const agent = new Agent(
        _job,
        session,
        _jobQueue,
        tools,
        llmProvider || activeLlmProvider,
        _sessionManager,
        llmApiKey,
        llmModelName,
      );
    log.info(`Agent execution starting...`);
    const finalResponse = await agent.run();
    log.info(`Agent execution completed successfully`);

    session.history.push({
      content: finalResponse,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: 'agent_response',
    });

    // Use Gemini-optimized history length if using Gemini
    const maxHistoryLength =
      activeLlmProvider === 'gemini'
        ? config.GEMINI_MAX_HISTORY_LENGTH
        : config.HISTORY_MAX_LENGTH;

    if (session.history.length > maxHistoryLength) {
      try {
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
            streamContent: async (data: { content: string; type: string }) => {
              // Ne pas publier les données de type tool_code dans le canal principal
              // car elles peuvent être mal interprétées comme du contenu canvas
              // Les todos doivent utiliser le système claude_code_todo dédié
              if (data.type === 'tool_code_image' || data.type === 'tool_code') {
                // Ignorer ces types pour éviter l'affichage dans le canvas
                return;
              }
              
              // Publier seulement les autres types de contenu
              redisConnection.publish(
                channel,
                JSON.stringify({
                  content: data.content,
                  type: data.type,
                }),
              );
            },
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
      } catch (summarizeError) {
        log.error({ err: summarizeError }, "Erreur dans la summarization de l'historique");
        // Continue without summarizing if it fails
      }
    }

    await _sessionManager.saveSession(session, _job, _jobQueue);

    // Log final memory usage
    logMemoryUsage('Job End', log);
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

    try {
      redisConnection.publish(
        channel,
        JSON.stringify({ message: errorMessage, type: eventType }),
      );
    } catch (publishError) {
      log.error({ err: publishError }, "Erreur dans la publication du message d'erreur");
    }
    
    throw error;
  } finally {
    try {
      redisConnection.publish(
        channel,
        JSON.stringify({ content: 'Stream terminé.', type: 'close' }),
      );
    } catch (publishError) {
      log.error({ err: publishError }, "Erreur dans la publication du message de fermeture");
    }
    log.info(`Traitement du job ${_job.id} terminé`);
    // Attendre un peu pour s'assurer que le message 'close' est envoyé
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

async function checkWorkerLock(redisClient: Redis): Promise<boolean> {
  const lockKey = 'worker:singleton:lock';
  const lockTimeout = 300; // 5 minutes pour plus de stabilité
  const processId = `${process.pid}:${Date.now()}:${Math.random().toString(36).substring(2, 15)}`;

  try {
    // Vérifier d'abord si un lock existe déjà
    const existingLock = await redisClient.get(lockKey);
    if (existingLock) {
      const [existingPid, timestamp] = existingLock.split(':');
      const lockAge = Date.now() - parseInt(timestamp);

      // Vérifier si le processus existe toujours
      try {
        process.kill(parseInt(existingPid), 0); // Signal 0 pour vérifier si le processus existe
        // Si on arrive ici, le processus existe encore
        if (lockAge < 60000) { // Lock récent (< 1 minute)
          getLoggerInstance().warn(`❌ Worker already running (PID: ${existingPid}, age: ${lockAge}ms), process ${process.pid} will exit`);
          return false;
        } else {
          // Lock plus ancien mais processus encore actif - forcer l'arrêt de l'ancien
          getLoggerInstance().warn(`⚠️ Found old but active worker (PID: ${existingPid}), attempting to kill it`);
          try {
            process.kill(parseInt(existingPid), 'SIGTERM');
            await new Promise(resolve => setTimeout(resolve, 2000)); // Attendre 2 secondes
            // Vérifier si le processus est mort
            try {
              process.kill(parseInt(existingPid), 0);
              // Si on arrive ici, le processus est encore vivant, utiliser SIGKILL
              getLoggerInstance().warn(`🔪 Force killing stubborn worker PID: ${existingPid}`);
              process.kill(parseInt(existingPid), 'SIGKILL');
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch {
              // Processus mort, c'est bon
              getLoggerInstance().info(`✅ Successfully killed old worker PID: ${existingPid}`);
            }
          } catch (killError) {
            getLoggerInstance().error({ killError }, `Failed to kill old worker PID: ${existingPid}`);
          }
        }
      } catch {
        // Le processus n'existe plus, on peut prendre le lock
        getLoggerInstance().info(`🔄 Taking over lock from dead worker (PID: ${existingPid}, age: ${lockAge}ms)`);
        // Delete the stale lock so we can acquire a new one
        await redisClient.del(lockKey);
      }
    }

    // Try to set lock with expiration
    const result = await redisClient.set(lockKey, processId, 'EX', lockTimeout, 'NX');

    if (result === 'OK') {
      getLoggerInstance().info(`✅ Worker lock acquired by process ${process.pid}`);

      // Refresh lock periodically (plus fréquemment)
      const refreshInterval = setInterval(async () => {
        try {
          const currentLock = await redisClient.get(lockKey);
          if (currentLock === processId) {
            await redisClient.expire(lockKey, lockTimeout);
            getLoggerInstance().debug(`🔄 Worker lock refreshed by process ${process.pid}`);
          } else {
            clearInterval(refreshInterval);
            getLoggerInstance().error(`⚠️ Worker lock stolen by another process, shutting down ${process.pid}`);
            process.exit(1);
          }
        } catch (error) {
          getLoggerInstance().error({ error }, 'Error refreshing worker lock');
        }
      }, 10000); // Rafraîchir toutes les 10 secondes (plus fréquent)

      // Cleanup handlers plus robustes
      const cleanup = async () => {
        try {
          clearInterval(refreshInterval);
          const currentLock = await redisClient.get(lockKey);
          if (currentLock === processId) {
            await redisClient.del(lockKey);
            getLoggerInstance().info(`🧹 Worker lock released by process ${process.pid}`);
          }
        } catch (error) {
          getLoggerInstance().error({ error }, 'Error during lock cleanup');
        }
      };

      process.on('SIGTERM', cleanup);
      process.on('SIGINT', cleanup);
      process.on('exit', cleanup);

      // Handler spécial pour les erreurs non gérées
      process.on('uncaughtException', (error) => {
        getLoggerInstance().error({ error }, 'Uncaught exception in worker, cleaning up');
        cleanup().finally(() => process.exit(1));
      });

      process.on('unhandledRejection', (reason) => {
        getLoggerInstance().error({ reason }, 'Unhandled rejection in worker, cleaning up');
        cleanup().finally(() => process.exit(1));
      });

      return true;
    } else {
      const finalLock = await redisClient.get(lockKey);
      getLoggerInstance().warn(`❌ Failed to acquire worker lock, existing: ${finalLock}, process ${process.pid} will exit`);
      return false;
    }
  } catch (error) {
    getLoggerInstance().error({ error }, 'Error checking worker lock');
    return false;
  }
}

if (process.env.NODE_ENV !== 'test') {
  // Load configuration for the worker process
  getLoggerInstance().info('🔧 [WORKER] Starting configuration load...');
  await loadConfig();
  getLoggerInstance().info('✅ [WORKER] Configuration loaded successfully');
  
  // Check worker singleton lock before proceeding
  const redisConnection = getRedisClientInstance();
  const canProceed = await checkWorkerLock(redisConnection);
  
  if (!canProceed) {
    getLoggerInstance().info('🚫 [WORKER] Another worker is already running, exiting...');
    process.exit(0);
  }

  getLoggerInstance().info('🔍 DEBUG WORKER CONFIG:', {
    LLM_PROVIDER: config.LLM_PROVIDER,
    LLM_API_KEY_exists: !!config.LLM_API_KEY,
    LLM_MODEL_NAME: config.LLM_MODEL_NAME,
    LLM_API_KEY_first_20: config.LLM_API_KEY?.substring(0, 20),
    current_working_directory: process.cwd(),
    NODE_ENV: process.env.NODE_ENV
  });

  // Load main LLM key
  if (config.LLM_API_KEY && config.LLM_PROVIDER && config.LLM_MODEL_NAME) {
    await LlmKeyManager.addKey(
      config.LLM_PROVIDER,
      config.LLM_API_KEY,
      config.LLM_MODEL_NAME,
    );
    getLoggerInstance().info(
      `Main LLM API key for ${config.LLM_PROVIDER} added to KeyManager.`,
    );
  } else {
    getLoggerInstance().warn(
      `LLM_API_KEY, LLM_PROVIDER, or LLM_MODEL_NAME not fully configured in .env. LLM functionality may be limited.`,
    );
  }

  // Load all Gemini provider keys from environment
  const geminiKeys = [
    { provider: 'gemini-pro-2', model: 'gemini-2.5-pro', envVar: 'LLM_API_KEY_GEMINI_PRO_2' },
    { provider: 'gemini-pro-3', model: 'gemini-2.5-pro', envVar: 'LLM_API_KEY_GEMINI_PRO_3' },
    { provider: 'gemini-pro-4', model: 'gemini-2.5-pro', envVar: 'LLM_API_KEY_GEMINI_PRO_4' },
    { provider: 'gemini-flash-2', model: 'gemini-2.5-flash', envVar: 'LLM_API_KEY_GEMINI_FLASH_2' },
    { provider: 'gemini-flash-3', model: 'gemini-2.5-flash', envVar: 'LLM_API_KEY_GEMINI_FLASH_3' },
    { provider: 'gemini-flash-4', model: 'gemini-2.5-flash', envVar: 'LLM_API_KEY_GEMINI_FLASH_4' },
  ];

  for (const keyConfig of geminiKeys) {
    const apiKey = process.env[keyConfig.envVar];
    if (apiKey) {
      try {
        await LlmKeyManager.addKey(
          'gemini', // All these are Gemini providers
          apiKey,
          keyConfig.model,
        );
        getLoggerInstance().info(
          `Gemini API key for ${keyConfig.provider} (${keyConfig.model}) added to KeyManager.`,
        );
      } catch (error) {
        getLoggerInstance().warn(
          { error, provider: keyConfig.provider },
          `Failed to add Gemini API key for ${keyConfig.provider}`,
        );
      }
    }
  }

  getLoggerInstance().info(
    `[INIT LLM] LLM API key management is now handled dynamically.`,
  );

  getLoggerInstance().info(
    `PostgreSQL Host for Worker: ${config.POSTGRES_HOST}`,
  );
  getLoggerInstance().info(
    `PostgreSQL Connection Details: host=${config.POSTGRES_HOST}, user=${config.POSTGRES_USER}, db=${config.POSTGRES_DB}, password_length=${config.POSTGRES_PASSWORD?.length || 0}`,
  );

  // Initialize PostgreSQL pool for worker
  const poolManager = getPostgresPool();
  const circuitBreaker = new DatabaseCircuitBreaker();

  // Test pool connection
  try {
    await circuitBreaker.execute(async () => {
      const client = await poolManager.getClient();
      await client.query('SELECT 1 as worker_health_check');
      client.release();
    });
    getLoggerInstance().info('PostgreSQL pool initialized successfully for worker');
  } catch (err) {
    getLoggerInstance().error(
      { err },
      'Failed to initialize PostgreSQL pool for worker',
    );
    process.exit(1);
  }

  // Add a small delay between worker initializations to prevent rapid startup
  await new Promise((resolve) => setTimeout(resolve, 1000));

  initializeWorker(redisConnection).catch((err) => {
    getLoggerInstance().error({ err }, "Échec de l'initialisation du worker");
    process.exit(1);
  });
}
