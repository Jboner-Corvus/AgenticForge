import type { Job, Queue } from 'bullmq';

import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { z } from 'zod';

import { Ctx, SessionData, Tool } from '@/types.js';

import { getLlmProvider } from '../../utils/llmProvider.js';
import { getTools } from '../../utils/toolLoader.js';
import { getRedisClientInstance } from '../redis/redisClient.js';
import { toolRegistry } from '../tools/toolRegistry.js';
import { Agent } from './agent.js';

vi.mock('../../utils/llmProvider.js', () => {
  const mockLlmProvider = {
    getLlmResponse: vi.fn((_messages: any, _systemPrompt?: string) => {}),
  };
  return {
    getLlmProvider: vi.fn((_providerName: string) => mockLlmProvider),
  };
});

vi.mock('../llm/LlmKeyManager.js', () => ({
  LlmKeyManager: {
    addKey: vi.fn(),
    getKeysForApi: vi.fn(),
    getNextAvailableKey: vi.fn(),
    hasAvailableKeys: vi.fn(),
    markKeyAsBad: vi.fn(),
    removeKey: vi.fn(),
    resetKeyStatus: vi.fn(),
  },
}));

vi.mock('../tools/toolRegistry.js', () => ({
  toolRegistry: {
    execute: vi.fn(),
    getAll: vi.fn(),
    register: vi.fn(),
  },
}));

vi.mock('../../utils/toolLoader.js', () => ({
  getTools: vi.fn() as Mock,
}));

vi.mock('../redis/redisClient.js', () => {
  const mockRedisClient = {
    duplicate: vi.fn(),
    lrange: vi.fn().mockResolvedValue([]),
    publish: vi.fn(),
  };
  return {
    getRedisClientInstance: vi.fn(() => mockRedisClient),
  };
});

import { SessionManager as _SessionManager } from '../session/sessionManager.js';

const _mockSessionManagerInstance = {
  getSession: vi.fn(),
  saveSession: vi.fn(),
};

vi.mock('../session/sessionManager', () => ({
  SessionManager: vi.fn(() => ({
    getSession: vi.fn(),
    saveSession: vi.fn(),
  })),
}));

import { LlmKeyManager } from '../llm/LlmKeyManager.js';

const mockedGetLlmResponse = getLlmProvider('gemini').getLlmResponse as Mock;
const mockedGetTools = getTools as Mock;
const mockedToolRegistryExecute = toolRegistry.execute as Mock;
const mockedToolRegistryGetAll = toolRegistry.getAll as Mock;
const mockedLlmKeyManagerGetNextAvailableKey =
  LlmKeyManager.getNextAvailableKey as Mock;
const mockedLlmKeyManagerHasAvailableKeys =
  LlmKeyManager.hasAvailableKeys as Mock;

const mockFinishToolParams = z.object({
  response: z.string().describe('The final, complete answer to the user.'),
});

const mockFinishTool: Tool<any, any> = {
  description: "Call this tool when the user's goal is accomplished.",
  execute: vi.fn(
    async (args: z.infer<typeof mockFinishToolParams>, _ctx: Ctx) => {
      return {
        answer: args.response,
      };
    },
  ),
  name: 'finish',
  output: z.object({ answer: z.string() }),
  parameters: mockFinishToolParams,
};

const mockTestToolParams = z.object({
  arg: z.string().describe('An argument for the test tool.'),
});

const mockTestTool: Tool<any, any> = {
  description: 'A test tool.',
  execute: vi.fn(
    async (_args: z.infer<typeof mockTestToolParams>, _ctx: Ctx) => {
      return 'tool result';
    },
  ),
  name: 'test-tool',
  output: z.string(),
  parameters: mockTestToolParams,
};

