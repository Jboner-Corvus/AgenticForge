import Redis from 'ioredis';

import { getConfig } from '../../config.js';

let redisInstance: null | Redis = null;

function getRedisClient(): Redis {
  if (!redisInstance) {
    const config = getConfig();
    const redisHost = config.REDIS_HOST;
    const redisUrl = `redis://${redisHost}:${config.REDIS_PORT}`;

    redisInstance = new Redis(redisUrl, {
      db: config.REDIS_DB,
      maxRetriesPerRequest: null,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redisInstance.on('error', (err: Error) => {
      console.error('Redis Client Error', err);
    });
  }
  return redisInstance;
}

export const redisClient = getRedisClient();
