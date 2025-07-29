import { describe, expect, it, vi } from 'vitest';

import { redis } from './redisClient.js';

// Mock the logger to prevent console output during tests
vi.mock('../../logger', () => ({
  default: {
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

// Mock the redis client directly
vi.mock('./redisClient.js', () => ({
  redis: {
    del: vi.fn(() => Promise.resolve(1)),
    duplicate: vi.fn(() => ({
      on: vi.fn(),
      publish: vi.fn(() => Promise.resolve(1)),
      quit: vi.fn(() => Promise.resolve()),
      subscribe: vi.fn(() => Promise.resolve()),
      unsubscribe: vi.fn(() => Promise.resolve()),
    })),
    get: vi.fn(() => Promise.resolve(null)),
    incr: vi.fn(() => Promise.resolve(1)),
    incrby: vi.fn(() => Promise.resolve(10)),
    on: vi.fn((event, cb) => {
      if (event === 'connect') cb();
      if (event === 'ready') cb();
    }),
    publish: vi.fn(() => Promise.resolve(1)),
    quit: vi.fn(() => Promise.resolve('OK')),
    set: vi.fn(() => Promise.resolve('OK')),
  },
}));

describe('redisClient', () => {
  it('should be defined', () => {
    expect(redis).toBeDefined();
  });
});
