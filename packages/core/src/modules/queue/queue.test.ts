import { Queue } from 'bullmq';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
  default: {
    child: vi.fn().mockReturnThis(),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
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
});
