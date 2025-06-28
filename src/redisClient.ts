// NOUVEAU FICHIER : src/redisClient.ts
import Redis from 'ioredis';
import { REDIS_HOST, REDIS_PORT } from './config';
import logger from './logger';

const connectionOptions = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null,
};

export const redis = new Redis(connectionOptions);

redis.on('connect', () => {
  logger.info('Connexion à Redis réussie.');
});

redis.on('error', (err) => {
  logger.error({ err }, 'Impossible de se connecter à Redis.');
});