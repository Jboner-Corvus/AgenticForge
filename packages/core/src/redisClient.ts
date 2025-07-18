import { Redis } from 'ioredis';

import { config } from './config.js';
import logger from './logger.js';

// Détermine l'hôte Redis en fonction de l'environnement d'exécution.
// Si le worker est local (pas dans Docker), il doit utiliser 'localhost'.
// Si le worker est dans Docker, il doit utiliser le nom de service 'redis'.
const redisHost = process.env.DOCKER === 'true' ? config.REDIS_HOST : 'localhost';

console.log('--- In redisClient.ts ---');
console.log('process.env.DOCKER:', process.env.DOCKER);
console.log('process.env.REDIS_HOST:', process.env.REDIS_HOST);
console.log('config.REDIS_HOST:', config.REDIS_HOST);
console.log('Chosen redisHost:', redisHost);
console.log('config.REDIS_PORT:', config.REDIS_PORT);

const redisUrl = `redis://${redisHost}:${config.REDIS_PORT}`;

console.log('Constructed Redis URL:', redisUrl);
logger.info(`[redisClient] Constructed Redis URL: ${redisUrl}`);

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
