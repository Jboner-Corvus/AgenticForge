// ATTENTION : Ce fichier centralise la configuration et l'instanciation du client Redis.
// Redis n'est pas seulement utilisé pour la file d'attente des jobs, mais aussi pour :
// - Le stockage des sessions utilisateur.
// - La communication inter-processus (ex: signal d'interruption d'un job via Pub/Sub).
//
// TOUTE MODIFICATION ICI A UN IMPACT GLOBAL SUR L'APPLICATION.
//
// La configuration est entièrement gérée par les variables d'environnement
// chargées dans l'objet `config`. Ne mettez jamais de valeurs en dur ici.
// Pour modifier la connexion, ajustez les variables d'environnement correspondantes.
import { Redis } from 'ioredis';

import { config } from './config.js';
import logger from './logger.js';

// Détermine l'hôte Redis en fonction de l'environnement d'exécution.
// Si le worker est local (pas dans Docker), il doit utiliser 'localhost'.
// Si le worker est dans Docker, il doit utiliser le nom de service 'redis'.
const redisHost =
  process.env.DOCKER === 'true' ? config.REDIS_HOST : 'localhost';
const redisUrl = `redis://${redisHost}:${config.REDIS_PORT}`;

logger.info(`[redisClient] Resolved redisHost: ${redisHost}`);
logger.info(`[redisClient] Connecting to Redis at: ${redisUrl}`);

// Utiliser l'URL construite pour la connexion
export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // Permet des tentatives de reconnexion infinies
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000); // Backoff exponentiel, max 2 secondes
    logger.warn(
      `[redisClient] Retrying Redis connection (attempt ${times}). Next retry in ${delay}ms.`,
    );
    return delay;
  },
});

redis.on('error', (err: Error) => {
  logger.error({ err }, 'Redis Client Error');
});
