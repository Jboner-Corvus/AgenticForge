import { Queue } from 'bullmq';
import { vi } from 'vitest';

export const createMockQueue = (): Partial<Queue> => ({
  // Core job management
  add: vi.fn().mockResolvedValue({ id: 'mock-job-id' }),
  addBulk: vi.fn().mockResolvedValue([]),
  
  // Cleanup and maintenance
  clean: vi.fn().mockResolvedValue([]),
  // Redis connection mock
  client: {
    disconnect: vi.fn(),
  } as any,
  // Lifecycle
  close: vi.fn().mockResolvedValue(undefined),
  
  emit: vi.fn(),
  getActiveCount: vi.fn().mockResolvedValue(0),
  getCompletedCount: vi.fn().mockResolvedValue(0),
  getFailedCount: vi.fn().mockResolvedValue(0),
  // Job retrieval
  getJob: vi.fn().mockResolvedValue(null),
  getJobs: vi.fn().mockResolvedValue([]),
  
  // Repeatable jobs
  getRepeatableJobs: vi.fn().mockResolvedValue([]),
  getWaitingCount: vi.fn().mockResolvedValue(0),
  
  isPaused: vi.fn().mockResolvedValue(false),
  jobsOpts: {},
  // Properties that might be accessed
  name: 'test-queue',
  obliterate: vi.fn().mockResolvedValue(undefined),
  
  off: vi.fn(),
  
  // Event handling
  on: vi.fn(),
  once: vi.fn(),
  
  opts: {
    connection: {} as any,
  },
  // Queue control
  pause: vi.fn().mockResolvedValue(undefined),
  removeRepeatable: vi.fn().mockResolvedValue(false),
  resume: vi.fn().mockResolvedValue(undefined),
  
  token: 'mock-token',
});

// Helper to get a properly typed mock Queue
export const getMockQueue = () => createMockQueue() as Queue;