import type { Queue } from 'bullmq';

import { exec } from 'child_process';
import chokidar from 'chokidar';
import cookieParser from 'cookie-parser';
import express, { type Application } from 'express';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import path from 'path';
import { Client as PgClient } from 'pg';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

import { getConfig, loadConfig } from './config.js';
import { getLoggerInstance } from './logger.js';
import { redisClient } from './modules/redis/redisClient.js';
const config = getConfig();
import { LlmKeyManager as _LlmKeyManager } from './modules/llm/LlmKeyManager.js';
import { SessionManager } from './modules/session/sessionManager.js';
import { Message, SessionData } from './types.js';
import { AppError, handleError } from './utils/errorUtils.js';
import { getTools } from './utils/toolLoader.js';

export let configWatcher: import('chokidar').FSWatcher | null = null;

export async function initializeWebServer(
  jobQueue: Queue,
  pgClient: PgClient,
): Promise<{ app: Application; server: Server }> {
  const app = express();
  const sessionManager = new SessionManager(pgClient);
  app.use(express.json());
  app.use(express.static(path.join(process.cwd(), 'packages', 'ui', 'dist')));
  app.use(cookieParser());

  app.use(
    (
      req: express.Request,
      _res: express.Response,
      next: express.NextFunction,
    ) => {
      (req as any).sessionManager = sessionManager;
      next();
    },
  );

  if (process.env.NODE_ENV !== 'production') {
    watchConfig();
  }

  app.use(
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      let sessionId =
        req.cookies.agenticforge_session_id || req.headers['x-session-id'];

      if (!sessionId) {
        sessionId = uuidv4();
        res.cookie('agenticforge_session_id', sessionId, {
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60 * 1000,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        });
        redisClient
          .incr('leaderboard:sessionsCreated')
          .catch((err: unknown) => {
            getLoggerInstance().error(
              { err },
              'Failed to increment sessionsCreated in Redis',
            );
          });
      }
      (req as any).sessionId = sessionId;
      (req as any).redis = redisClient;
      res.setHeader('X-Session-ID', sessionId);
      next();
    },
  );

  app.use(
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      if (
        req.path === '/api/health' ||
        req.path.startsWith('/api/auth/github')
      ) {
        return next();
      }

      const apiKey = req.headers.authorization;
      if (config.AUTH_API_KEY && apiKey !== `Bearer ${config.AUTH_API_KEY}`) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      next();
    },
  );

  app.get('/api/health', (req: express.Request, res: express.Response) => {
    res.status(200).send('OK');
  });

  app.get(
    '/api/tools',
    async (
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      try {
        const tools = await getTools();
        res.status(200).json(tools);
      } catch (_error) {
        _next(_error);
      }
    },
  );

  app.post(
    '/api/chat',
    async (
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      try {
        const { apiKey, llmApiKey, llmModelName, llmProvider, prompt } =
          req.body;
        const _sessionId = req.sessionId;

        if (!prompt) {
          throw new AppError('Le prompt est manquant.', { statusCode: 400 });
        }

        getLoggerInstance().info(
          { prompt, sessionId: _sessionId },
          'Nouveau message reçu',
        );

        const _job = await jobQueue.add('process-message', {
          apiKey,
          llmApiKey,
          llmModelName,
          llmProvider,
          prompt,
          sessionId: _sessionId,
        });
        req.job = _job;

        res.status(202).json({
          jobId: _job.id,
          message: 'Requête reçue, traitement en cours.',
        });
      } catch (_error) {
        _next(_error);
      }
    },
  );

  app.get(
    '/api/chat/stream/:jobId',
    async (
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      const { jobId } = req.params;
      const _sessionId = req.sessionId;

      res.writeHead(200, {
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream',
      });

      const subscriber = redisClient.duplicate();
      const channel = `job:${jobId}:events`;

      await subscriber.subscribe(channel);
      getLoggerInstance().info(`Subscribed to ${channel} for SSE.`);

      subscriber.on('message', (channel: string, message: string) => {
        getLoggerInstance().info(
          { channel, message },
          'Received message from Redis channel',
        );
        res.write('data: ' + message + '\n\n');
      });

      const heartbeatInterval = setInterval(() => {
        res.write(`data: heartbeat\n\n`);
      }, 15000);

      req.on('close', () => {
        getLoggerInstance().info(
          `Client disconnected from SSE for job ${jobId}. Unsubscribing.`,
        );
        getLoggerInstance().debug(
          `Attempting to unsubscribe from channel: ${channel}`,
        );
        clearInterval(heartbeatInterval);
        subscriber.unsubscribe(channel);
        subscriber.quit();
        getLoggerInstance().debug(
          `Unsubscribed and quit for channel: ${channel}`,
        );
      });
    },
  );

  app.post(
    '/api/session',
    async (req: express.Request, res: express.Response) => {
      const sessionId = req.sessionId;
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is missing.' });
      }
      try {
        await req.sessionManager!.getSession(sessionId);
        getLoggerInstance().info(
          { sessionId },
          'Session implicitly created/retrieved via cookie/header.',
        );
        res.status(200).json({
          message: 'Session managed automatically via cookie/header.',
          sessionId,
        });
      } catch (error) {
        getLoggerInstance().error(
          { error },
          'Error managing session implicitly',
        );
        res.status(500).json({ error: 'Failed to manage session.' });
      }
    },
  );

  app.post(
    '/api/session/llm-provider',
    async (
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      try {
        const { providerName } = req.body;
        const sessionId = req.sessionId;

        if (!sessionId || !providerName) {
          throw new AppError('Missing session ID or provider name', {
            statusCode: 400,
          });
        }

        const session = await req.sessionManager!.getSession(sessionId);
        session.activeLlmProvider = providerName;
        await req.sessionManager!.saveSession(session, req.job, jobQueue);

        getLoggerInstance().info(
          { providerName, sessionId },
          'Active LLM provider updated for session.',
        );
        res
          .status(200)
          .json({ message: 'Active LLM provider updated successfully.' });
      } catch (_error) {
        _next(_error);
      }
    },
  );

  app.get(
    '/api/leaderboard-stats',
    async (
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      try {
        const sessionsCreated =
          (await redisClient.get('leaderboard:sessionsCreated')) || '0';
        const tokensSaved =
          (await redisClient.get('leaderboard:tokensSaved')) || '0';
        const successfulRuns =
          (await redisClient.get('leaderboard:successfulRuns')) || '0';

        res.status(200).json({
          apiKeysAdded: 0,
          sessionsCreated: parseInt(sessionsCreated, 10),
          successfulRuns: parseInt(successfulRuns, 10),
          tokensSaved: parseInt(tokensSaved, 10),
        });
      } catch (_error) {
        _next(_error);
      }
    },
  );

  app.post(
    '/api/sessions/save',
    async (
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      try {
        const { id, messages, name, timestamp } = req.body;
        if (!id || !name || !messages || !timestamp) {
          throw new AppError('Missing session data', { statusCode: 400 });
        }
        const sessionDataToSave: SessionData = {
          history: messages as Message[],
          id,
          identities: [],
          name,
          timestamp,
        };
        await req.sessionManager!.saveSession(
          sessionDataToSave,
          req.job,
          jobQueue,
        );
        getLoggerInstance().info(
          { sessionId: id, sessionName: name },
          'Session saved to PostgreSQL.',
        );
        res.status(200).json({ message: 'Session saved successfully.' });
      } catch (_error) {
        _next(_error);
      }
    },
  );

  app.get(
    '/api/sessions/:id',
    async (
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      try {
        const { id } = req.params;
        const sessionData = await req.sessionManager!.getSession(id);
        if (!sessionData) {
          throw new AppError('Session not found', { statusCode: 404 });
        }
        res.status(200).json(sessionData);
      } catch (_error) {
        _next(_error);
      }
    },
  );

  app.delete(
    '/api/sessions/:id',
    async (
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      try {
        const { id } = req.params;
        await req.sessionManager!.deleteSession(id);
        getLoggerInstance().info(
          { sessionId: id },
          'Session deleted from PostgreSQL.',
        );
        res.status(200).json({ message: 'Session deleted successfully.' });
      } catch (_error) {
        _next(_error);
      }
    },
  );

  app.put(
    '/api/sessions/:id/rename',
    async (
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      try {
        const { id } = req.params;
        const { newName } = req.body;
        if (!newName) {
          throw new AppError('New name is missing', { statusCode: 400 });
        }
        const updatedSession = await req.sessionManager!.renameSession(
          id,
          newName,
        );
        getLoggerInstance().info(
          { newName, sessionId: id },
          'Session renamed in PostgreSQL.',
        );
        res.status(200).json({
          message: 'Session renamed successfully.',
          session: updatedSession,
        });
      } catch (_error) {
        _next(_error);
      }
    },
  );

  app.post(
    '/api/llm-api-keys',
    async (
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      try {
        const { key, provider } = req.body;
        if (!provider || !key) {
          throw new AppError('Missing provider or key', { statusCode: 400 });
        }
        await _LlmKeyManager.addKey(provider, key);
        res.status(200).json({ message: 'LLM API key added successfully.' });
      } catch (_error) {
        _next(_error);
      }
    },
  );

  app.get(
    '/api/llm-api-keys',
    async (
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      try {
        const keys = await _LlmKeyManager.getKeysForApi();
        res.status(200).json(keys);
      } catch (_error) {
        _next(_error);
      }
    },
  );

  app.delete(
    '/api/llm-api-keys/:index',
    async (
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      try {
        const { index } = req.params;
        const keyIndex = parseInt(index, 10);
        if (isNaN(keyIndex)) {
          throw new AppError('Invalid index', { statusCode: 400 });
        }
        await _LlmKeyManager.removeKey(keyIndex);
        res.status(200).json({ message: 'LLM API key removed successfully.' });
      } catch (error) {
        _next(error);
      }
    },
  );

  app.get(
    '/api/sessions',
    async (
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      try {
        const sessions = await req.sessionManager!.getAllSessions();
        res.status(200).json(sessions);
      } catch (_error) {
        _next(_error);
      }
    },
  );

  app.get('/api/auth/github', (req: express.Request, res: express.Response) => {
    const githubClientId = config.GITHUB_CLIENT_ID;
    if (!githubClientId) {
      return res
        .status(500)
        .json({ error: 'GitHub Client ID not configured.' });
    }
    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/github/callback`;
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${redirectUri}&scope=user:email`;
    res.redirect(githubAuthUrl);
  });

  app.get(
    '/api/auth/github/callback',
    async (
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      try {
        const { code } = req.query;
        const githubClientId = config.GITHUB_CLIENT_ID;
        const githubClientSecret = config.GITHUB_CLIENT_SECRET;

        if (!code || !githubClientId || !githubClientSecret) {
          throw new AppError('Missing code or GitHub credentials', {
            statusCode: 400,
          });
        }

        const tokenResponse = await fetch(
          'https://github.com/login/oauth/access_token',
          {
            body: JSON.stringify({
              client_id: githubClientId,
              client_secret: githubClientSecret,
              code: code,
            }),
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            method: 'POST',
          },
        );

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
          const loggedTokenData = { ...tokenData };
          if (loggedTokenData.access_token) {
            loggedTokenData.access_token = '***REDACTED***';
          }
          getLoggerInstance().error(
            { tokenData: loggedTokenData },
            'GitHub OAuth Error',
          );
          throw new AppError(
            `GitHub OAuth error: ${tokenData.error_description || tokenData.error}`,
            { statusCode: 400 },
          );
        }

        const accessToken = tokenData.access_token;

        if (req.sessionId) {
          await redisClient.set(
            `github:accessToken:${req.sessionId}`,
            accessToken,
            'EX',
            3600,
          );
          getLoggerInstance().info(
            { accessToken: '***REDACTED***', sessionId: req.sessionId },
            'GitHub access token stored in Redis.',
          );

          if (config.JWT_SECRET) {
            const userId = req.sessionId;
            const token = jwt.sign({ userId }, config.JWT_SECRET, {
              expiresIn: '1h',
            });
            res.cookie('agenticforge_jwt', token, {
              httpOnly: true,
              maxAge: 3600 * 1000,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
            });
            getLoggerInstance().info(
              { userId },
              'JWT issued and sent to frontend.',
            );
          } else {
            getLoggerInstance().warn(
              'JWT_SECRET is not configured, skipping JWT issuance.',
            );
          }
        }

        res.redirect('/?github_auth_success=true');
      } catch (error) {
        _next(error);
      }
    },
  );

  app.post(
    '/api/interrupt/:jobId',
    async (
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      try {
        const { jobId } = req.params;
        const job = await jobQueue.getJob(jobId);

        if (!job) {
          throw new AppError('Job non trouvé.', { statusCode: 404 });
        }

        await redisClient.publish(`job:${jobId}:interrupt`, 'interrupt');

        res.status(200).json({ message: 'Interruption signal sent.' });
      } catch (error) {
        _next(error);
      }
    },
  );

  app.post(
    '/api/admin/:action',
    async (
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      try {
        const { action } = req.params;
        const scriptPath = path.resolve(process.cwd(), '..', 'run.sh');
        let command = '';

        switch (action) {
          case 'all-checks':
            command = `${scriptPath} all-checks`;
            break;
          case 'rebuild':
            command = `${scriptPath} rebuild`;
            break;
          case 'restart':
            command = `${scriptPath} restart`;
            break;
          default:
            throw new AppError('Invalid admin action.', { statusCode: 400 });
        }

        exec(command, (error, stdout, stderr) => {
          if (error) {
            getLoggerInstance().error(
              { error, stderr, stdout },
              `Error executing ${action}`,
            );
            return res.status(500).json({
              error: error.message,
              message: `Error during ${action}.`,
              stderr,
              stdout,
            });
          }
          getLoggerInstance().info(
            { stderr, stdout },
            `${action} executed successfully`,
          );
          res.status(200).json({
            message: `${action} completed successfully.`,
            output: stdout,
          });
        });
      } catch (error) {
        _next(error);
      }
    },
  );

  app.get(
    '/api/status/:jobId',
    async (
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      try {
        const { jobId } = req.params;
        const job = await jobQueue.getJob(jobId);

        if (!job) {
          throw new AppError('Job non trouvé.', { statusCode: 404 });
        }

        const state = await job.getState();
        const progress = job.progress;
        const returnvalue = job.returnvalue;

        res.status(200).json({ jobId, progress, returnvalue, state });
      } catch (error) {
        _next(error);
      }
    },
  );

  app.use(handleError);

  const server = new Server(app);

  if (process.env.NODE_ENV !== 'test') {
    process.on('uncaughtException', (error: Error) => {
      getLoggerInstance().fatal({ error }, 'Unhandled exception caught!');
      process.exit(1);
    });

    process.on(
      'unhandledRejection',
      (reason: unknown, promise: Promise<any>) => {
        getLoggerInstance().fatal(
          { promise, reason },
          'Unhandled rejection caught!',
        );
        process.exit(1);
      },
    );
  }

  return { app, server };
}

function watchConfig() {
  const envPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../.env',
  );
  getLoggerInstance().info(
    `[watchConfig] Watching for .env changes in: ${envPath}`,
  );

  configWatcher = chokidar.watch(envPath, {
    ignoreInitial: true,
    persistent: true,
  });

  configWatcher.on('change', async () => {
    getLoggerInstance().info(
      '[watchConfig] .env file changed, reloading configuration...',
    );
    await loadConfig();
    getLoggerInstance().info('[watchConfig] Configuration reloaded.');
  });

  configWatcher.on('error', (error: unknown) => {
    getLoggerInstance().error(
      { error: error as Error },
      '[watchConfig] Watcher error',
    );
  });
}
