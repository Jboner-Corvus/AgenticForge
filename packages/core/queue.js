// FICHIER : src/queue.ts
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

import { config } from './config.js';
import logger from './logger.js';
// CORRIGÉ : 'redisConnection' est maintenant exporté
export const redisConnection = new Redis(config.REDIS_PORT, config.REDIS_HOST, {
    maxRetriesPerRequest: null,
});
export const jobQueue = new Queue('tasks', { connection: redisConnection });
// CORRIGÉ : 'deadLetterQueue' est maintenant exporté
export const deadLetterQueue = new Queue('dead-letters', {
    connection: redisConnection,
});
jobQueue.on('error', (err) => {
    logger.error({ err }, 'Job queue error');
});
//# sourceMappingURL=queue.js.map