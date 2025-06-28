// FICHIER MODIFIÉ : src/webServer.ts
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import cookieParser from 'cookie-parser'; // AJOUTÉ
import { jobQueue } from './queue';
import { redis } from './redisClient'; // AJOUTÉ
import {
  PORT,
  MCP_WEBHOOK_URL,
  MCP_API_KEY,
  QUALITY_GATE_API_KEY,
  QUALITY_GATE_URL,
} from './config';
import logger from './logger';
import { handleError, AppError } from './utils/errorUtils';
import { validateApiKey, validateWebhook } from './utils/validationUtils';
import { sendWebhook } from './utils/webhookUtils';

const app = express();
app.use(express.json());
app.use(express.static('public'));
app.use(cookieParser()); // AJOUTÉ : Middleware pour parser les cookies

/**
 * AJOUTÉ : Middleware de gestion de session
 * Crée et attache un ID de session à la requête via un cookie.
 * C'est transparent pour le client.
 */
app.use((req, res, next) => {
  let sessionId = req.cookies.agenticforge_session_id;

  if (!sessionId) {
    sessionId = uuidv4();
    res.cookie('agenticforge_session_id', sessionId, {
      httpOnly: true, // Empêche l'accès via JS côté client
      secure: process.env.NODE_ENV === 'production', // Uniquement sur HTTPS en production
      maxAge: 7 * 24 * 60 * 60 * 1000, // Expire en 7 jours
      sameSite: 'lax',
    });
  }
  // Attache l'ID de session à la requête pour un accès facile dans les routes
  (req as any).sessionId = sessionId;
  next();
});

/**
 * MODIFIÉ : La route /api/chat
 * N'utilise plus l'en-tête 'mcp-session-id'.
 * Récupère le sessionId attaché par le middleware de session.
 */
app.post('/api/chat', async (req, res, next) => {
  try {
    const { prompt } = req.body;
    const sessionId = (req as any).sessionId; // MODIFIÉ : Provient du cookie

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

/**
 * AJOUTÉ : Nouvelle route pour récupérer l'historique de la session actuelle
 * Utile pour le client afin d'afficher la conversation en cours.
 */
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

// La route /api/session est maintenant OBSOLÈTE et peut être supprimée
// car le client n'a plus besoin de créer une session manuellement.
app.post('/api/session', (req, res) => {
  const sessionId = (req as any).sessionId;
  logger.info(
    { sessionId },
    'Session implicitement créée/récupérée via cookie.',
  );
  res.status(200).json({
    message: 'Session gérée automatiquement via cookie.',
    sessionId, // On peut le renvoyer pour du débogage si besoin
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

// Les autres routes (webhook, quality-gate) restent inchangées...

app.use(handleError);

app.listen(PORT, () => {
  logger.info(`Serveur AgenticForge (mode scalable) démarré sur http://localhost:${PORT}`);
});