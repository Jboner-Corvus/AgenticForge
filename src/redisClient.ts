import Redis from 'ioredis';
import logger from './logger.js';

const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_PASSWORD ? ':' + process.env.REDIS_PASSWORD + '@' : ''}${process.env.REDIS_HOST || 'redis'}:${process.env.REDIS_PORT || '6378'}`;

logger.info(`[redisClient] Attempting Redis connection with URL: ${redisUrl}`);

export const redis = new Redis(redisUrl);

redis.on('error', (err) => {
  logger.error({ err }, 'Redis Client Error');
});