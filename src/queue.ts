/**
 * src/queue.ts
 *
 * Configure et exporte les instances de file d'attente BullMQ.
 */
import { Queue, ConnectionOptions } from 'bullmq';
import { config } from './config.js';
import type { AsyncTaskJobPayload } from './types.js'; // Le type est importé ici

const TASK_QUEUE_NAME = 'agentic-tasks';
const DEAD_LETTER_QUEUE_NAME = 'agentic-dead-letter';

export const redisConnection: ConnectionOptions = {
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};

// File d'attente principale pour les tâches asynchrones
export const taskQueue = new Queue<AsyncTaskJobPayload>(TASK_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      count: 1000,
      age: 24 * 3600,
    },
    removeOnFail: {
      count: 5000,
      age: 7 * 24 * 3600,
    },
  },
});

// File d'attente pour les jobs qui ont échoué définitivement
export const deadLetterQueue = new Queue<AsyncTaskJobPayload>(
  DEAD_LETTER_QUEUE_NAME,
  {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 1,
      removeOnComplete: true,
      removeOnFail: false,
    },
  },
);

// Correction: Exportation du type pour qu'il soit accessible par d'autres modules.
export type { AsyncTaskJobPayload };
