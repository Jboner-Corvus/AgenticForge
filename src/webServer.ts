import cookieParser from 'cookie-parser';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
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