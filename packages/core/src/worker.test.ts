/// <reference types="vitest/globals" />

import type { Job, Queue } from 'bullmq';

vi.mock('./modules/redis/redisClient', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('./modules/redis/redisClient')>();
  const mockRedisClient = {
    ...actual.redis,
    del: vi.fn(),
    duplicate: vi.fn(() => mockRedisClient),
    get: vi.fn(),
    incr: vi.fn(),
    lrange: vi.fn().mockResolvedValue([]),
    on: vi.fn(),
    options: { host: 'localhost', port: 6379 },
    publish: vi.fn(),
    quit: vi.fn(),
    rpush: vi.fn(),
    set: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  } as any;
  return {
    redis: mockRedisClient,
  };
});

import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

vi.mock('pg', () => ({
  Client: vi.fn(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    end: vi.fn().mockResolvedValue(undefined),
    query: vi.fn().mockResolvedValue({ rows: [] }),
  })),
}));

vi.mock('./config', () => ({
  config: {
    HISTORY_MAX_LENGTH: 10,
    REDIS_HOST: 'localhost',
    REDIS_PORT: 6379,
  },
}));

import { config } from './config';
import { getLogger } from './logger';
import { Agent } from './modules/agent/agent';
import * as _redis from './modules/redis/redisClient';
import { SessionManager as _SessionManager } from './modules/session/sessionManager';
import { summarizeTool } from './modules/tools/definitions/ai/summarize.tool';
import { AppError as _AppError } from './utils/errorUtils';
import { processJob } from './worker';

// Mock external dependencies
vi.mock('./modules/agent/agent');
const _mockSessionManagerInstance = {
  getSession: vi.fn(),
  saveSession: vi.fn(),
};
vi.mock('./modules/session/sessionManager', () => ({
  SessionManager: vi.fn(() => _mockSessionManagerInstance),
}));

vi.mock('./logger', () => {
  const mockChildLogger = {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  };
  const mockLogger = {
    child: vi.fn(() => mockChildLogger),
    error: vi.fn(),
    info: vi.fn(),
  };
  return {
    __esModule: true,
    getLogger: vi.fn(() => mockLogger),
  };
});
vi.mock('./modules/tools/definitions/ai/summarize.tool', () => ({
  summarizeTool: {
    execute: vi.fn(),
  },
}));

describe('processJob', () => {
  let mockJob: Partial<Job>;
  let mockTools: any[];
  let mockSessionData: any;
  let mockJobQueue: Queue;
  let mockRedisConnection: any;

  beforeEach(() => {
    mockJob = {
      data: { sessionId: 'testSessionId' },
      id: 'testJobId',
      name: 'testJob',
    };
    mockTools = [];
    mockSessionData = {
      history: [],
    };
    mockJobQueue = {
      add: vi.fn(),
    } as any;
    mockRedisConnection = _redis.redis;

    // Mock config.HISTORY_MAX_LENGTH for testing purposes
    config.HISTORY_MAX_LENGTH = 10;

    // Reset mocks
    vi.clearAllMocks();
    _mockSessionManagerInstance.getSession.mockResolvedValue(mockSessionData);
    (Agent as Mock).mockImplementation(() => ({
      run: vi.fn().mockResolvedValue('Agent final response'),
    }));
    (summarizeTool.execute as any).mockResolvedValue('Summarized conversation');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should process a job successfully and return the final response', async () => {
    mockSessionData.history = Array(10).fill({
      content: 'old message',
      role: 'user',
    }); // Ensure history exceeds max length after adding one more message
    const result = await processJob(
      mockJob as Job,
      mockTools,
      mockJobQueue,
      _mockSessionManagerInstance as any,
      mockRedisConnection,
    );

    expect(_mockSessionManagerInstance.getSession).toHaveBeenCalledWith(
      'testSessionId',
    );
    expect(Agent).toHaveBeenCalledWith(
      mockJob,
      mockSessionData,
      mockJobQueue,
      mockTools,
      'gemini',
      _mockSessionManagerInstance,
    );
    expect((Agent as any).mock.results[0].value.run).toHaveBeenCalled();
    expect(mockSessionData.history).toContainEqual({
      content: 'Summarized conversation',
      id: expect.any(String),
      timestamp: expect.any(Number),
      type: 'agent_response',
    });
    expect(summarizeTool.execute).toHaveBeenCalled();
    expect(_mockSessionManagerInstance.saveSession).toHaveBeenCalledWith(
      mockSessionData,
      mockJob,
      mockJobQueue,
    );
    expect(mockRedisConnection.publish).toHaveBeenCalledWith(
      'job:testJobId:events',
      JSON.stringify({ content: 'Stream terminé.', type: 'close' }),
    );
    expect(result).toBe('Agent final response');
  });

  it('should handle AppError and publish an error event', async () => {
    const errorMessage = 'This is an application error';
    (Agent as any).mockImplementation(() => ({
      run: vi.fn().mockRejectedValue(new _AppError(errorMessage)),
    }));

    await expect(
      processJob(
        mockJob as Job,
        mockTools,
        mockJobQueue,
        _mockSessionManagerInstance as any,
        mockRedisConnection,
      ),
    ).rejects.toThrow(_AppError);

    expect(getLogger().child).toHaveBeenCalledWith({
      jobId: 'testJobId',
      sessionId: 'testSessionId',
    });
    expect(getLogger().child({}).error).toHaveBeenCalledWith(
      expect.any(Object),
      `Erreur dans l'exécution de l'agent`,
    );
    expect(mockRedisConnection.publish).toHaveBeenCalledWith(
      'job:testJobId:events',
      JSON.stringify({ message: errorMessage, type: 'error' }),
    );
    expect(mockRedisConnection.publish).toHaveBeenCalledWith(
      'job:testJobId:events',
      JSON.stringify({ content: 'Stream terminé.', type: 'close' }),
    );
  });
});
