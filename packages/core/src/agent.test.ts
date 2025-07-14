import { Job, Queue } from 'bullmq';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { z } from 'zod';

import { Agent } from './agent.js';
import { redis } from './redisClient.js';
import { toolRegistry } from './toolRegistry.js';
import * as allTools from './tools/index.js';
import { SessionData } from './types.js';
import { llmProvider } from './utils/llmProvider.js';

vi.mock('./utils/llmProvider.js', () => ({
  llmProvider: {
    getLlmResponse: vi.fn(),
  },
}));

vi.mock('./toolRegistry.js', () => ({
  toolRegistry: {
    execute: vi.fn(),
    getAll: vi.fn(),
    register: vi.fn(),
  },
}));

vi.mock('./tools/index.js', () => ({
  getAllTools: vi.fn(),
}));

vi.mock('./redisClient.js', () => ({
  redis: {
    duplicate: vi.fn(),
    publish: vi.fn(),
  },
}));

const mockedGetLlmResponse = llmProvider.getLlmResponse as Mock;
const mockedGetAllTools = allTools.getAllTools as Mock;
const mockedToolRegistryExecute = toolRegistry.execute as Mock;
const mockedToolRegistryGetAll = toolRegistry.getAll as Mock;

const mockFinishTool = {
  description: "Call this tool when the user's goal is accomplished.",
  execute: vi.fn(async ({ response }: { response: string }) => ({
    answer: response,
  })),
  name: 'finish',
  parameters: z.object({
    response: z.string().describe('The final, complete answer to the user.'),
  }),
};

const mockTestTool = {
  description: 'A test tool.',
  execute: vi.fn(async (_params: { arg: string }) => 'tool result'),
  name: 'test-tool',
  parameters: z.object({
    arg: z.string().describe('An argument for the test tool.'),
  }),
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
    } as unknown as Job;

    mockSession = {
      history: [],
      id: 'test-session-1',
      identities: [],
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
      subscribe: vi.fn((_channel, cb) => {
        if (cb) {
          cb(null, 1);
        }
        return Promise.resolve();
      }),
      unsubscribe: vi.fn(),
    };
    (redis.duplicate as Mock).mockReturnValue(mockRedisSubscriber);
    (redis.publish as Mock).mockResolvedValue(1);

    agent = new Agent(mockJob, mockSession, mockQueue);

    mockedGetAllTools.mockResolvedValue([mockTestTool, mockFinishTool]);
    mockedToolRegistryGetAll.mockReturnValue([mockTestTool, mockFinishTool]);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('should follow the thought-command-result loop', async () => {
    mockedGetLlmResponse
      .mockResolvedValueOnce(
        JSON.stringify({
          command: { name: 'test-tool', params: { arg: 'value' } },
          thought: 'I should use the test tool.',
        }),
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          command: {
            name: 'finish',
            params: { response: 'intermediate step' },
          },
          thought: 'I have the result, I should finish now.',
        }),
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          answer: 'Final answer',
          thought: 'I have finished.',
        }),
      );

    mockedToolRegistryExecute.mockImplementation(async (name, params) => {
      if (name === 'test-tool') {
        return mockTestTool.execute(params as { arg: string });
      }
      if (name === 'finish') {
        return mockFinishTool.execute(params as { response: string });
      }
    });

    const finalResponse = await agent.run();

    expect(finalResponse).toBe('Final answer');
    expect(mockedGetLlmResponse).toHaveBeenCalledTimes(3);
    expect(mockedToolRegistryExecute).toHaveBeenCalledWith(
      'test-tool',
      { arg: 'value' },
      expect.any(Object),
    );
    expect(mockedToolRegistryExecute).toHaveBeenCalledWith(
      'finish',
      { response: 'intermediate step' },
      expect.any(Object),
    );
    expect(mockSession.history).toEqual([
      { content: 'Test objective', role: 'user' },
      {
        content: 'Tool result: "tool result"',
        role: 'model',
      },
      {
        content: 'Tool result: {"answer":"intermediate step"}',
        role: 'model',
      },
    ]);
  });

  it('should handle LLM response parsing errors gracefully', async () => {
    mockedGetLlmResponse
      .mockResolvedValueOnce('This is not valid JSON')
      .mockResolvedValueOnce(
        JSON.stringify({
          answer: 'Success',
          thought: 'Okay, I will use JSON now.',
        }),
      );
    mockedToolRegistryExecute.mockResolvedValue('Success');

    const finalResponse = await agent.run();

    expect(finalResponse).toBe('Success');
    expect(mockedGetLlmResponse).toHaveBeenCalledTimes(2);
    expect(mockSession.history).toContainEqual({
      content:
        'Your last response was not a valid command. You must choose a tool from the list or provide a final answer. Please try again.',
      role: 'user',
    });
  });

  it('should stop if it reaches max iterations', async () => {
    mockedGetLlmResponse.mockResolvedValue(
      JSON.stringify({
        command: { name: 'test-tool', params: {} },
        thought: 'Looping...',
      }),
    );
    mockedToolRegistryExecute.mockResolvedValue('looping result');

    const finalResponse = await agent.run();

    expect(finalResponse).toBe(
      'Agent reached maximum iterations without a final answer.',
    );
    expect(mockedGetLlmResponse).toHaveBeenCalledTimes(10);
  });

  it('should be interrupted by a signal', async () => {
    mockedGetLlmResponse.mockImplementation(async () => {
      // Simulate the interrupt signal during the "thinking" phase
      if (onMessageCallback) {
        onMessageCallback(`job:${mockJob.id}:interrupt`, 'interrupt');
      }
      await vi.advanceTimersByTimeAsync(10); // Allow event loop to process interruption
      return JSON.stringify({
        command: { name: 'test-tool', params: {} },
        thought: 'Still looping...',
      });
    });

    const finalResponse = await agent.run();

    expect(finalResponse).toBe('Agent execution interrupted.');
    expect(mockRedisSubscriber.unsubscribe).toHaveBeenCalledWith(
      `job:${mockJob.id}:interrupt`,
    );
    expect(mockRedisSubscriber.quit).toHaveBeenCalled();
    expect(mockedGetLlmResponse).toHaveBeenCalledTimes(1);
  });

  it('should handle tool execution errors gracefully', async () => {
    const errorMessage = 'Error during tool execution';
    mockedGetLlmResponse
      .mockResolvedValueOnce(
        JSON.stringify({
          command: { name: 'test-tool', params: { arg: 'fail' } },
          thought: 'I will try to use the tool, but it might fail.',
        }),
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          answer: 'Recovered from tool error',
          thought: 'The tool failed, but I can still finish.',
        }),
      );

    mockedToolRegistryExecute
      .mockRejectedValueOnce(new Error(errorMessage))
      .mockResolvedValueOnce('Recovered from tool error');

    const finalResponse = await agent.run();

    expect(finalResponse).toBe('Recovered from tool error');
    expect(mockedGetLlmResponse).toHaveBeenCalledTimes(2);
    expect(mockSession.history).toContainEqual({
      content: `Error executing tool test-tool: ${errorMessage}`,
      role: 'tool',
    });
  });

  it('should handle tool loading failures', async () => {
    const errorMessage = 'Failed to load tools';
    mockedGetAllTools.mockRejectedValueOnce(new Error(errorMessage));

    const finalResponse = await agent.run();

    expect(finalResponse).toBe(`Error: ${errorMessage}`);
    expect(mockedGetLlmResponse).not.toHaveBeenCalled();
  });
});
