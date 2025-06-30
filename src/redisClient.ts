// FICHIER : src/redisClient.ts
import Redis from 'ioredis';
// CORRIGÉ : Utilisation de l'import par défaut de la configuration.
import config from './config.js';
import logger from './logger.js';

const connectionOptions = {
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  maxRetriesPerRequest: null,
};

export const redis = new Redis(connectionOptions);
// ...