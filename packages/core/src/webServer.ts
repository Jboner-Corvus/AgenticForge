import type { Queue } from 'bullmq';
import type { Redis as _Redis } from 'ioredis';

import chokidar from 'chokidar';
import cookieParser from 'cookie-parser';
import express, { type Application } from 'express';
import * as fs from 'fs/promises';
import jwt from 'jsonwebtoken';
import path from 'path';
import { Client as PgClient } from 'pg';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

import { config, loadConfig } from './config.js';
import logger from './logger.js';
import { LlmKeyManager as _LlmKeyManager } from './modules/llm/LlmKeyManager';
import { SessionManager } from './modules/session/sessionManager.js';
import { Message, SessionData } from './types.js';
import { AppError, handleError } from './utils/errorUtils.js';
import { getTools } from './utils/toolLoader.js';

// ... rest of the file

let configWatcher: import('chokidar').FSWatcher | null = null;

export async function initializeWebServer(
  redisClient: _Redis,
  jobQueue: Queue,
  pgClient: PgClient,
): Promise<Application> {
  const app = express();
  const sessionManager = new SessionManager(pgClient);
  app.use(express.json());
  app.use(express.static(path.join(process.cwd(), 'packages', 'ui', 'dist')));
  app.use(cookieParser());

  // Middleware to attach sessionManager to req
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

  // Start watching config changes
  if (process.env.NODE_ENV !== 'production') {
    watchConfig();
  }

  // Session management middleware
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
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        });
        // Increment sessionsCreated leaderboard stat for new sessions
        redisClient
          .incr('leaderboard:sessionsCreated')
          .catch((err: unknown) => {
            logger.error(
              { err },
              'Failed to increment sessionsCreated in Redis',
            );
          });
      }
      (req as any).sessionId = sessionId;
      (req as any).redis = redisClient; // Attach redis to req
      res.setHeader('X-Session-ID', sessionId); // Always send X-Session-ID header
      next();
    },
  );

  // Middleware d'authentification par clé API
  app.use(
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      // Exempt the health check and GitHub auth routes from API key authentication
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
        const { prompt } = req.body;
        const _sessionId = req.sessionId;

        if (!prompt) {
          throw new AppError('Le prompt est manquant.', { statusCode: 400 });
        }

        logger.info({ prompt, sessionId: _sessionId }, 'Nouveau message reçu');

        // For SSE, we'll add the job and then immediately return a 200 OK
        // The actual streaming will happen on a separate endpoint or via a different mechanism
        // For now, we'll keep the existing job queueing logic.
        const _job = await jobQueue.add('process-message', {
          prompt,
          sessionId: _sessionId,
        });
        req.job = _job; // Attach job to request

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
      logger.info(`Subscribed to ${channel} for SSE.`);

      subscriber.on('message', (channel: string, message: string) => {
        logger.info(
          { channel, message },
          'Received message from Redis channel',
        );
        res.write('data: ' + message + '\n\n');
      });

      // Send a heartbeat to keep the connection alive
      const heartbeatInterval = setInterval(() => {
        res.write(`data: heartbeat\n\n`);
      }, 15000);

      req.on('close', () => {
        logger.info(
          `Client disconnected from SSE for job ${jobId}. Unsubscribing.`,
        );
        clearInterval(heartbeatInterval);
        subscriber.unsubscribe(channel);
        subscriber.quit();
      });
    },
  );

  app.get(
    '/api/history',
    async (
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      try {
        const sessionId = req.sessionId;
        const historyKey = `session:${sessionId}:history`;
        const storedHistory = await redisClient.get(historyKey);
        const history = storedHistory ? JSON.parse(storedHistory) : [];
        res.status(200).json(history);
      } catch (_error) {
        _next(_error);
      }
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
        await req.sessionManager!.getSession(sessionId); // Ensure session exists or is created
        logger.info(
          { sessionId },
          'Session implicitly created/retrieved via cookie/header.',
        );
        res.status(200).json({
          message: 'Session managed automatically via cookie/header.',
          sessionId,
        });
      } catch (error) {
        logger.error({ error }, 'Error managing session implicitly');
        res.status(500).json({ error: 'Failed to manage session.' });
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

  app.get(
    '/api/memory',
    async (
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      try {
        const workspaceDir = path.resolve(process.cwd(), 'workspace');
        const { limit, offset } = req.query;

        const files = await fs.readdir(workspaceDir);

        let filesToRead = files;
        if (limit || offset) {
          const parsedLimit = limit ? parseInt(limit as string, 10) : Infinity;
          const parsedOffset = offset ? parseInt(offset as string, 10) : 0;

          if (
            isNaN(parsedLimit) ||
            parsedLimit < 0 ||
            isNaN(parsedOffset) ||
            parsedOffset < 0
          ) {
            throw new AppError('Invalid limit or offset', { statusCode: 400 });
          }

          filesToRead = files.slice(parsedOffset, parsedOffset + parsedLimit);
        }

        const memoryContents = await Promise.all(
          filesToRead.map(async (file) => {
            const filePath = path.join(workspaceDir, file);
            const stats = await fs.stat(filePath);
            if (stats.size > config.MAX_FILE_SIZE_BYTES) {
              return {
                content: `File is too large to be displayed (>${config.MAX_FILE_SIZE_BYTES} bytes).`,
                error: 'File too large',
                fileName: file,
              };
            }
            const content = await fs.readFile(filePath, 'utf-8');
            return { content, fileName: file };
          }),
        );
        res.status(200).json(memoryContents);
      } catch (_error) {
        logger.error(_error, 'Failed to retrieve memory contents.');
        res.status(200).json([]);
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
        // Use the sessionManager instance from req
        const sessionDataToSave: SessionData = {
          history: messages as Message[],
          id,
          identities: [], // Assuming identities are not sent in this payload, or need to be fetched
          name,
          timestamp,
        };
        await req.sessionManager!.saveSession(
          sessionDataToSave,
          req.job,
          jobQueue,
        );
        logger.info(
          { sessionId: id, sessionName: name },
          'Session saved to PostgreSQL.',
        );
        res.status(200).json({ message: 'Session saved successfully.' });
      } catch (_error) {
        _next(_error);
      }
    },
  );

  // New API for loading a session
  app.get(
    '/api/sessions/:id',
    async (
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      try {
        const { id } = req.params;
        // Use the sessionManager instance from req
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

  // New API for deleting a session
  app.delete(
    '/api/sessions/:id',
    async (
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      try {
        const { id } = req.params;
        // Use the sessionManager instance from req
        await req.sessionManager!.deleteSession(id);
        logger.info({ sessionId: id }, 'Session deleted from PostgreSQL.');
        res.status(200).json({ message: 'Session deleted successfully.' });
      } catch (_error) {
        _next(_error);
      }
    },
  );

  // New API for renaming a session
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
        // Use the sessionManager instance from req
        const updatedSession = await req.sessionManager!.renameSession(
          id,
          newName,
        );
        logger.info(
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

  // New API for adding an LLM API key
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

  // New API for retrieving LLM API keys
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

  // New API for deleting an LLM API key
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

  // New API for retrieving all sessions
  app.get(
    '/api/sessions',
    async (
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      try {
        const sessions = await req.sessionManager!.getAllSessions(); // Assuming a new method to get all sessions
        res.status(200).json(sessions);
      } catch (_error) {
        _next(_error);
      }
    },
  );

  // GitHub OAuth initiation
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

  // GitHub OAuth callback
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
          // Log the full error object from GitHub for better debugging, redacting sensitive info
          const loggedTokenData = { ...tokenData };
          if (loggedTokenData.access_token) {
            loggedTokenData.access_token = '***REDACTED***';
          }
          logger.error({ tokenData: loggedTokenData }, 'GitHub OAuth Error');
          throw new AppError(
            `GitHub OAuth error: ${tokenData.error_description || tokenData.error}`,
            { statusCode: 400 },
          );
        }

        const accessToken = tokenData.access_token;

        // For now, store the access token in Redis associated with the session ID
        // In a real application, you would typically store this in a database
        // and associate it with a user account.
        if (req.sessionId) {
          await redisClient.set(
            `github:accessToken:${req.sessionId}`,
            accessToken,
            'EX',
            3600,
          ); // Store for 1 hour
          logger.info(
            { accessToken: '***REDACTED***', sessionId: req.sessionId },
            'GitHub access token stored in Redis.',
          );

          // Generate JWT and send to frontend
          if (config.JWT_SECRET) {
            // In a real app, you'd fetch user info from GitHub API using accessToken
            // For this example, we'll use a dummy userId or derive it from sessionId
            const userId = req.sessionId; // Placeholder for actual user ID
            const token = jwt.sign({ userId }, config.JWT_SECRET, {
              expiresIn: '1h',
            });
            res.cookie('agenticforge_jwt', token, {
              httpOnly: true,
              maxAge: 3600 * 1000, // 1 hour
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
            });
            logger.info({ userId }, 'JWT issued and sent to frontend.');
          } else {
            logger.warn('JWT_SECRET is not configured, skipping JWT issuance.');
          }
        }

        // Redirect to frontend, perhaps with a success message or user info
        res.redirect('/?github_auth_success=true'); // Redirect to your frontend's main page
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

        // A simple way to interrupt is to publish a message on a specific channel
        // that the worker is listening to. The worker can then gracefully stop.
        await redisClient.publish(`job:${jobId}:interrupt`, 'interrupt');

        res.status(200).json({ message: 'Interruption signal sent.' });
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

  app.get(
    '/api/display',
    async (
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      try {
        const { file } = req.query;
        if (!file || typeof file !== 'string') {
          throw new AppError('File parameter is missing or invalid.', {
            statusCode: 400,
          });
        }

        const filePath = path.join(process.cwd(), 'workspace', file);
        const content = await fs.readFile(filePath, 'utf-8');
        const _sessionId = req.sessionId;
        const channel = `job:display:events`;

        const extension = path.extname(file).toLowerCase();
        let contentType: 'html' | 'image' | 'markdown' | 'pdf' | 'text' =
          'text';
        if (extension === '.html') {
          contentType = 'html';
        } else if (extension === '.md') {
          contentType = 'markdown';
        } else if (
          ['.gif', '.jpeg', '.jpg', '.png', '.svg'].includes(extension)
        ) {
          contentType = 'image';
        } else if (extension === '.pdf') {
          contentType = 'pdf';
        }

        const message = {
          payload: {
            content,
            type: contentType,
          },
          type: 'displayOutput',
        };
        await req.redis!.publish(channel, JSON.stringify(message));
        res.status(200).json({ message: 'Display event sent.' });
      } catch (error) {
        _next(error);
      }
    },
  );

  app.use(handleError);

  if (process.env.NODE_ENV !== 'test') {
    process.on('uncaughtException', (error: Error) => {
      logger.fatal({ error }, 'Unhandled exception caught!');
      process.exit(1);
    });

    process.on(
      'unhandledRejection',
      (reason: unknown, promise: Promise<any>) => {
        logger.fatal({ promise, reason }, 'Unhandled rejection caught!');
        process.exit(1);
      },
    );
  }

  return app;
}

function watchConfig() {
  const envPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../.env',
  );
  logger.info(`[watchConfig] Watching for .env changes in: ${envPath}`);

  configWatcher = chokidar.watch(envPath, {
    ignoreInitial: true,
    persistent: true,
  });

  configWatcher.on('change', async () => {
    logger.info('[watchConfig] .env file changed, reloading configuration...');
    loadConfig(); // Reload the configuration
    logger.info('[watchConfig] Configuration reloaded.');
  });

  configWatcher.on('error', (error: unknown) => {
    logger.error({ error: error as Error }, '[watchConfig] Watcher error');
  });
}
