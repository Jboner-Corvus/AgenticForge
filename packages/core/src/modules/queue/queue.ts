// FICHIER : src/queue.ts
import { Queue } from 'bullmq';

import { SessionData } from '@/types.js';

import { getLogger } from '../../logger.js';
import { redis } from '../redis/redisClient.js';
// CORRIGÉ : 'taskQueue' est maintenant exporté
export interface AsyncTaskJobPayload<TParams> {
  auth: SessionData | undefined;
  cbUrl?: string;
  params: TParams;
  taskId: string;
  toolName: string;
}
export const jobQueue = new Queue('tasks', { connection: redis });
// CORRIGÉ : 'deadLetterQueue' est maintenant exporté
export const deadLetterQueue = new Queue('dead-letters', {
  connection: redis,
});

jobQueue.on('error', (err: Error) => {
  getLogger().error({ err }, 'Job queue error');
});

deadLetterQueue.on('error', (err: Error) => {
  getLogger().error({ err }, 'Dead-letter queue error');
});
