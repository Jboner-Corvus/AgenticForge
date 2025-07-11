import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

import { config } from './config.js';
import logger from './logger.js';
import { jobQueue } from './queue.js';
import { redis } from './redisClient.js';
import { AppError, handleError } from './utils/errorUtils.js';
import { getTools } from './utils/toolLoader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function startWebServer() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  // CORS configuration
  app.use(cors({
    origin: 'http://192.168.2.56:5173',
    credentials: true,
  }));

  app.use(express.static(path.join(__dirname, '..', 'ui', 'dist')));

  app.use(
    (
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      let sessionId = req.cookies.agenticforge_session_id;

      if (!sessionId) {
        sessionId = uuidv4();
        res.cookie('agenticforge_session_id', sessionId, {
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60 * 1000,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        });
      }
      req.sessionId = sessionId;
      _next();
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
        res.write(`data: ${message}\n\n`);
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
        res.write(':heartbeat\n\n');
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

  app.get(
    '/api/memory',
    async (
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      try {
        const workspaceDir = path.resolve(process.cwd(), 'workspace');
        const files = await fs.promises.readdir(workspaceDir);
        const memoryContents = await Promise.all(
          files.map(async (file) => {
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

  app.use(handleError);

  app.listen(config.PORT, '0.0.0.0', () => {
    logger.info(
      `Serveur AgenticForge (mode scalable) démarré sur http://0.0.0.0:${config.PORT}`,
    );
  });
}
