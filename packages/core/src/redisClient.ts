import { Redis } from 'ioredis';

import logger from './logger.js';

const redisUrl =
  process.env.REDIS_URL ||
  `redis://${process.env.REDIS_PASSWORD ? ':' + process.env.REDIS_PASSWORD + '@' : ''}${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || '6379'}`;

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
