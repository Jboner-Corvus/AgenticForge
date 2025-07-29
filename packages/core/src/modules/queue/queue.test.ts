import { Queue } from 'bullmq';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getLogger } from '../../logger.js';
import { deadLetterQueue, jobQueue } from './queue.js';

// Mock redis and logger
vi.mock('../redis/redisClient.js', () => ({
  redis: {
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
  getLogger: vi.fn(() => ({
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
  });

  it('should instantiate jobQueue correctly', () => {
    expect(jobQueue).toBeInstanceOf(Queue);
    // Check if the connection property is set, though direct comparison to mocked redis might be tricky
    // A more robust check would involve inspecting the internal connection details if exposed by BullMQ
    // For now, we assume if it's a Queue instance, the connection was passed.
  });

  it('should instantiate deadLetterQueue correctly', () => {
    expect(deadLetterQueue).toBeInstanceOf(Queue);
  });

  it('should log an error when jobQueue emits an error', () => {
    const testError = new Error('Job queue test error');
    jobQueue.emit('error', testError);
    expect(getLogger().error).toHaveBeenCalledWith(
      { err: testError },
      'Job queue error',
    );
  });

  it('should log an error when deadLetterQueue emits an error', () => {
    const testError = new Error('Dead-letter queue test error');
    deadLetterQueue.emit('error', testError);
    expect(getLogger().error).toHaveBeenCalledWith(
      { err: testError },
      'Dead-letter queue error',
    );
  });
});
