/// <reference types="vitest/globals" />
import { Job, Queue } from 'bullmq';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import logger from './logger';
import { Agent } from './modules/agent/agent';

vi.mock('./modules/redis/redisClient', () => {
  const mockRedisClient = {
    del: vi.fn(),
    duplicate: vi.fn(() => ({
      subscribe: vi.fn(),
    })),
    get: vi.fn(),
    on: vi.fn(),
    options: { host: 'localhost', port: 6379 },
    publish: vi.fn(),
    set: vi.fn(),
    subscribe: vi.fn(),
  };
  return { redis: mockRedisClient };
});

import { redis } from './modules/redis/redisClient';
import { SessionManager } from './modules/session/sessionManager';
import { summarizeTool } from './modules/tools/definitions/ai/summarize.tool';
import { AppError, UserError } from './utils/errorUtils';
import { processJob } from './worker';

// Mock external dependencies
vi.mock('./modules/agent/agent');
vi.mock('./modules/session/sessionManager');


vi.mock('./logger', () => {
  const mockChildLogger = {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  };
  return {
    __esModule: true,
    default: {
      child: vi.fn(() => mockChildLogger),
      error: vi.fn(),
      info: vi.fn(),
    },
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
    mockJobQueue = new Queue('tasks', { connection: redis });

    // Reset mocks
    vi.clearAllMocks();
    (SessionManager.getSession as any).mockResolvedValue(mockSessionData);
    (Agent as Mock).mockImplementation(() => ({
      run: vi.fn().mockResolvedValue('Agent final response'),
    }));
    (summarizeTool.execute as any).mockResolvedValue('Summarized conversation');
  });

  it('should process a job successfully and return the final response', async () => {
    const _result = await processJob(mockJob as Job, mockTools);

    expect(SessionManager.getSession).toHaveBeenCalledWith('testSessionId');
    expect(Agent).toHaveBeenCalledWith(mockJob, mockSessionData, expect.any(Queue), mockTools);
    expect((Agent as any).mock.results[0].value.run).toHaveBeenCalled();
    expect(mockSessionData.history).toContainEqual({ content: 'Agent final response', role: 'model' });
    expect(summarizeTool.execute).toHaveBeenCalled();
    expect(SessionManager.saveSession).toHaveBeenCalledWith(mockSessionData, mockJob, mockJobQueue);
    expect(redis.publish).toHaveBeenCalledWith('job:testJobId:events' as any, JSON.stringify({ content: 'Stream ended.', type: 'close' }) as any);
    expect(_result).toBe('Agent final response');
  });

  it('should handle AppError and publish an error event', async () => {
    const errorMessage = 'This is an application error';
    (Agent as any).mockImplementation(() => ({
      run: vi.fn().mockRejectedValue(new AppError(errorMessage)),
    }));

    await expect(processJob(mockJob as Job, mockTools)).rejects.toThrow(AppError);

    expect(logger.child).toHaveBeenCalledWith({ jobId: 'testJobId', sessionId: 'testSessionId' });
    expect(logger.child({}).error).toHaveBeenCalledWith(expect.any(Object), 'Error in agent execution');
    expect(redis.publish).toHaveBeenCalledWith('job:testJobId:events', JSON.stringify({ message: errorMessage, type: 'error' }) as string);
    expect(redis.publish).toHaveBeenCalledWith('job:testJobId:events', JSON.stringify({ content: 'Stream ended.', type: 'close' }) as string);
  });

  it('should handle UserError and publish an error event', async () => {
    const errorMessage = 'This is a user error';
    (Agent as any).mockImplementation(() => ({
      run: vi.fn().mockRejectedValue(new UserError(errorMessage)),
    }));

    await expect(processJob(mockJob as Job, mockTools)).rejects.toThrow(UserError);

    expect(logger.child).toHaveBeenCalledWith({ jobId: 'testJobId', sessionId: 'testSessionId' });
    expect(logger.child({}).error).toHaveBeenCalledWith(expect.any(Object), 'Error in agent execution');
    expect(redis.publish).toHaveBeenCalledWith('job:testJobId:events', JSON.stringify({ message: errorMessage, type: 'error' }) as string);
    expect(redis.publish).toHaveBeenCalledWith('job:testJobId:events', JSON.stringify({ content: 'Stream ended.', type: 'close' }) as string);
  });

  it('should handle generic Error and publish an error event', async () => {
    const errorMessage = 'Something went wrong';
    (Agent as any).mockImplementation(() => ({
      run: vi.fn().mockRejectedValue(new Error(errorMessage)),
    }));

    await expect(processJob(mockJob as Job, mockTools)).rejects.toThrow(Error);

    expect(logger.child).toHaveBeenCalledWith({ jobId: 'testJobId', sessionId: 'testSessionId' });
    expect(logger.child({}).error).toHaveBeenCalledWith(expect.any(Object), 'Error in agent execution');
    expect(redis.publish).toHaveBeenCalledWith('job:testJobId:events', JSON.stringify({ message: errorMessage, type: 'error' }) as string);
    expect(redis.publish).toHaveBeenCalledWith('job:testJobId:events', JSON.stringify({ content: 'Stream ended.', type: 'close' }) as string);
  });

  it('should handle "Quota exceeded" error specifically', async () => {
    const errorMessage = 'Quota exceeded';
    (Agent as any).mockImplementation(() => ({
      run: vi.fn().mockRejectedValue(new Error(errorMessage)),
    }));

    await expect(processJob(mockJob as Job, mockTools)).rejects.toThrow(Error);

    expect(redis.publish).toHaveBeenCalledWith('job:testJobId:events', JSON.stringify({ message: 'API quota exceeded. Please try again later.', type: 'quota_exceeded' }) as string);
  });

  it('should handle "Gemini API request failed with status 500" error specifically', async () => {
    const errorMessage = 'Gemini API request failed with status 500';
    (Agent as any).mockImplementation(() => ({
      run: vi.fn().mockRejectedValue(new Error(errorMessage)),
    }));

    await expect(processJob(mockJob as Job, mockTools)).rejects.toThrow(Error);

    expect(redis.publish).toHaveBeenCalledWith('job:testJobId:events', JSON.stringify({ message: 'An internal error occurred with the LLM API. Please try again later or check your API key.', type: 'error' }) as string);
  });

  it('should handle "is not found for API version v1" error specifically', async () => {
    const errorMessage = 'is not found for API version v1';
    (Agent as any).mockImplementation(() => ({
      run: vi.fn().mockRejectedValue(new Error(errorMessage)),
    }));

    await expect(processJob(mockJob as Job, mockTools)).rejects.toThrow(Error);

    expect(redis.publish).toHaveBeenCalledWith('job:testJobId:events', JSON.stringify({ message: 'The specified LLM model was not found or is not supported. Please check your LLM_MODEL_NAME in .env.', type: 'error' }) as string);
  });

  it('should handle unknown errors and publish a generic error event', async () => {
    (Agent as any).mockImplementation(() => ({
      run: vi.fn().mockRejectedValue('Unknown error type'),
    }));

    await expect(processJob(mockJob as Job, mockTools)).rejects.toThrow('Unknown error type');

    expect(redis.publish).toHaveBeenCalledWith('job:testJobId:events', JSON.stringify({ message: 'An unknown error occurred during agent execution.', type: 'error' }) as string);
  });

  it('should always publish a "close" event in the finally block', async () => {
    (Agent as any).mockImplementation(() => ({
      run: vi.fn().mockResolvedValue('Agent final response'),
    }));

    await processJob(mockJob as Job, mockTools);

    expect(redis.publish).toHaveBeenCalledWith('job:testJobId:events', JSON.stringify({ content: 'Stream ended.', type: 'close' }) as string);
  });

  it('should call summarizeHistory if history length exceeds max length', async () => {
    mockSessionData.history = Array(11).fill({ content: 'old message', role: 'user' }); // Exceeds default 10
    const _result = await processJob(mockJob as Job, mockTools);
    expect(summarizeTool.execute).toHaveBeenCalled();
  });

  it('should not call summarizeHistory if history length does not exceed max length', async () => {
    mockSessionData.history = Array(5).fill({ content: 'old message', role: 'user' }); // Does not exceed default 10
    const _result = await processJob(mockJob as Job, mockTools);
    expect(summarizeTool.execute).not.toHaveBeenCalled();
  });
});
