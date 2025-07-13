import { Job, Queue } from 'bullmq';
import { Logger } from 'pino'; // Import Logger from pino
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

// Define local interfaces for SessionData and AgentProgress for testing
export interface AgentProgress {
  current: number;
  total: number;
  unit?: string;
}

export interface Message {
  content: string;
  role: 'model' | 'tool' | 'user';
}

export interface SessionData {
  [key: string]: unknown;
  history: Message[];
  id: string;
  identities: Array<{ id: string; type: string }>;
  workingContext?: {
    currentFile?: string;
    lastAction?: string;
  };
}

import { Agent } from './agent.js';
import logger from './logger.js'; // Import logger
import { redis } from './redisClient.js'; // Import redis
import { toolRegistry } from './toolRegistry.js';
import { llmProvider } from './utils/llmProvider.js';
import { getTools } from './utils/toolLoader.js';

// Define a local mock Ctx interface for testing
interface MockCtx {
  job: Job;
  log: Logger;
  reportProgress?: (progress: AgentProgress) => Promise<void>;
  session: SessionData;

  taskQueue: Queue;
}

vi.mock('./utils/llmProvider.js', () => ({
  llmProvider: {
    getLlmResponse: vi.fn(),
  },
}));

vi.mock('./toolRegistry.js');
vi.mock('./utils/toolLoader.js'); // Mock toolLoader

vi.mock('./redisClient.js'); // Mock redis

const mockedGetLlmResponse = llmProvider.getLlmResponse as Mock;

const mockFinishTool = {
  description: "Call this tool when the user's goal is accomplished.",
  execute: vi.fn((args, _ctx: MockCtx) => {
    const finalResponse =
      typeof args === 'string' ? args : (args as { text?: string })?.text;
    return finalResponse;
  }),
  name: 'finish',
  parameters: {
    response: {
      description: 'The final, complete answer to the user.',
      type: 'string',
    },
  },
};

