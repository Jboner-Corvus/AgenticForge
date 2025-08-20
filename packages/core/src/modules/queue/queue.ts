import { Queue } from 'bullmq';

import { getLoggerInstance } from '../../logger.ts';
import { SessionData } from '../../types.ts';
import { getRedisClientInstance } from '../redis/redisClient.ts';

export interface AsyncTaskJobPayload<TParams> {
  auth: SessionData | undefined;
  cbUrl?: string;
  params: TParams;
  taskId: string;
  toolName: string;
}

let jobQueueInstance: null | Queue = null;
let deadLetterQueueInstance: null | Queue = null;

export function getDeadLetterQueue(): Queue {
  if (!deadLetterQueueInstance) {
    const redisClient = getRedisClientInstance();
    deadLetterQueueInstance = new Queue('dead-letters', {
      connection: redisClient,
    });
    deadLetterQueueInstance.on('error', (err: Error) => {
      getLoggerInstance().error({ err }, 'Dead-letter queue error');
    });
  }
  return deadLetterQueueInstance;
}

export function getJobQueue(): Queue {
  if (!jobQueueInstance) {
    const redisClient = getRedisClientInstance();
    jobQueueInstance = new Queue('tasks', { connection: redisClient });
    jobQueueInstance.on('error', (err: Error) => {
      getLoggerInstance().error({ err }, 'Job queue error');
    });
  }
  return jobQueueInstance;
}
