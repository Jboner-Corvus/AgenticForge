import { describe, expect, it, vi } from 'vitest';

import { redisClient } from './redisClient.js';

// Mock the logger to prevent console output during tests
vi.mock('../../logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock the config to control REDIS_HOST and REDIS_PORT
vi.mock('../../config', () => ({
  config: {
    REDIS_DB: 0,
    REDIS_HOST: 'mock-redis-host',
    REDIS_PORT: 6379,
    REDIS_URL: undefined, // Ensure REDIS_URL is undefined for these tests
  },
}));

describe('redisClient', () => {
  it('should be defined', () => {
    expect(redisClient).toBeDefined();
  });
});
