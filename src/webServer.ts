// FICHIER MODIFIÉ : src/webServer.ts
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import cookieParser from 'cookie-parser'; // AJOUTÉ
import { jobQueue } from './queue';
import { redis } from './redisClient'; // AJOUTÉ
import { config } from './config';
import logger from './logger';
import { handleError, AppError } from './utils/errorUtils';
import { validateApiKey, validateWebhook } from './utils/validationUtils';
import { sendWebhook } from './utils/webhookUtils';

export async function startWebServer() {
  const app = express();
  app.use(express.json());
  app.use(express.static('public'));
  app.use(cookieParser());

  app.use((req, res, next) => {
    let sessionId = req.cookies.agenticforge_session_id;

    if (!sessionId) {
      sessionId = uuidv4();
      res.cookie('agenticforge_session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'lax',
      });
    }
    (req as any).sessionId = sessionId;
    next();
  });

  app.post('/api/chat', async (req, res, next) => {
    try {
      const { prompt } = req.body;
      const sessionId = (req as any).sessionId;

      if (!prompt) {
        throw new AppError('Le prompt est manquant.', 400);
      }

      logger.info({ sessionId, prompt }, 'Nouveau message reçu');

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

      res.status(200).json({ jobId, state, progress, returnvalue });
    } catch (error) {
      next(error);
    }
  });

  app.use(handleError);

  app.listen(config.PORT, () => {
    logger.info(`Serveur AgenticForge (mode scalable) démarré sur http://localhost:${config.PORT}`);
  });
}