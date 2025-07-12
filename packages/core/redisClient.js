import { Redis } from 'ioredis';

import logger from './logger.js';
const redisUrl = process.env.REDIS_URL ||
    `redis://${process.env.REDIS_PASSWORD ? ':' + process.env.REDIS_PASSWORD + '@' : ''}${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`;
logger.info(`[redisClient] Attempting Redis connection with URL: ${redisUrl}`);
export const redis = new Redis(redisUrl, { maxRetriesPerRequest: null });
redis.on('error', (err) => {
    logger.error({ err }, 'Redis Client Error');
});
//# sourceMappingURL=redisClient.js.map