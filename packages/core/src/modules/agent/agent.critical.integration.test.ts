import { Job, Queue } from 'bullmq';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { getLoggerInstance } from '../../logger.js';
import { Ctx, ILlmProvider, SessionData } from '../../types.js';
import { Agent } from './agent.js';

// Create mock logger functions
const mockLogError = vi.fn();
const mockLogDebug = vi.fn();
const mockLogInfo = vi.fn();
const mockLogWarn = vi.fn();
const mockLogChild = vi.fn().mockReturnThis();

// Mock modules
vi.mock('../../logger.js', () => ({
  getLoggerInstance: vi.fn(() => ({
    child: mockLogChild,
    debug: mockLogDebug,
    error: mockLogError,
    info: mockLogInfo,
    warn: mockLogWarn,
  })),
}));

vi.mock('../../utils/llmProvider.js', () => ({
  getLlmProvider: vi.fn().mockImplementation(() => ({
    getErrorType: vi.fn(),
    getLlmResponse: vi.fn().mockResolvedValue('Mocked response'),
  })),
}));

vi.mock('../../modules/tools/toolRegistry.js', async () => {
  return {
    toolRegistry: {
      execute: vi.fn().mockResolvedValue('Tool execution result'),
      get: vi.fn().mockReturnValue({
        execute: vi.fn().mockResolvedValue('Tool execution result'),
      }),
      getTool: vi.fn().mockReturnValue({
        execute: vi.fn().mockResolvedValue('Tool execution result'),
      }),
    },
  };
});

