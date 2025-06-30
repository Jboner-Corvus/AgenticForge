// FICHIER : src/queue.ts
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { config } from './config.js';
import logger from './logger.js';

// CORRIGÉ : 'redisConnection' est maintenant exporté
export const redisConnection = new IORedis(config.REDIS_PORT, config.REDIS_HOST, {
  maxRetriesPerRequest: null,
});

// CORRIGÉ : 'taskQueue' est maintenant exporté
export interface AsyncTaskJobPayload<TParams> {
  params: TParams;
  auth: any; // Simplified for now, will refine with SessionData
  taskId: string;
  toolName: string;
  cbUrl?: string;
}

export const jobQueue = new Queue('tasks', { connection: redisConnection });
// CORRIGÉ : 'deadLetterQueue' est maintenant exporté
export const deadLetterQueue = new Queue('dead-letters', { connection: redisConnection });

jobQueue.on('error', (err: Error) => {
  logger.error({ err }, 'Job queue error');
});