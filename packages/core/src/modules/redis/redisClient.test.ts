import { describe, expect, it, vi } from 'vitest';

// Mock the ioredis module to prevent actual Redis connections
vi.mock('ioredis', () => {
  class MockRedis {
    on = vi.fn();
    // Add other methods that might be called on the Redis instance if needed
  }
  return {
    default: MockRedis,
  };
});

import { getRedisClientInstance } from './redisClient.js';

// Mock the logger to prevent console output during tests
vi.mock('../../logger', () => ({
  getLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}));

// No need to mock config for REDIS_HOST/PORT anymore as ioredis is mocked

describe('redisClient', () => {
  it('should be defined', () => {
    expect(getRedisClientInstance()).toBeDefined();
  });
});
