import { vi } from 'vitest';
import { RedisKey } from 'ioredis';

const store: Record<string, string> = {}; // In-memory store for mock

export const mockRedis = {
  on: vi.fn(),
  duplicate: vi.fn(() => ({
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    quit: vi.fn(),
    on: vi.fn(),
  })),
  get: vi.fn((key: RedisKey) => Promise.resolve(store[key as string] || null)),
  set: vi.fn((key: RedisKey, value: string) => {
    store[key as string] = value;
    return Promise.resolve('OK');
  }),
  del: vi.fn((key: RedisKey) => {
    delete store[key as string];
    return Promise.resolve(1);
  }),
  incr: vi.fn((key: RedisKey) => {
    const currentValue = parseInt(store[key as string] || '0', 10);
    store[key as string] = String(currentValue + 1);
    return Promise.resolve(parseInt(store[key as string], 10));
  }),
  incrby: vi.fn((key: RedisKey, increment: number | string) => {
    const currentValue = parseInt(store[key as string] || '0', 10);
    store[key as string] = String(currentValue + Number(increment));
    return Promise.resolve(parseInt(store[key as string], 10));
  }),
  publish: vi.fn(),
  options: {
    host: 'mock_host',
    port: 1234,
  },
  quit: vi.fn(),
  _getStore: () => store,
  _resetStore: () => {
    for (const key in store) {
      delete store[key];
    }
  },
};

vi.mock('../../src/modules/redis/redisClient.js', () => ({
  redisClient: mockRedis,
}));