const mockTestTool = {
  description: 'A test tool.',
  execute: vi.fn((_args: unknown, _ctx: MockCtx) => 'tool result'),
  name: 'test-tool',
  parameters: {
    arg: {
      description: 'An argument for the test tool.',
      type: 'string',
    },
  },
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
    } as Job;

    mockSession = {
      data: {}, // Add data property to match SessionData structure
      history: [],
      id: 'test-session-1',
      identities: [],
    };

    mockQueue = {} as Queue;

    // Mock Redis subscriber
    onMessageCallback = undefined;
    mockRedisSubscriber = {
      on: vi.fn((event, cb) => {
        if (event === 'message') {
          onMessageCallback = cb;
        }
      }),
      quit: vi.fn(),
      subscribe: vi.fn((_channel, cb) => {
        cb(null, 1); // Simulate successful subscription
      }),
      unsubscribe: vi.fn(),
    };
    (redis.duplicate as Mock).mockReturnValue(mockRedisSubscriber);
    (redis.publish as Mock).mockResolvedValue(1); // Mock publish to avoid errors

    // Create a mock Ctx object
    const _mockCtx: MockCtx = {
      job: mockJob,
      log: logger.child({ jobId: mockJob.id, sessionId: mockSession.id }), // Use the imported logger
      reportProgress: vi.fn(),
      session: mockSession,

      taskQueue: mockQueue, // Ensure taskQueue is included
    };

    agent = new Agent(mockJob, mockSession, mockQueue);

    // Clear mocks before each test to ensure a clean state
    mockedGetLlmResponse.mockClear();

    // Mock toolRegistry methods
    (toolRegistry.getAll as Mock).mockReturnValue([
      mockFinishTool,
      mockTestTool,
    ]);
    (toolRegistry.execute as Mock).mockImplementation(
      async (name: string, params: unknown, ctx: MockCtx) => {
        if (name === 'finish') {
          return mockFinishTool.execute(params, ctx);
        } else if (name === 'test-tool') {
          return mockTestTool.execute(params, ctx);
        }
        throw new Error(`Tool not found: ${name}`);
      },
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('should follow the thought-command-result loop', async () => {
    // 1. Première réponse du LLM : pensée + commande
    mockedGetLlmResponse.mockResolvedValueOnce(
      JSON.stringify({
        command: { name: 'test-tool', params: { arg: 'value' } },
        thought: 'I should use the test tool.',
      }),
    );
    // 2. Deuxième réponse du LLM : pensée finale
    mockedGetLlmResponse.mockResolvedValueOnce(
      JSON.stringify({
        command: { name: 'finish', params: { text: 'Final answer' } },
        thought: 'I have the result, I can finish.',
      }),
    );

    const finalResponse = await agent.run();

    // Vérifie que le LLM a été appelé deux fois
    expect(mockedGetLlmResponse).toHaveBeenCalledTimes(2);
    // Vérifie que la réponse finale est correcte
    expect(finalResponse).toBe('Final answer');
    // Vérifie que l'historique de session contient la boucle complète
    expect(mockSession.history).toEqual([
      { content: 'Test objective', role: 'user' },
      { content: 'Tool result: "tool result"', role: 'model' },
    ]);
  });

  it('should handle LLM response parsing errors gracefully', async () => {
    // 1. Réponse invalide du LLM
    mockedGetLlmResponse.mockResolvedValueOnce('This is not valid JSON');
    // 2. Réponse valide après l'erreur
    mockedGetLlmResponse.mockResolvedValueOnce(
      JSON.stringify({
        command: { name: 'finish', params: { text: 'Success' } },
        thought: 'Okay, I will use JSON now.',
      }),
    );

    const finalResponse = await agent.run();

    expect(finalResponse).toBe('Success');
    expect(mockedGetLlmResponse).toHaveBeenCalledTimes(2);
    // Vérifie que le message d'erreur a été ajouté à l'historique pour le contexte
    expect(mockSession.history).toContainEqual({
      content:
        'Your last response was not a valid command. You must choose a tool from the list. Please try again.',
      role: 'user',
    });
  });

  it('should stop if it reaches max iterations', async () => {
    // Fait en sorte que le LLM réponde toujours avec la même commande
    mockedGetLlmResponse.mockResolvedValue(
      JSON.stringify({
        command: { name: 'test-tool', params: {} },
        thought: 'Looping...',
      }),
    );

    const finalResponse = await agent.run();

    expect(finalResponse).toBe(
      'Agent reached maximum iterations without a final answer.',
    );
    // Le nombre d'appels doit correspondre à MAX_ITERATIONS
    expect(mockedGetLlmResponse).toHaveBeenCalledTimes(10); // Default max iterations
  });

  it('should be interrupted by a signal', async () => {
    // Configure le LLM pour qu'il continue à boucler indéfiniment
    mockedGetLlmResponse.mockResolvedValue(
      JSON.stringify({
        command: { name: 'test-tool', params: {} },
        thought: 'Still looping...',
      }),
    );

    // Lance l'exécution de l'agent en arrière-plan
    const agentRunPromise = agent.run();

    // Attend un court instant pour que l'agent démarre et s'abonne
    await vi.advanceTimersByTime(10);

    // Simule l'envoi d'un message d'interruption
    if (onMessageCallback) {
      onMessageCallback(`job:${mockJob.id}:interrupt`, 'interrupt');
    } else {
      throw new Error('onMessageCallback was not set');
    }

    // Attend que l'agent se termine
    const finalResponse = await agentRunPromise;

    // Vérifie que l'agent a été interrompu
    expect(finalResponse).toBe('Agent execution interrupted.');
    expect(mockRedisSubscriber.unsubscribe).toHaveBeenCalledWith(
      `job:${mockJob.id}:interrupt`,
    );
    expect(mockRedisSubscriber.quit).toHaveBeenCalled();
    // Le LLM devrait avoir été appelé au moins une fois avant l'interruption
    expect(mockedGetLlmResponse).toHaveBeenCalledTimes(1);
  });

  it('should handle tool execution errors gracefully', async () => {
    const errorMessage = 'Error during tool execution';
    // 1. LLM demande l'exécution d'un outil qui va échouer
    mockedGetLlmResponse.mockResolvedValueOnce(
      JSON.stringify({
        command: { name: 'test-tool', params: { arg: 'fail' } },
        thought: 'I will try to use the tool, but it might fail.',
      }),
    );
    // 2. LLM répond avec une commande finish après l'échec de l'outil
    mockedGetLlmResponse.mockResolvedValueOnce(
      JSON.stringify({
        command: {
          name: 'finish',
          params: { text: 'Recovered from tool error' },
        },
        thought: 'The tool failed, but I can still finish.',
      }),
    );

    // Mock toolRegistry.execute pour lancer une erreur pour 'test-tool'
    (toolRegistry.execute as Mock).mockImplementationOnce(
      async (name: string, params: unknown, _ctx: MockCtx) => {
        if (name === 'test-tool') {
          throw new Error(errorMessage);
        }
        // Fallback pour les autres outils (comme 'finish')
        if (name === 'finish') {
          return mockFinishTool.execute(params, _ctx);
        }
        throw new Error(`Tool not found: ${name}`);
      },
    );

    const finalResponse = await agent.run();

    expect(finalResponse).toBe('Recovered from tool error');
    expect(mockedGetLlmResponse).toHaveBeenCalledTimes(2);
    expect(mockSession.history).toContainEqual({
      content: `Tool result: "${errorMessage}"`, // L'erreur de l'outil doit être enregistrée
      role: 'model',
    });
  });

  it('should return a default message if LLM response has no command or thought', async () => {
    // LLM répond avec un JSON valide mais sans commande ni pensée
    mockedGetLlmResponse.mockResolvedValue(
      JSON.stringify({
        someOtherKey: 'someValue',
      }),
    );

    const finalResponse = await agent.run();

    expect(finalResponse).toBe(
      'Agent reached maximum iterations without a final answer.',
    );
    expect(mockedGetLlmResponse).toHaveBeenCalledTimes(10);
    // L'historique ne devrait pas contenir de nouvelle entrée pour la pensée ou la commande
    expect(mockSession.history).not.toContainEqual({
      role: 'model',
    });
  });

  it('should handle tool loading failures', async () => {
    const errorMessage = 'Failed to load tools';
    (getTools as Mock).mockRejectedValueOnce(new Error(errorMessage));

    const finalResponse = await agent.run();

    expect(finalResponse).toBe(`Error: ${errorMessage}`);
    expect(getTools).toHaveBeenCalledTimes(1);
    // L'historique ne devrait pas être modifié au-delà de l'invite initiale
    expect(mockSession.history).toEqual([
      { content: 'Test objective', role: 'user' },
    ]);
  });
});
