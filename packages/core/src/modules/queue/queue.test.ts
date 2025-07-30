import { Queue } from 'bullmq';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getLoggerInstance } from '../../logger.js';
import { deadLetterQueue, jobQueue } from './queue.js';

// Mock redis and logger
vi.mock('../redis/redisClient.js', () => ({
  redisClient: {
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
  },
}));

vi.mock('../../logger.js', () => ({
  getLoggerInstance: vi.fn(() => ({
    child: vi.fn().mockReturnThis(),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  })),
}));

describe('Queue Initialization and Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(getLoggerInstance(), 'error');
  });

  it('should instantiate jobQueue correctly', () => {
    expect(jobQueue).toBeInstanceOf(Queue);
  });

  it('should instantiate deadLetterQueue correctly', () => {
    expect(deadLetterQueue).toBeInstanceOf(Queue);
  });

  it('should log an error when jobQueue emits an error', () => {
    const testError = new Error('Job queue test error');
    jobQueue.emit('error', testError);
    expect(getLoggerInstance().error).toHaveBeenCalledWith(
      { err: testError },
      'Job queue error',
    );
  });

  it('should log an error when deadLetterQueue emits an error', () => {
    const testError = new Error('Dead-letter queue test error');
    deadLetterQueue.emit('error', testError);
    expect(getLoggerInstance().error).toHaveBeenCalledWith(
      { err: testError },
      'Dead-letter queue error',
    );
  });
});
