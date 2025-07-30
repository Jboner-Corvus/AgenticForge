import { Queue } from 'bullmq';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock redis
vi.mock('../redis/redisClient.js', () => ({
  getRedisClientInstance: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    duplicate: vi.fn(),
    getMaxListeners: vi.fn(() => 10),
    on: vi.fn(),
    once: vi.fn(),
    options: { keyPrefix: '' },
    publish: vi.fn(),
    removeListener: vi.fn(),
    setMaxListeners: vi.fn(),
  })),
}));

// Define the mock for getLoggerInstance before importing queue.js
const mockLoggerInstance = {
  child: vi.fn().mockReturnThis(),
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
};

vi.doMock('../../logger.js', () => ({
  getLoggerInstance: vi.fn(() => mockLoggerInstance),
}));

// Now import the module under test
 
import { getDeadLetterQueue, getJobQueue } from './queue.js';

describe('Queue Initialization and Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should instantiate jobQueue correctly', () => {
    expect(getJobQueue()).toBeInstanceOf(Queue);
  });

  it('should instantiate deadLetterQueue correctly', () => {
    expect(getDeadLetterQueue()).toBeInstanceOf(Queue);
  });

  it('should log an error when jobQueue emits an error', () => {
    const testError = new Error('Job queue test error');
    getJobQueue().emit('error', testError);
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(
      { err: testError },
      'Job queue error',
    );
  });

  it('should log an error when deadLetterQueue emits an error', () => {
    const testError = new Error('Dead-letter queue test error');
    getDeadLetterQueue().emit('error', testError);
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(
      { err: testError },
      'Dead-letter queue error',
    );
  });
});
