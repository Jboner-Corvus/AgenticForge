/// <reference types="vitest/globals" />
import { Queue } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../../config.js', async () => {
  const actual = await vi.importActual('../../../../config.js');
  return {
    ...actual,
    config: {
      AGENT_MAX_ITERATIONS: 10,
      CODE_EXECUTION_TIMEOUT_MS: 60000,
      CONTAINER_MEMORY_LIMIT: '2g',
      HISTORY_LOAD_LENGTH: 50,
      HISTORY_MAX_LENGTH: 1000,
      HOST_PROJECT_PATH: '/usr/src/app',
      LLM_MODEL_NAME: 'gemini-pro',
      LLM_PROVIDER: 'gemini',
      LLM_PROVIDER_HIERARCHY: [
        'huggingface',
        'grok',
        'gemini',
        'openai',
        'mistral',
      ],
      LOG_LEVEL: 'info',
      MAX_FILE_SIZE_BYTES: 10485760,
      PORT: 3001,
      POSTGRES_DB: 'agenticforge',
      POSTGRES_HOST: 'postgres',
      POSTGRES_PORT: 5432,
      POSTGRES_USER: 'user',
      REDIS_DB: 0,
      REDIS_HOST: 'localhost',
      REDIS_PORT: 6379,
      SESSION_EXPIRATION: 604800,
      WORKER_CONCURRENCY: 5,
      WORKSPACE_PATH: '/workspace',
    },
  };
});

vi.mock('../../redis/redisClient.js', () => ({
  redisClient: {
    incrby: vi.fn(),
  },
}));

import { Ctx, ILlmProvider, SessionData, Tool } from '@/types';

import { getLoggerInstance } from '../../../../logger';

vi.mock('../../../../logger', () => ({
  getLoggerInstance: vi.fn(() => ({
    child: vi.fn().mockReturnThis(),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  })),
}));
import { getAllTools } from '../index';
import { listToolsTool } from './listTools.tool';

vi.mock('../../../tools/definitions/index.js', () => ({
  getAllTools: vi.fn(),
}));

describe('listToolsTool', () => {
  const mockCtx: Ctx = {
    llm: {} as ILlmProvider,
    log: getLoggerInstance(),
    reportProgress: vi.fn(),
    session: {} as SessionData,
    streamContent: vi.fn(),
    taskQueue: {} as Queue,
  };

  it('should list all available tool names', async () => {
    vi.mocked(getAllTools).mockResolvedValueOnce([
      { name: 'tool1' },
      { name: 'tool2' },
    ] as Tool[]);

    const result = await listToolsTool.execute({}, mockCtx);
    expect(result).toEqual({ tools: ['tool1', 'tool2'] });
  });

  it('should return an empty array if no tools are available', async () => {
    vi.mocked(getAllTools).mockResolvedValueOnce([]);

    const result = await listToolsTool.execute({}, mockCtx);
    expect(result).toEqual({ tools: [] });
  });

  it('should return an error if getAllTools fails', async () => {
    const errorMessage = 'Failed to get tools';
    vi.mocked(getAllTools).mockRejectedValueOnce(new Error(errorMessage));

    const result = await listToolsTool.execute({}, mockCtx);
    if (typeof result === 'object' && result && 'erreur' in result) {
      expect(result.erreur).toContain(errorMessage);
    } else {
      expect.fail('Expected an error object');
    }
    expect(getLoggerInstance().error).toHaveBeenCalled();
  });
});
