import { Job, Queue } from 'bullmq';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { Ctx, ILlmProvider, SessionData } from '@/types.js';

vi.mock('../../../../config', async () => {
  const actual = await vi.importActual('../../../../config');
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

vi.mock('../../../../logger.js', () => ({
  getLoggerInstance: vi.fn(() => ({
    child: vi.fn().mockReturnThis(),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  })),
}));

import { getLoggerInstance } from '../../../../logger.js';
import { finishTool, FinishToolSignal } from './finish.tool.js';

describe('finishTool', () => {
  let mockCtx: Ctx;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCtx = {
      job: { id: 'test-job-id' } as Job,
      llm: {} as ILlmProvider,
      log: getLoggerInstance(),
      reportProgress: vi.fn(),
      session: {} as SessionData,
      streamContent: vi.fn(),
      taskQueue: {} as Queue,
    };
    vi.spyOn(getLoggerInstance(), 'info');
    vi.spyOn(getLoggerInstance(), 'error');
  });

  it('should throw a FinishToolSignal with the final response when called with an object', async () => {
    const response = 'Goal achieved!';
    await expect(finishTool.execute({ response }, mockCtx)).rejects.toThrow(
      new FinishToolSignal(response),
    );
    expect(getLoggerInstance().info as Mock).toHaveBeenCalledWith(
      `Goal accomplished: ${response}`,
    );
  });

  it('should throw a FinishToolSignal with the final response when called with a string', async () => {
    const response = 'Direct goal achieved!';
    await expect(finishTool.execute(response, mockCtx)).rejects.toThrow(
      new FinishToolSignal(response),
    );
    expect(getLoggerInstance().info as Mock).toHaveBeenCalledWith(
      `Goal accomplished: ${response}`,
    );
  });

  it('should return an error message if args are invalid', async () => {
    // Using `any` here is intentional to test the runtime handling of invalid arguments,
    // which is not possible with strict static types.

    const invalidArgs = null as unknown as { response: string };
    await expect(finishTool.execute(invalidArgs, mockCtx)).rejects.toThrow(
      'Invalid arguments provided to finishTool. A final answer is required.',
    );

    // Verify that the error was logged
    expect(mockCtx.log.error as Mock).toHaveBeenCalled();
  });
});
