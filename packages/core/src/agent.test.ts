import { Job, Queue } from 'bullmq';
import { afterEach, beforeEach, describe, expect, it, vi, Mock } from 'vitest';

import { SessionData } from '../types.js';

import { Agent } from '/home/demon/agentforge/AgenticForge2/packages/core/src/agent.js';
import { getLlmResponse } from './utils/llmProvider.js';

// Mock des dépendances externes
vi.mock('./utils/llmProvider.js', () => ({
  getLlmResponse: vi.fn(),
}));

const mockedGetLlmResponse = getLlmResponse as Mock;


vi.mock('../redisClient', () => ({
  redis: {
    duplicate: vi.fn(() => ({
      on: vi.fn(),
      quit: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    })),
    publish: vi.fn(),
  },
}));

describe('Agent Integration Tests', () => {
  let agent: Agent;
  let mockJob: Job;
  let mockSession: SessionData;
  let mockQueue: Queue;

  beforeEach(() => {
    mockJob = {
      data: { prompt: 'Test objective' },
      id: 'test-job-1',
    } as Job;

    mockSession = {
      history: [],
      id: 'test-session-1',
      identities: [],
    };

    mockQueue = {} as Queue;

    agent = new Agent(mockJob, mockSession, mockQueue);

    // Clear mocks before each test to ensure a clean state
    mockedGetLlmResponse.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
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
        "La réponse du modèle n'a pas pu être analysée. Nouvelle tentative.",
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
});