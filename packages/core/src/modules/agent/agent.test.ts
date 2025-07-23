import { Job, Queue } from 'bullmq';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { z } from 'zod';

import { Ctx, SessionData } from '@/types.js';

import { getLlmProvider } from '../../utils/llmProvider.js';
import { getTools } from '../../utils/toolLoader.js';
import { redis } from '../redis/redisClient.js';
import { toolRegistry } from '../tools/toolRegistry.js';
import { Agent } from './agent.js';

vi.mock('../../utils/llmProvider.js', () => ({
  getLlmProvider: vi.fn(() => ({
    getLlmResponse: vi.fn(),
  })),
}));

vi.mock('../tools/toolRegistry.js', () => ({
  toolRegistry: {
    execute: vi.fn(),
    getAll: vi.fn(),
    register: vi.fn(),
  },
}));

vi.mock('../../utils/toolLoader.js', () => ({
  getTools: vi.fn(),
}));

vi.mock('../redis/redisClient.js', () => ({
  redis: {
    duplicate: vi.fn(),
    publish: vi.fn(),
    subscribe: vi.fn(),
  },
}));

vi.mock('../redis/redisClient.js', () => {
  const mockRedisSubscriber = {
    on: vi.fn(),
    quit: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  };
  return {
    redis: {
      duplicate: vi.fn(() => mockRedisSubscriber),
      publish: vi.fn(),
      subscribe: vi.fn(),
    },
  };
});

const mockedGetLlmResponse = getLlmProvider().getLlmResponse as Mock;
const mockedGetTools = getTools as Mock;
const mockedToolRegistryExecute = toolRegistry.execute as Mock;
const mockedToolRegistryGetAll = toolRegistry.getAll as Mock;

const mockFinishToolParams = z.object({
  response: z.string().describe('The final, complete answer to the user.'),
});

const mockFinishTool = {
  description: "Call this tool when the user's goal is accomplished.",
  execute: vi.fn(
    async (args: z.infer<typeof mockFinishToolParams>, _ctx: Ctx) => {
      return {
        answer: args.response,
      };
    },
  ),
  name: 'finish',
  parameters: mockFinishToolParams,
};

const mockTestToolParams = z.object({
  arg: z.string().describe('An argument for the test tool.'),
});

const mockTestTool = {
  description: 'A test tool.',
  execute: vi.fn(
    async (_args: z.infer<typeof mockTestToolParams>, _ctx: Ctx) => {
      return 'tool result';
    },
  ),
  name: 'test-tool',
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

    mockedGetTools.mockResolvedValue([mockTestTool, mockFinishTool]);
    mockedToolRegistryGetAll.mockReturnValue([mockTestTool, mockFinishTool]);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('should follow the thought-command-result loop', async () => {
    mockedGetLlmResponse
      .mockResolvedValueOnce(
        '\n```json\n{\n          "command": { "name": "test-tool", "params": { "arg": "value" } },\n          "thought": "I should use the test tool."\n}\n```\n',
      )
      .mockResolvedValueOnce(
        '\n```json\n{\n          "command": {\n            "name": "finish",\n            "params": { "response": "intermediate step" }\n          },\n          "thought": "I have the result, I should finish now."\n}\n```\n',
      )
      .mockResolvedValueOnce(
        '\n```json\n{\n          "answer": "Final answer",\n          "thought": "I have finished."\n}\n```\n',
      );

    mockedToolRegistryExecute.mockImplementation(async (name, params, ctx) => {
      if (name === 'test-tool') {
        return mockTestTool.execute(params as { arg: string }, ctx);
      }
      if (name === 'finish') {
        return mockFinishTool.execute(params as { response: string }, ctx);
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
        content:
          '\n```json\n{\n          "command": { "name": "test-tool", "params": { "arg": "value" } },\n          "thought": "I should use the test tool."\n}\n```\n',
        role: 'model',
      },
      {
        content: 'Tool result: "tool result"',
        role: 'tool',
      },
      {
        content:
          '\n```json\n{\n          "command": {\n            "name": "finish",\n            "params": { "response": "intermediate step" }\n          },\n          "thought": "I have the result, I should finish now."\n}\n```\n',
        role: 'model',
      },
      {
        content: 'Tool result: {"answer":"intermediate step"}',
        role: 'tool',
      },
      {
        content:
          '\n```json\n{\n          "answer": "Final answer",\n          "thought": "I have finished."\n}\n```\n',
        role: 'model',
      },
    ]);
  });

  it('should handle LLM response parsing errors gracefully', async () => {
    mockedGetLlmResponse
      .mockResolvedValueOnce('This is not valid JSON')
      .mockResolvedValueOnce(
        '\n```json\n{\n  "answer": "Success",\n  "thought": "Okay, I will use JSON now."\n}\n```\n',
      );
    mockedToolRegistryExecute.mockResolvedValue('Success');

    const finalResponse = await agent.run();

    expect(finalResponse).toBe('Success');
    expect(mockedGetLlmResponse).toHaveBeenCalledTimes(2);
    expect(mockSession.history).toContainEqual({
      content:
        'Your last response was not a valid command. You must choose a tool from the list or provide a final answer. Please try again. Last response: This is not valid JSON',
      role: 'user',
    });
  });

  it('should stop if it reaches max iterations', async () => {
    let i = 0;
    mockedGetLlmResponse.mockImplementation(() => {
      i++;
      return Promise.resolve(
        '\n```json\n{\n  "command": { "name": "test-tool", "params": { "count": ' +
          i +
          ' } },\n  "thought": "Looping..."\n}\n```\n',
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
      // Simulate the interrupt signal during the "thinking" phase
      if (onMessageCallback) {
        onMessageCallback(`job:${mockJob.id}:interrupt`, 'interrupt');
      }
      await vi.advanceTimersByTimeAsync(10); // Allow event loop to process interruption
      return `\n\`\`\`json\n{\n  "command": { "name": "test-tool", "params": {} },\n  "thought": "Still looping..."\n}\n\`\`\`\n`;
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
        `\n\`\`\`json\n{\n  "command": { "name": "test-tool", "params": { "arg": "fail" } },\n  "thought": "I will try to use the tool, but it might fail."\n}\n\`\`\`\n`,
      )
      .mockResolvedValueOnce(
        `\n\`\`\`json\n{\n  "answer": "Recovered from tool error",\n  "thought": "The tool failed, but I can still finish."\n}\n\`\`\`\n`,
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
    mockedToolRegistryGetAll.mockImplementationOnce(() => {
      throw new Error(errorMessage);
    });

    const finalResponse = await agent.run();

    expect(finalResponse).toBe(`Error: ${errorMessage}`);
    expect(mockedGetLlmResponse).not.toHaveBeenCalled();
  });
});