describe('Agent Integration Tests', () => {
  let agent: Agent;
  let mockJob: Job;
  let mockSession: SessionData;
  let mockQueue: Queue;
  let mockRedisSubscriber: {
    on: Mock;
    quit: Mock;
    subscribe: Mock;
    unsubscribe: Mock;
  };
  let onMessageCallback:
    | ((channel: string, message: string) => void)
    | undefined;

  beforeEach(() => {
    vi.useFakeTimers();

    mockJob = {
      data: { prompt: 'Test objective' },
      id: 'test-job-1',
      isFailed: vi.fn().mockResolvedValue(false),
      updateProgress: vi.fn(),
    } as unknown as Job;

    mockSession = {
      activeLlmProvider: 'gemini', // Default active provider for tests
      history: [],
      id: 'test-session-1',
      identities: [],
      name: 'Test Session',
      timestamp: Date.now(),
    };

    mockQueue = {
      add: vi.fn(),
    } as unknown as Queue;

    onMessageCallback = undefined;
    mockRedisSubscriber = {
      on: vi.fn((event, cb) => {
        if (event === 'message') {
          onMessageCallback = cb;
        }
      }),
      quit: vi.fn(),
      subscribe: vi.fn(async (_channel, cb) => {
        if (cb) {
          cb(null, 1);
        }
        return Promise.resolve();
      }),
      unsubscribe: vi.fn(),
    };
    (getRedisClientInstance().duplicate as Mock).mockReturnValue(
      mockRedisSubscriber,
    );
    (getRedisClientInstance().publish as Mock).mockResolvedValue(1);

    // Default mocks for LLM Key Manager
    mockedLlmKeyManagerHasAvailableKeys.mockResolvedValue(true);
    mockedLlmKeyManagerGetNextAvailableKey.mockResolvedValue({
      apiKey: 'mock-api-key',
      errorCount: 0,
      provider: 'gemini',
    });

    // Mock config.LLM_PROVIDER_HIERARCHY
    vi.mock('../../config.js', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../../config.js')>();
      return {
        ...actual,
        config: {
          ...actual.config,
          LLM_PROVIDER_HIERARCHY: [
            'gemini',
            'openai',
            'mistral',
            'huggingface',
          ],
        },
      };
    });

    agent = new Agent(
      mockJob,
      mockSession,
      mockQueue,
      [mockTestTool, mockFinishTool],
      mockSession.activeLlmProvider!,
      new _SessionManager(null as any),
    );

    mockedGetTools.mockResolvedValue([mockTestTool, mockFinishTool]);
    mockedToolRegistryGetAll.mockReturnValue([mockTestTool, mockFinishTool]);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    if (mockRedisSubscriber) {
      mockRedisSubscriber.quit();
    }
  });

  it('should follow the thought-command-result loop', async () => {
    mockedGetLlmResponse
      .mockResolvedValueOnce(
        `
{
          "command": { "name": "test-tool", "params": { "arg": "value" } },
          "thought": "I should use the test tool."
}
`,
      )
      .mockResolvedValueOnce(
        `
{
          "command": { "name": "finish", "params": { "response": "Final answer" } },
          "thought": "I have finished."
}
`,
      );

    mockedToolRegistryExecute.mockImplementation(async (name, params, ctx) => {
      if (name === 'test-tool') {
        return mockTestTool.execute({ arg: 'value' }, ctx);
      }
      if (name === 'finish') {
        return mockFinishTool.execute({ response: 'Final answer' }, ctx);
      }
    });

    const finalResponse = await agent.run();

    expect(finalResponse).toBe('Final answer');
    expect(mockedGetLlmResponse).toHaveBeenCalledTimes(2);
    expect(mockedToolRegistryExecute).toHaveBeenCalledWith(
      'test-tool',
      { arg: 'value' },
      expect.any(Object),
    );
    expect(mockedToolRegistryExecute).toHaveBeenCalledWith(
      'finish',
      { response: 'Final answer' },
      expect.any(Object),
    );
    expect(mockSession.history).toEqual([
      {
        content: 'Test objective',
        id: expect.any(String),
        timestamp: expect.any(Number),
        type: 'user',
      },
      {
        content: 'I should use the test tool.',
        id: expect.any(String),
        timestamp: expect.any(Number),
        type: 'agent_thought',
      },
      {
        id: expect.any(String),
        result: 'tool result',
        timestamp: expect.any(Number),
        toolName: 'test-tool',
        type: 'tool_result',
      },
      {
        content: 'I have finished.',
        id: expect.any(String),
        timestamp: expect.any(Number),
        type: 'agent_thought',
      },
      {
        id: expect.any(String),
        result: { answer: 'Final answer' },
        timestamp: expect.any(Number),
        toolName: 'finish',
        type: 'tool_result',
      },
    ]);
  });

  it('should handle LLM response parsing errors gracefully', async () => {
    mockedGetLlmResponse.mockResolvedValueOnce(
      `
{
  "answer": "Success",
  "thought": "Okay, I will use JSON now."
}
`,
    );

    const finalResponse = await agent.run();

    expect(finalResponse).toBe('Success');
    expect(mockedGetLlmResponse).toHaveBeenCalledTimes(1);
  });

  it('should stop if it reaches max iterations', async () => {
    mockedGetLlmResponse.mockImplementation((messages) => {
      const iteration = messages.length; // Use message history length to create unique commands
      return Promise.resolve(
        `
{
          "command": { "name": "test-tool", "params": { "arg": "looping_arg_${iteration}" } },
          "thought": "Looping..."
}
`,
      );
    });
    mockedToolRegistryExecute.mockResolvedValue('looping result');

    const finalResponse = await agent.run();

    expect(finalResponse).toBe(
      'Agent reached maximum iterations without a final answer.',
    );
    expect(mockedGetLlmResponse).toHaveBeenCalledTimes(10);
  });

  it('should be interrupted by a signal', async () => {
    mockedGetLlmResponse.mockImplementation(async () => {
      if (onMessageCallback) {
        onMessageCallback(`job:${mockJob.id}:interrupt`, 'interrupt');
      }
      await vi.advanceTimersByTimeAsync(10);
      return `
{
  "command": { "name": "test-tool", "params": {} },
  "thought": "Still looping..."
}
`;
    });

    const finalResponse = await agent.run();

    expect(finalResponse).toBe('Agent execution interrupted.');
    expect(mockRedisSubscriber.unsubscribe).toHaveBeenCalledWith(
      `job:${mockJob.id}:interrupt`,
    );
    expect(mockRedisSubscriber.quit).toHaveBeenCalled();
    expect(mockedGetLlmResponse).toHaveBeenCalledTimes(1);
  }, 40000);

  it('should handle tool execution errors gracefully', async () => {
    const errorMessage = 'Error during tool execution';
    mockedGetLlmResponse
      .mockResolvedValueOnce(
        `
{
  "command": { "name": "test-tool", "params": { "arg": "fail" } },
  "thought": "I will try to use the tool, but it might fail."
}
`,
      )
      .mockResolvedValueOnce(
        `
{
  "answer": "Recovered from tool error",
  "thought": "The tool failed, but I can still finish."
}
`,
      );

    mockedToolRegistryExecute.mockRejectedValueOnce(new Error(errorMessage));

    const finalResponse = await agent.run();

    expect(finalResponse).toBe('Recovered from tool error');
    expect(mockedGetLlmResponse).toHaveBeenCalledTimes(2);
    expect(mockSession.history).toContainEqual({
      id: expect.any(String),
      result: `Error executing tool test-tool: ${errorMessage}`,
      timestamp: expect.any(Number),
      toolName: 'test-tool',
      type: 'tool_result',
    });
  });

  it('should not loop indefinitely on repeated tool errors', async () => {
    const errorMessage = 'Persistent tool error';
    mockedGetLlmResponse.mockImplementation((messages) =>
      Promise.resolve(
        `
{
  "command": { "name": "test-tool", "params": { "arg": "consistent_arg_${messages.length}" } },
  "thought": "I will try the tool again."
}
`,
      ),
    );
    mockedToolRegistryExecute.mockRejectedValue(new Error(errorMessage));

    const finalResponse = await agent.run();

    expect(finalResponse).toBe(
      'Agent reached maximum iterations without a final answer.',
    );
    expect(mockedGetLlmResponse).toHaveBeenCalledTimes(10);
    expect(mockedToolRegistryExecute).toHaveBeenCalledTimes(10);
  });

  it('should handle empty string response from LLM', async () => {
    mockedGetLlmResponse.mockResolvedValue('');

    const finalResponse = await agent.run();

    expect(finalResponse).toBe(
      'Agent stopped due to persistent malformed responses.',
    );
    expect(mockSession.history).toContainEqual({
      content:
        'Error: The `generate` tool returned an unexpected non-string or empty response.',
      id: expect.any(String),
      timestamp: expect.any(Number),
      type: 'error',
    });
  });

  it('should handle null response from LLM', async () => {
    mockedGetLlmResponse.mockResolvedValue(null);

    const finalResponse = await agent.run();

    expect(finalResponse).toBe(
      'Agent stopped due to persistent malformed responses.',
    );
    expect(mockSession.history).toContainEqual({
      content:
        'Error: The `generate` tool returned an unexpected non-string or empty response.',
      id: expect.any(String),
      timestamp: expect.any(Number),
      type: 'error',
    });
  });

  it('should detect a loop and stop execution', async () => {
    mockedGetLlmResponse.mockImplementation(() =>
      Promise.resolve(
        `
{
  "command": { "name": "test-tool", "params": { "arg": "loop" } },
  "thought": "I'm stuck in a loop."
}
`,
      ),
    );
    mockedToolRegistryExecute.mockResolvedValue('loop result');

    const finalResponse = await agent.run();

    expect(finalResponse).toBe('Agent stuck in a loop.');
    expect(mockedGetLlmResponse).toHaveBeenCalledTimes(4);
    expect(mockedToolRegistryExecute).toHaveBeenCalledTimes(3);
  });

  it('should add an error message to history if LLM provides no actionable response', async () => {
    mockedGetLlmResponse.mockResolvedValue('{}'); // Empty JSON object

    const finalResponse = await agent.run();

    expect(finalResponse).toBe(
      'Agent reached maximum iterations without a final answer.',
    );
    expect(mockSession.history).toContainEqual({
      content:
        'You must provide a command, a thought, a canvas output, or a final answer.',
      id: expect.any(String),
      timestamp: expect.any(Number),
      type: 'error',
    });
  });

  it('should handle JSON parsing errors from LLM response', async () => {
    const invalidJsonResponse = 'This is not a valid JSON';
    mockedGetLlmResponse.mockResolvedValueOnce(invalidJsonResponse);
    mockedGetLlmResponse.mockResolvedValueOnce(
      `
{
  "answer": "Recovered from parsing error",
  "thought": "I will provide a valid JSON now."
}
`,
    );

    const finalResponse = await agent.run();

    expect(finalResponse).toBe('Recovered from parsing error');
    expect(mockedGetLlmResponse).toHaveBeenCalledTimes(2);
    expect(mockSession.history).toContainEqual({
      content:
        'I was unable to parse your last response. Please ensure your response is a valid JSON object with the expected properties (`thought`, `command`, `canvas`, or `answer`). Check for syntax errors, missing commas, or unclosed brackets.',
      id: expect.any(String),
      timestamp: expect.any(Number),
      type: 'error',
    });
  });

  it('should handle finish tool not returning an answer', async () => {
    mockedGetLlmResponse.mockResolvedValueOnce(
      `
{
  "command": { "name": "finish", "params": { "response": "Final answer" } },
  "thought": "I have finished."
}
`,
    );
    (mockFinishTool.execute as Mock).mockResolvedValue('loop result');

    const finalResponse = await agent.run();

    expect(finalResponse).toEqual(
      'Finish tool did not return a valid answer object: "loop result"',
    );
    expect(mockSession.history).toContainEqual({
      content:
        'Error: Finish tool did not return a valid answer object: "loop result"',
      id: expect.any(String),
      timestamp: expect.any(Number),
      type: 'error',
    });
  });
});