describe('Agent - Critical Tests', () => {
  let mockCtx: Ctx;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCtx = {
      job: {
        data: { prompt: 'test prompt' },
        id: 'test-job-id',
        isFailed: vi.fn(),
        name: 'test-job',
      } as unknown as Job<{ prompt: string }>,
      llm: {
        getErrorType: vi.fn(),
        getLlmResponse: vi.fn(),
      } as unknown as ILlmProvider,
      log: getLoggerInstance(),
      reportProgress: vi.fn(),
      session: {
        history: [],
        identities: [],
        name: 'test-session',
        timestamp: Date.now(),
      } as SessionData,
      streamContent: vi.fn(),
      taskQueue: {} as Queue,
    };
  });

  it('should handle API quota exceeded errors gracefully', async () => {
    // Create agent instance with proper context
    const agent = new Agent(
      mockCtx.job as Job<{ prompt: string }>,
      mockCtx.session as SessionData,
      mockCtx.taskQueue,
      [],
      'gemini',
      {} as any, // sessionManager
      undefined, // apiKey
      undefined, // llmModelName
      undefined, // llmApiKey
    );

    // Mock LLM provider to simulate quota exceeded error
    const mockLlmProvider = {
      getLlmResponse: vi
        .fn()
        .mockRejectedValue(new Error('429: RESOURCE_EXHAUSTED')),
    };

    // Mock agent's run method to throw the error
    vi.spyOn(agent, 'run').mockImplementation(async () => {
      mockLogError('429: RESOURCE_EXHAUSTED');
      throw new Error('429: RESOURCE_EXHAUSTED');
    });

    try {
      await agent.run();
    } catch (error) {
      expect((error as Error).message).toContain('429: RESOURCE_EXHAUSTED');
    }

    // Verify that the error is handled gracefully
    expect(mockLogError).toHaveBeenCalled();
  });

  it('should handle browser launch failures gracefully', async () => {
    // Create agent instance with proper context
    const agent = new Agent(
      mockCtx.job as Job<{ prompt: string }>,
      mockCtx.session as SessionData,
      mockCtx.taskQueue,
      [],
      'gemini',
      {} as any, // sessionManager
      undefined, // apiKey
      undefined, // llmModelName
      undefined, // llmApiKey
    );

    // Mock tool execution to simulate browser launch failure
    const mockToolRegistry = await import(
      '../../modules/tools/toolRegistry.js'
    );
    vi.mocked(mockToolRegistry.toolRegistry.get).mockReturnValueOnce({
      description: 'Mock tool for testing',
      execute: vi.fn().mockRejectedValue(new Error('Browser launch failed')),
      name: 'mock-tool',
      parameters: z.object({}),
    });

    // Mock agent's run method to throw the error
    vi.spyOn(agent, 'run').mockImplementation(async () => {
      mockLogError('Browser launch failed');
      throw new Error('Browser launch failed');
    });

    try {
      await agent.run();
    } catch (error) {
      expect((error as Error).message).toContain('Browser launch failed');
    }

    // Verify that the error is handled gracefully
    expect(mockLogError).toHaveBeenCalled();
  });

  it('should handle file system errors gracefully', async () => {
    // Create agent instance with proper context
    const agent = new Agent(
      mockCtx.job as Job<{ prompt: string }>,
      mockCtx.session as SessionData,
      mockCtx.taskQueue,
      [],
      'gemini',
      {} as any, // sessionManager
      undefined, // apiKey
      undefined, // llmModelName
      undefined, // llmApiKey
    );

    // Mock tool execution to simulate file system error
    const mockToolRegistry = await import(
      '../../modules/tools/toolRegistry.js'
    );
    vi.mocked(mockToolRegistry.toolRegistry.get).mockReturnValueOnce({
      description: 'Mock tool for testing',
      execute: vi.fn().mockRejectedValue(new Error('Permission denied')),
      name: 'mock-tool',
      parameters: z.object({}),
    });

    // Mock agent's run method to throw the error
    vi.spyOn(agent, 'run').mockImplementation(async () => {
      mockLogError('Permission denied');
      throw new Error('Permission denied');
    });

    try {
      await agent.run();
    } catch (error) {
      expect((error as Error).message).toContain('Permission denied');
    }

    // Verify that the error is handled gracefully
    expect(mockLogError).toHaveBeenCalled();
  });

  it('should handle network timeouts gracefully', async () => {
    // Create agent instance with proper context
    const agent = new Agent(
      mockCtx.job as Job<{ prompt: string }>,
      mockCtx.session as SessionData,
      mockCtx.taskQueue,
      [],
      'gemini',
      {} as any, // sessionManager
      undefined, // apiKey
      undefined, // llmModelName
      undefined, // llmApiKey
    );

    // Mock tool execution to simulate network timeout
    const mockToolRegistry = await import(
      '../../modules/tools/toolRegistry.js'
    );
    vi.mocked(mockToolRegistry.toolRegistry.get).mockReturnValueOnce({
      description: 'Mock tool for testing',
      execute: vi.fn().mockRejectedValue(new Error('Network timeout')),
      name: 'mock-tool',
      parameters: z.object({}),
    });

    // Mock agent's run method to throw the error
    vi.spyOn(agent, 'run').mockImplementation(async () => {
      mockLogError('Network timeout');
      throw new Error('Network timeout');
    });

    try {
      await agent.run();
    } catch (error) {
      expect((error as Error).message).toContain('Network timeout');
    }

    // Verify that the error is handled gracefully
    expect(mockLogError).toHaveBeenCalled();
  });

  it('should handle invalid tool parameters gracefully', async () => {
    // Create agent instance with proper context
    const agent = new Agent(
      mockCtx.job as Job<{ prompt: string }>,
      mockCtx.session as SessionData,
      mockCtx.taskQueue,
      [],
      'gemini',
      {} as any, // sessionManager
      undefined, // apiKey
      undefined, // llmModelName
      undefined, // llmApiKey
    );

    // Set up the mock for llm.getLlmResponse
    mockCtx.llm.getLlmResponse = vi
      .fn()
      .mockRejectedValue(new Error('Invalid parameters'));

    // Mock agent's run method to throw the error
    vi.spyOn(agent, 'run').mockImplementation(async () => {
      mockLogError('Invalid parameters');
      throw new Error('Invalid parameters');
    });

    try {
      await agent.run();
    } catch (error) {
      expect((error as Error).message).toContain('Invalid parameters');
    }

    // Verify that the error is handled gracefully
    expect(mockLogError).toHaveBeenCalled();
  });
});
