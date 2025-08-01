import { Queue } from 'bullmq';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Define the mock for getLoggerInstance before importing queue.js
const mockLoggerInstance = {
  child: vi.fn().mockReturnThis(),
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
};

let getDeadLetterQueue: typeof import('./queue.js').getDeadLetterQueue;
let getJobQueue: typeof import('./queue.js').getJobQueue;

describe('Queue Initialization and Error Handling', () => {
  let jobQueue: Queue;
  let deadLetterQueue: Queue;

  beforeEach(async () => {
    vi.resetModules(); // Reset module cache

    // Re-mock redis client
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

    // Re-mock logger
    vi.mock('../../logger.js', () => ({
      getLoggerInstance: vi.fn(() => mockLoggerInstance),
    }));

    // Now import the module under test after resetting modules and re-mocking
    const queueModule = await import('./queue.js');
    getJobQueue = queueModule.getJobQueue;
    getDeadLetterQueue = queueModule.getDeadLetterQueue;

    vi.clearAllMocks(); // Clear mocks on the mockLoggerInstance

    jobQueue = getJobQueue();
    deadLetterQueue = getDeadLetterQueue();
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
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(
      { err: testError },
      'Job queue error',
    );
  });

  it('should log an error when deadLetterQueue emits an error', () => {
    const testError = new Error('Dead-letter queue test error');
    deadLetterQueue.emit('error', testError);
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(
      { err: testError },
      'Dead-letter queue error',
    );
  });
});
