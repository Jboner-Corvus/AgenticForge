// FICHIER : src/queue.ts
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import config from './config.js';
import logger from './logger.js';

// CORRIGÉ : 'redisConnection' est maintenant exporté
export const redisConnection = new IORedis(config.REDIS_PORT, config.REDIS_HOST, {
  maxRetriesPerRequest: null,
});

// CORRIGÉ : 'taskQueue' est maintenant exporté
export const taskQueue = new Queue('tasks', { connection: redisConnection });
// CORRIGÉ : 'deadLetterQueue' est maintenant exporté
export const deadLetterQueue = new Queue('dead-letters', { connection: redisConnection });

taskQueue.on('error', (err) => {
  logger.error({ err }, 'Task queue error');
});