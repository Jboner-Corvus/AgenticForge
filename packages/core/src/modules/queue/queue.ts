import { Queue } from 'bullmq';

import { SessionData } from '@/types.js';

import { getLoggerInstance } from '../../logger.js';
import { redisClient } from '../redis/redisClient.js';

export interface AsyncTaskJobPayload<TParams> {
  auth: SessionData | undefined;
  cbUrl?: string;
  params: TParams;
  taskId: string;
  toolName: string;
}

export const jobQueue = new Queue('tasks', { connection: redisClient });

export const deadLetterQueue = new Queue('dead-letters', {
  connection: redisClient,
});

jobQueue.on('error', (err: Error) => {
  getLoggerInstance().error({ err }, 'Job queue error');
});

deadLetterQueue.on('error', (err: Error) => {
  getLoggerInstance().error({ err }, 'Dead-letter queue error');
});
