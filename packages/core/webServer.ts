import cookieParser from 'cookie-parser';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

import { config } from './config';
import logger from './logger';
import { jobQueue } from './queue';
import { redis } from './redisClient';
import { AppError, handleError } from './utils/errorUtils';
import { getTools } from './utils/toolLoader';
import { validateApiKey, validateWebhook } from './utils/validationUtils';
import { sendWebhook } from './utils/webhookUtils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function startWebServer() {
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'ui', 'dist')));
  app.use(cookieParser());

  app.use((req, res, next) => {
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
    (req as any).sessionId = sessionId;
    next();
  });

  app.get('/api/health', (req, res) => {
    res.status(200).send('OK');
  });

  app.get('/api/tools', async (req, res, next) => {
    try {
      const tools = await getTools();
      res.status(200).json(tools);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/chat', async (req, res, next) => {
    try {
      const { prompt } = req.body;
      const sessionId = (req as any).sessionId;

      if (!prompt) {
        throw new AppError('Le prompt est manquant.', 400);
      }

      logger.info({ prompt, sessionId }, 'Nouveau message reçu');

      // For SSE, we'll add the job and then immediately return a 200 OK
      // The actual streaming will happen on a separate endpoint or via a different mechanism
      // For now, we'll keep the existing job queueing logic.
      const job = await jobQueue.add('process-message', {
        prompt,
        sessionId,
      });

      res.status(202).json({
        jobId: job.id,
        message: 'Requête reçue, traitement en cours.',
      });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/chat/stream/:jobId', async (req, res, next) => {
    const { jobId } = req.params;
    const sessionId = (req as any).sessionId;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const subscriber = redis.duplicate();
    const channel = `job:${jobId}:events`;

    subscriber.subscribe(channel, (err, count) => {
      if (err) {
        logger.error({ err }, 'Failed to subscribe to Redis channel');
        res.end();
        return;
      }
      logger.info(`Subscribed to ${channel} for SSE.`);
    });

    subscriber.on('message', (channel, message) => {
      logger.info({ channel, message }, 'Received message from Redis channel');
      res.write(`data: ${message}\n\n`);
    });

    req.on('close', () => {
      logger.info(`Client disconnected from SSE for job ${jobId}. Unsubscribing.`);
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
  });

  app.get('/api/history', async (req, res, next) => {
    try {
      const sessionId = (req as any).sessionId;
      const historyKey = `session:${sessionId}:history`;
      const storedHistory = await redis.get(historyKey);
      const history = storedHistory ? JSON.parse(storedHistory) : [];
      res.status(200).json(history);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/session', (req, res) => {
    const sessionId = (req as any).sessionId;
    logger.info(
      { sessionId },
      'Session implicitement créée/récupérée via cookie.',
    );
    res.status(200).json({
      message: 'Session gérée automatiquement via cookie.',
      sessionId,
    });
  });

  app.get('/api/memory', async (req, res, next) => {
    try {
      const workspaceDir = path.resolve(process.cwd(), 'workspace');
      const files = await fs.promises.readdir(workspaceDir);
      const memoryContents = await Promise.all(
        files.map(async (file) => {
          const content = await fs.promises.readFile(path.join(workspaceDir, file), 'utf-8');
          return { fileName: file, content };
        })
      );
      res.status(200).json(memoryContents);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/interrupt/:jobId', async (req, res, next) => {
    try {
      const { jobId } = req.params;
      const job = await jobQueue.getJob(jobId);

      if (!job) {
        throw new AppError('Job non trouvé.', 404);
      }

      // A simple way to interrupt is to publish a message on a specific channel
      // that the worker is listening to. The worker can then gracefully stop.
      await redis.publish(`job:${jobId}:interrupt`, 'interrupt');

      res.status(200).json({ message: 'Interruption signal sent.' });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/status/:jobId', async (req, res, next) => {
    try {
      const { jobId } = req.params;
      const job = await jobQueue.getJob(jobId);

      if (!job) {
        throw new AppError('Job non trouvé.', 404);
      }

      const state = await job.getState();
      const progress = job.progress;
      const returnvalue = job.returnvalue;

      res.status(200).json({ jobId, progress, returnvalue, state });
    } catch (error) {
      next(error);
    }
  });

  app.use(handleError);

  app.listen(config.PORT, () => {
    logger.info(`Serveur AgenticForge (mode scalable) démarré sur http://localhost:${config.PORT}`);
  });
}