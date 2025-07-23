import type { Queue } from 'bullmq';
import type { Redis } from 'ioredis';

import cookieParser from 'cookie-parser';
import express, { type Application } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';


import { config } from './config.js';
import logger from './logger.js';
import { LlmKeyManager } from './modules/llm/LlmKeyManager.js';
import { AppError, handleError } from './utils/errorUtils.js';
import { getTools } from './utils/toolLoader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initializeWebServer(redis: Redis, jobQueue: Queue): Promise<Application> {
  console.log('Inside initializeWebServer function');
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'ui', 'dist')));
  app.use(cookieParser());

  // Session management middleware
  app.use(
    (
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      let sessionId = req.cookies.agenticforge_session_id;

      if (!sessionId) {
        // Try to get session ID from a custom header for non-browser clients (e.g., curl)
        sessionId = req.headers['x-agenticforge-session-id'] as string;
      }

      if (!sessionId) {
        sessionId = uuidv4();
        res.cookie('agenticforge_session_id', sessionId, {
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60 * 1000,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        });
        // Increment sessionsCreated leaderboard stat
        redis.incr('leaderboard:sessionsCreated').catch(error => {
          logger.error({ error }, 'Failed to increment sessionsCreated in Redis');
        });
      }
      req.sessionId = sessionId;
      _next();
    },
  );

  // Middleware d'authentification par clé API
  app.use(
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      // Exempter la route de health check
      if (req.path === '/api/health') {
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
      } catch (error) {
        _next(error);
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
        const job = await jobQueue.add('process-message', {
          prompt,
          sessionId: _sessionId,
        });

        res.status(202).json({
          jobId: job.id,
          message: 'Requête reçue, traitement en cours.',
        });
      } catch (error) {
        _next(error);
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

      const subscriber = redis.duplicate();
      const channel = `job:${jobId}:events`;

      await subscriber.subscribe(channel);
      logger.info(`Subscribed to ${channel} for SSE.`);

      subscriber.on('message', (channel: string, message: string) => {
        logger.info(
          { channel, message },
          'Received message from Redis channel',
        );
        res.write(`data: ${message}

`);
      });

      req.on('close', () => {
        logger.info(
          `Client disconnected from SSE for job ${jobId}. Unsubscribing.`,
        );
        subscriber.unsubscribe(channel);
        subscriber.quit();
      });

      // Send a heartbeat to keep the connection alive
      const heartbeatInterval = setInterval(() => {
        res.write('data: heartbeat\n\n');
      }, 15000);

      req.on('close', () => {
        clearInterval(heartbeatInterval);
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
        const storedHistory = await redis.get(historyKey);
        const history = storedHistory ? JSON.parse(storedHistory) : [];
        res.status(200).json(history);
      } catch (error) {
        _next(error);
      }
    },
  );

  app.post('/api/session', (req: express.Request, res: express.Response) => {
    const sessionId = req.sessionId;
    logger.info(
      { sessionId },
      'Session implicitement créée/récupérée via cookie.',
    );
    res.status(200).json({
      message: 'Session gérée automatiquement via cookie.',
      sessionId,
    });
  });

  app.get('/api/leaderboard-stats', async (req: express.Request, res: express.Response, _next: express.NextFunction) => {
    try {
      const sessionsCreated = await redis.get('leaderboard:sessionsCreated') || '0';
      const tokensSaved = await redis.get('leaderboard:tokensSaved') || '0';
      const successfulRuns = await redis.get('leaderboard:successfulRuns') || '0';

      res.status(200).json({
        apiKeysAdded: 0,
        sessionsCreated: parseInt(sessionsCreated, 10),
        successfulRuns: parseInt(successfulRuns, 10),
        tokensSaved: parseInt(tokensSaved, 10),
      });
    } catch (error) {
      _next(error);
    }
  });

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

        const files = await fs.promises.readdir(workspaceDir);
        
        let filesToRead = files;
        if (limit) {
          const parsedLimit = parseInt(limit as string, 10);
          const parsedOffset = offset ? parseInt(offset as string, 10) : 0;
          filesToRead = files.slice(parsedOffset, parsedOffset + parsedLimit);
        }

        const memoryContents = await Promise.all(
          filesToRead.map(async (file) => {
            const content = await fs.promises.readFile(
              path.join(workspaceDir, file),
              'utf-8',
            );
            return { content, fileName: file };
          }),
        );
        res.status(200).json(memoryContents);
      } catch (error) {
        _next(error);
      }
    },
  );

  // New API for saving a session
  app.post('/api/sessions/save', async (req: express.Request, res: express.Response, _next: express.NextFunction) => {
    try {
      const { id, messages, name, timestamp } = req.body;
      if (!id || !name || !messages || !timestamp) {
        throw new AppError('Missing session data', { statusCode: 400 });
      }
      const sessionKey = `session:${id}:data`;
      await redis.set(sessionKey, JSON.stringify({ id, messages, name, timestamp }));
      logger.info({ sessionId: id, sessionName: name }, 'Session saved to Redis.');
      res.status(200).json({ message: 'Session saved successfully.' });
    } catch (error) {
      _next(error);
    }
  });

  // New API for loading a session
  app.get('/api/sessions/:id', async (req: express.Request, res: express.Response, _next: express.NextFunction) => {
    try {
      const { id } = req.params;
      const sessionKey = `session:${id}:data`;
      const sessionData = await redis.get(sessionKey);
      if (!sessionData) {
        throw new AppError('Session not found', { statusCode: 404 });
      }
      res.status(200).json(JSON.parse(sessionData));
    } catch (error) {
      _next(error);
    }
  });

  // New API for deleting a session
  app.delete('/api/sessions/:id', async (req: express.Request, res: express.Response, _next: express.NextFunction) => {
    try {
      const { id } = req.params;
      const sessionKey = `session:${id}:data`;
      await redis.del(sessionKey);
      logger.info({ sessionId: id }, 'Session deleted from Redis.');
      res.status(200).json({ message: 'Session deleted successfully.' });
    } catch (error) {
      _next(error);
    }
  });

  // New API for renaming a session
  app.put('/api/sessions/:id/rename', async (req: express.Request, res: express.Response, _next: express.NextFunction) => {
    try {
      const { id } = req.params;
      const { newName } = req.body;
      if (!newName) {
        throw new AppError('New name is missing', { statusCode: 400 });
      }
      const sessionKey = `session:${id}:data`;
      const sessionData = await redis.get(sessionKey);
      if (!sessionData) {
        throw new AppError('Session not found', { statusCode: 404 });
      }
      const parsedSession = JSON.parse(sessionData);
      parsedSession.name = newName;
      await redis.set(sessionKey, JSON.stringify(parsedSession));
      logger.info({ newName, sessionId: id }, 'Session renamed in Redis.');
      res.status(200).json({ message: 'Session renamed successfully.' });
    } catch (error) {
      _next(error);
    }
  });

  // New API for adding an LLM API key
  app.post('/api/llm-api-keys', async (req: express.Request, res: express.Response, _next: express.NextFunction) => {
    try {
      const { key, provider } = req.body;
      if (!provider || !key) {
        throw new AppError('Missing provider or key', { statusCode: 400 });
      }
      await LlmKeyManager.addKey(provider, key);
      res.status(200).json({ message: 'LLM API key added successfully.' });
    } catch (error) {
      _next(error);
    }
  });

  // New API for retrieving LLM API keys
  app.get('/api/llm-api-keys', async (req: express.Request, res: express.Response, _next: express.NextFunction) => {
    try {
      const keys = await LlmKeyManager.getKeysForApi();
      res.status(200).json(keys);
    } catch (error) {
      _next(error);
    }
  });

  // New API for deleting an LLM API key
  app.delete('/api/llm-api-keys/:index', async (req: express.Request, res: express.Response, _next: express.NextFunction) => {
    try {
      const { index } = req.params;
      const keyIndex = parseInt(index, 10);
      if (isNaN(keyIndex)) {
        throw new AppError('Invalid index', { statusCode: 400 });
      }
      await LlmKeyManager.removeKey(keyIndex);
      res.status(200).json({ message: 'LLM API key removed successfully.' });
    } catch (error) {
      _next(error);
    }
  });

  // GitHub OAuth initiation
  app.get('/api/auth/github', (req: express.Request, res: express.Response) => {
    const githubClientId = config.GITHUB_CLIENT_ID;
    if (!githubClientId) {
      return res.status(500).json({ error: 'GitHub Client ID not configured.' });
    }
    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/github/callback`;
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${redirectUri}&scope=user:email`;
    res.redirect(githubAuthUrl);
  });

  // GitHub OAuth callback
  app.get('/api/auth/github/callback', async (req: express.Request, res: express.Response, _next: express.NextFunction) => {
    try {
      const { code } = req.query;
      const githubClientId = config.GITHUB_CLIENT_ID;
      const githubClientSecret = config.GITHUB_CLIENT_SECRET;

      if (!code || !githubClientId || !githubClientSecret) {
        throw new AppError('Missing code or GitHub credentials', { statusCode: 400 });
      }

      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        body: JSON.stringify({
          client_id: githubClientId,
          client_secret: githubClientSecret,
          code: code,
        }),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        throw new AppError(`GitHub OAuth error: ${tokenData.error_description || tokenData.error}`, { statusCode: 400 });
      }

      const accessToken = tokenData.access_token;

      // For now, store the access token in Redis associated with the session ID
      // In a real application, you would typically store this in a database
      // and associate it with a user account.
      if (req.sessionId) {
        await redis.set(`github:accessToken:${req.sessionId}`, accessToken, 'EX', 3600); // Store for 1 hour
        logger.info({ accessToken: '***REDACTED***', sessionId: req.sessionId }, 'GitHub access token stored in Redis.');
      }

      // Redirect to frontend, perhaps with a success message or user info
      res.redirect('/?github_auth_success=true'); // Redirect to your frontend's main page
    } catch (error) {
      _next(error);
    }
  });

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
        await redis.publish(`job:${jobId}:interrupt`, 'interrupt');

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
        const filePath = path.join(__dirname, '..', 'workspace', 'index.html');
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const _sessionId = req.sessionId;
        const channel = `job:display:events`;
        const message = {
          payload: {
            content,
            type: 'html', // TODO: Make this dynamic based on file type (e.g., markdown, image, pdf)
          },
          type: 'displayOutput',
        };
        await redis.publish(channel, JSON.stringify(message));
        res.status(200).json({ message: 'Display event sent.' });
      } catch (error) {
        _next(error);
      }
    },
  );

  app.use(handleError);

  if (process.env.NODE_ENV !== 'test') {
    process.on('uncaughtException', (error) => {
      logger.fatal({ error }, 'Unhandled exception caught!');
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.fatal({ promise, reason }, 'Unhandled rejection caught!');
      process.exit(1);
    });
  }

  return app;
}