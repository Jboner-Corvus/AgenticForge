/**
 * src/queue.ts
 *
 * Configure et exporte les instances de file d'attente BullMQ.
 */
import { Queue, ConnectionOptions } from 'bullmq';
import { config } from './config.js';
import type { AsyncTaskPayload } from './types.js';

const TASK_QUEUE_NAME = 'agentic-tasks';
const DEAD_LETTER_QUEUE_NAME = 'agentic-dead-letter';

export const redisConnection: ConnectionOptions = {
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Permet à BullMQ de gérer les reconnexions
};

// File d'attente principale pour les tâches asynchrones
export const taskQueue = new Queue<AsyncTaskPayload>(TASK_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // Réessaie après 5s, 10s, 20s
    },
    removeOnComplete: {
      count: 1000, // Garde les 1000 derniers jobs terminés
      age: 24 * 3600, // Garde les jobs terminés pendant 24h
    },
    removeOnFail: {
      count: 5000, // Garde les 5000 derniers jobs échoués
      age: 7 * 24 * 3600, // Garde les jobs échoués pendant 7 jours
    },
  },
});

// File d'attente pour les jobs qui ont échoué définitivement
export const deadLetterQueue = new Queue<AsyncTaskPayload>(DEAD_LETTER_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 1, // Pas de nouvelle tentative
    removeOnComplete: true,
    removeOnFail: false, // Garder les échecs indéfiniment pour analyse
  },
});
