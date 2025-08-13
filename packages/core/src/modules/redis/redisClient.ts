import IORedis, { RedisOptions } from 'ioredis';
import { getLogger } from '../../logger';

const logger = getLogger();
let redisClient: IORedis | null = null;

const redisOptions: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
  maxRetriesPerRequest: null,
};

export const getRedisClientInstance = (): IORedis => {
  if (!redisClient) {
    if (process.env.NODE_ENV === 'test') {
      throw new Error(
        'Redis client not initialized for test environment. Use setRedisClientInstance.',
      );
    }
    try {
      redisClient = new IORedis(redisOptions);

      redisClient.on('connect', () => {
        logger.info('Successfully connected to Redis.');
      });

      redisClient.on('error', (err) => {
        logger.error({ err }, 'Redis connection error:');
      });
    } catch (error) {
      logger.error({ error }, 'Failed to create Redis client');
      throw error;
    }
  }
  return redisClient;
};

export const setRedisClientInstance = (client: IORedis | null): void => {
  redisClient = client;
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis client disconnected.');
  }
};
