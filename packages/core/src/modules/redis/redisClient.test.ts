import type { Mock } from 'vitest';

import { Redis } from 'ioredis';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../logger.js', () => ({
  default: {
    child: vi.fn().mockReturnThis(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock ioredis to prevent actual connection attempts
vi.mock('ioredis', () => ({
  Redis: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(),
    options: { keyPrefix: '' }, // Mimic the structure expected by BullMQ
  })),
}));

// No top-level import of redis from './redisClient.js' here
import logger from '../../logger.js';

describe('Redis Client', () => {
  const MockedRedis = Redis as unknown as Mock;
  let redis: unknown; // Declare redis here to be assigned in beforeEach

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules(); // Reset module cache to re-import redisClient.js

    // Re-mock ioredis before importing redisClient.js
    vi.mock('ioredis', () => ({
      Redis: vi.fn(() => ({
        connect: vi.fn(),
        disconnect: vi.fn(),
        on: vi.fn(),
        options: { keyPrefix: '' },
      })),
    }));

    // Dynamically import redisClient.js after mocks are set up
    const redisClientModule = await import('./redisClient.js');
    redis = redisClientModule.redis; // Assign the exported redis instance
  });

  it('should instantiate the Redis client', () => {
    expect(redis).toBeDefined();
    expect(MockedRedis).toHaveBeenCalledTimes(1);
  });

  it('should set up error logging', () => {
    const mockError = new Error('Redis connection error');
    const _redisInstance = MockedRedis.mock.results[0].value;
    const onErrorCallback = _redisInstance.on.mock.calls.find(
      (call: [string, (err: Error) => void]) => call[0] === 'error',
    )[1];
    onErrorCallback(mockError);
    expect(logger.error).toHaveBeenCalledWith(
      { err: mockError },
      'Redis Client Error',
    );
  });

  it('should use the correct retry strategy', () => {
    const _redisInstance = MockedRedis.mock.results[0].value;
    const retryStrategy = MockedRedis.mock.calls[0][1].retryStrategy;

    expect(retryStrategy(1)).toBe(50);
    expect(retryStrategy(10)).toBe(500);
    expect(retryStrategy(100)).toBe(2000);
  });
});
