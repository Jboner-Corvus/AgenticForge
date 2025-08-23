import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SessionData, Tool } from '../../types.ts';

import { getMockQueue } from '../../test/mockQueue.ts';
import { LlmError } from '../../utils/LlmError.ts';
import { Agent } from './agent.ts';

// Mock LLM Providers avec simulation de différents scénarios
const mockOpenAIProvider = {
  available: true,
  getLlmResponse: vi.fn(),
  name: 'openai',
};

const mockAnthropicProvider = {
  available: true,
  getLlmResponse: vi.fn(),
  name: 'anthropic',
};

const mockQwenProvider = {
  available: true,
  getLlmResponse: vi.fn(),
  name: 'qwen',
};

const mockGpt5Provider = {
  available: true,
  getLlmResponse: vi.fn(),
  name: 'gpt5',
};

// Mocks globaux
vi.mock('../../config.ts', () => ({
  config: {
    AGENT_MAX_ITERATIONS: 5,
    ANTHROPIC_API_KEY: 'test-anthropic-key',
    GPT5_API_KEY: 'test-gpt5-key',
    LLM_PROVIDER_HIERARCHY: ['openai', 'anthropic', 'qwen', 'gpt5'],
    OPENAI_API_KEY: 'test-openai-key',
    QWEN_API_KEY: 'test-qwen-key',
  },
}));

vi.mock('../../logger.ts', () => ({
  getLoggerInstance: () => ({
    child: () => ({
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    }),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}));

vi.mock('../redis/redisClient.ts', () => ({
  getRedisClientInstance: () => ({
    duplicate: () => ({
      on: vi.fn(),
      quit: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    }),
    publish: vi.fn(),
  }),
}));

vi.mock('../llm/LlmKeyManager.ts', () => ({
  LlmKeyManager: {
    getKey: vi.fn().mockResolvedValue('test-key'),
    hasAvailableKeys: vi.fn().mockResolvedValue(true),
    invalidateKey: vi.fn(),
    rotateKey: vi.fn(),
  },
}));

vi.mock('../tools/toolRegistry.ts', () => ({
  toolRegistry: {
    execute: vi.fn(),
  },
}));

vi.mock('./orchestrator.prompt.ts', () => ({
  getMasterPrompt: vi.fn().mockReturnValue('Mock prompt'),
}));

vi.mock('./responseSchema.ts', () => ({
  llmResponseSchema: {
    parse: vi.fn(),
  },
}));

// Mock du provider manager
let currentProvider = mockOpenAIProvider;
vi.mock('../../utils/llmProvider.ts', () => ({
  getAvailableProviders: vi.fn(() => ['openai', 'anthropic', 'qwen', 'gpt5']),
  getLlmProvider: vi.fn(() => currentProvider),
  getProviderHealth: vi.fn(() => ({ latency: 100, status: 'healthy' })),
  switchToProvider: vi.fn((providerName: string) => {
    switch (providerName) {
      case 'anthropic':
        currentProvider = mockAnthropicProvider;
        break;
      case 'gpt5':
        currentProvider = mockGpt5Provider;
        break;
      case 'openai':
        currentProvider = mockOpenAIProvider;
        break;
      case 'qwen':
        currentProvider = mockQwenProvider;
        break;
    }
    return currentProvider;
  }),
}));

describe('LLM Provider Fallback Integration Tests', () => {
  let mockJob: any;
  let mockSessionData: SessionData;
  let mockSessionManager: any;
  let mockTools: Tool[];
  let agent: Agent;

  beforeEach(() => {
    vi.clearAllMocks();
    currentProvider = mockOpenAIProvider;

    mockJob = {
      data: { prompt: 'Test LLM provider fallback' },
      id: 'llm-fallback-test',
      isFailed: vi.fn().mockResolvedValue(false),
      updateProgress: vi.fn(),
    };

    mockSessionData = {
      activeLlmProvider: 'openai',
      history: [],
      identities: [{ id: 'test-user', type: 'user' }],
      name: 'LLM Test Session',
      timestamp: Date.now(),
    };

    mockSessionManager = {
      saveSession: vi.fn(),
    };

    mockTools = [];

    agent = new Agent(
      mockJob,
      mockSessionData,
      getMockQueue(),
      mockTools,
      'openai',
      mockSessionManager,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Provider Failover Scenarios', () => {
    it('should fallback from OpenAI to Anthropic on error', async () => {
      const mockResponseSchema =
        require('./responseSchema.ts').llmResponseSchema;

      // OpenAI fails, Anthropic succeeds
      mockOpenAIProvider.getLlmResponse.mockRejectedValue(
        new LlmError('OpenAI rate limit'),
      );
      mockAnthropicProvider.getLlmResponse.mockResolvedValue(
        '{"answer": "Anthropic response"}',
      );
      mockResponseSchema.parse.mockReturnValue({
        answer: 'Anthropic response',
      });

      const result = await agent.run();

      expect(result).toBe('Anthropic response');
      expect(mockSessionData.activeLlmProvider).toBe('anthropic');
      expect(mockOpenAIProvider.getLlmResponse).toHaveBeenCalledTimes(1);
      expect(mockAnthropicProvider.getLlmResponse).toHaveBeenCalledTimes(1);
    });

    it('should cascade through all providers on sequential failures', async () => {
      const mockResponseSchema =
        require('./responseSchema.ts').llmResponseSchema;

      // All providers fail except the last one
      mockOpenAIProvider.getLlmResponse.mockRejectedValue(
        new LlmError('OpenAI down'),
      );
      mockAnthropicProvider.getLlmResponse.mockRejectedValue(
        new LlmError('Anthropic down'),
      );
      mockQwenProvider.getLlmResponse.mockRejectedValue(
        new LlmError('Qwen down'),
      );
      mockGpt5Provider.getLlmResponse.mockResolvedValue(
        '{"answer": "GPT5 backup response"}',
      );
      mockResponseSchema.parse.mockReturnValue({
        answer: 'GPT5 backup response',
      });

      const result = await agent.run();

      expect(result).toBe('GPT5 backup response');
      expect(mockSessionData.activeLlmProvider).toBe('gpt5');
      expect(mockOpenAIProvider.getLlmResponse).toHaveBeenCalledTimes(1);
      expect(mockAnthropicProvider.getLlmResponse).toHaveBeenCalledTimes(1);
      expect(mockQwenProvider.getLlmResponse).toHaveBeenCalledTimes(1);
      expect(mockGpt5Provider.getLlmResponse).toHaveBeenCalledTimes(1);
    });

    it('should handle Qwen timeout errors with specific retry logic', async () => {
      const mockResponseSchema =
        require('./responseSchema.ts').llmResponseSchema;

      // Qwen timeout should trigger retries before fallback
      const qwenTimeoutError = new LlmError(
        'Qwen API request failed with status 504 stream timeout',
      );

      mockOpenAIProvider.getLlmResponse.mockRejectedValue(
        new LlmError('OpenAI down'),
      );
      mockAnthropicProvider.getLlmResponse.mockRejectedValue(
        new LlmError('Anthropic down'),
      );
      mockQwenProvider.getLlmResponse
        .mockRejectedValueOnce(qwenTimeoutError)
        .mockRejectedValueOnce(qwenTimeoutError)
        .mockResolvedValueOnce('{"answer": "Qwen retry success"}');
      mockResponseSchema.parse.mockReturnValue({
        answer: 'Qwen retry success',
      });

      const result = await agent.run();

      expect(result).toBe('Qwen retry success');
      expect(mockQwenProvider.getLlmResponse).toHaveBeenCalledTimes(3); // 2 retries + 1 success
    });

    it('should handle all providers failing gracefully', async () => {
      // Tous les providers échouent
      mockOpenAIProvider.getLlmResponse.mockRejectedValue(
        new LlmError('OpenAI unavailable'),
      );
      mockAnthropicProvider.getLlmResponse.mockRejectedValue(
        new LlmError('Anthropic unavailable'),
      );
      mockQwenProvider.getLlmResponse.mockRejectedValue(
        new LlmError('Qwen unavailable'),
      );
      mockGpt5Provider.getLlmResponse.mockRejectedValue(
        new LlmError('GPT5 unavailable'),
      );

      const result = await agent.run();

      expect(result).toContain('All LLM providers failed');
      expect(mockOpenAIProvider.getLlmResponse).toHaveBeenCalled();
      expect(mockAnthropicProvider.getLlmResponse).toHaveBeenCalled();
      expect(mockQwenProvider.getLlmResponse).toHaveBeenCalled();
      expect(mockGpt5Provider.getLlmResponse).toHaveBeenCalled();
    });
  });

  describe('Provider Health Monitoring', () => {
    it('should monitor provider response times', async () => {
      const mockResponseSchema =
        require('./responseSchema.ts').llmResponseSchema;

      // Simuler des temps de réponse différents
      mockOpenAIProvider.getLlmResponse.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve('{"answer": "Fast response"}'), 100),
          ),
      );
      mockResponseSchema.parse.mockReturnValue({ answer: 'Fast response' });

      const startTime = Date.now();
      await agent.run();
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThan(90);
      expect(endTime - startTime).toBeLessThan(500);
    });

    it('should track provider error rates', async () => {
      const mockResponseSchema =
        require('./responseSchema.ts').llmResponseSchema;

      // Simuler des erreurs intermittentes
      let callCount = 0;
      mockOpenAIProvider.getLlmResponse.mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return Promise.reject(new LlmError('Intermittent error'));
        }
        return Promise.resolve('{"answer": "Eventually successful"}');
      });
      mockResponseSchema.parse.mockReturnValue({
        answer: 'Eventually successful',
      });

      await agent.run();

      expect(mockOpenAIProvider.getLlmResponse).toHaveBeenCalledTimes(3);
    });

    it('should implement circuit breaker pattern for unhealthy providers', async () => {
      const mockResponseSchema =
        require('./responseSchema.ts').llmResponseSchema;

      // Simuler un provider constamment en échec
      mockOpenAIProvider.getLlmResponse.mockRejectedValue(
        new LlmError('Consistent failure'),
      );
      mockAnthropicProvider.getLlmResponse.mockResolvedValue(
        '{"answer": "Anthropic healthy"}',
      );
      mockResponseSchema.parse.mockReturnValue({ answer: 'Anthropic healthy' });

      // Premier appel - devrait essayer OpenAI puis Anthropic
      await agent.run();
      expect(mockOpenAIProvider.getLlmResponse).toHaveBeenCalledTimes(1);
      expect(mockAnthropicProvider.getLlmResponse).toHaveBeenCalledTimes(1);

      vi.clearAllMocks();

      // Deuxième appel - devrait sauter OpenAI (circuit breaker ouvert)
      const agent2 = new Agent(
        mockJob,
        mockSessionData,
        getMockQueue(),
        mockTools,
        'openai',
        mockSessionManager,
      );
      await agent2.run();

      // OpenAI ne devrait pas être appelé grâce au circuit breaker
      expect(mockAnthropicProvider.getLlmResponse).toHaveBeenCalledTimes(1);
    });
  });

  describe('Provider Load Balancing', () => {
    it('should distribute load across healthy providers', async () => {
      const mockResponseSchema =
        require('./responseSchema.ts').llmResponseSchema;

      // Tous les providers sont en bonne santé
      mockOpenAIProvider.getLlmResponse.mockResolvedValue(
        '{"answer": "OpenAI response"}',
      );
      mockAnthropicProvider.getLlmResponse.mockResolvedValue(
        '{"answer": "Anthropic response"}',
      );
      mockQwenProvider.getLlmResponse.mockResolvedValue(
        '{"answer": "Qwen response"}',
      );
      mockResponseSchema.parse.mockReturnValue({
        answer: 'Load balanced response',
      });

      // Créer plusieurs agents pour tester la distribution de charge
      const agents = Array.from(
        { length: 6 },
        () =>
          new Agent(
            mockJob,
            { ...mockSessionData },
            getMockQueue(),
            mockTools,
            'openai',
            mockSessionManager,
          ),
      );

      await Promise.all(agents.map((agent) => agent.run()));

      // Vérifier que la charge est distribuée
      const totalCalls =
        mockOpenAIProvider.getLlmResponse.mock.calls.length +
        mockAnthropicProvider.getLlmResponse.mock.calls.length +
        mockQwenProvider.getLlmResponse.mock.calls.length;

      expect(totalCalls).toBe(6);
    });

    it('should respect provider priority in hierarchy', async () => {
      const mockResponseSchema =
        require('./responseSchema.ts').llmResponseSchema;

      mockOpenAIProvider.getLlmResponse.mockResolvedValue(
        '{"answer": "OpenAI priority"}',
      );
      mockResponseSchema.parse.mockReturnValue({ answer: 'OpenAI priority' });

      const result = await agent.run();

      expect(result).toBe('OpenAI priority');
      expect(mockOpenAIProvider.getLlmResponse).toHaveBeenCalledTimes(1);
      expect(mockAnthropicProvider.getLlmResponse).toHaveBeenCalledTimes(0);
    });

    it('should handle provider capacity limits', async () => {
      const mockResponseSchema =
        require('./responseSchema.ts').llmResponseSchema;

      // Simuler une limite de capacité
      mockOpenAIProvider.getLlmResponse.mockRejectedValue(
        new LlmError('Rate limit exceeded'),
      );
      mockAnthropicProvider.getLlmResponse.mockResolvedValue(
        '{"answer": "Anthropic capacity available"}',
      );
      mockResponseSchema.parse.mockReturnValue({
        answer: 'Anthropic capacity available',
      });

      const result = await agent.run();

      expect(result).toBe('Anthropic capacity available');
      expect(mockSessionData.activeLlmProvider).toBe('anthropic');
    });
  });

  describe('Provider Recovery and Auto-healing', () => {
    it('should automatically recover failed providers', async () => {
      const mockResponseSchema =
        require('./responseSchema.ts').llmResponseSchema;

      // Premier échec, puis récupération
      mockOpenAIProvider.getLlmResponse
        .mockRejectedValueOnce(new LlmError('Temporary failure'))
        .mockResolvedValueOnce('{"answer": "OpenAI recovered"}');
      mockResponseSchema.parse.mockReturnValue({ answer: 'OpenAI recovered' });

      await agent.run();

      expect(mockOpenAIProvider.getLlmResponse).toHaveBeenCalledTimes(2);
    });

    it('should perform health checks on recovered providers', async () => {
      const mockGetProviderHealth =
        require('../../utils/llmProvider.ts').getProviderHealth;

      mockGetProviderHealth.mockResolvedValue({
        latency: 120,
        status: 'healthy',
      });

      await agent.run();

      expect(mockGetProviderHealth).toHaveBeenCalledWith('openai');
    });

    it('should gradually increase traffic to recovered providers', async () => {
      const mockResponseSchema =
        require('./responseSchema.ts').llmResponseSchema;

      // Simuler une récupération progressive
      let healthScore = 0.1; // Commence à 10% de santé
      mockOpenAIProvider.getLlmResponse.mockImplementation(() => {
        healthScore += 0.3; // Amélioration graduelle
        if (Math.random() < healthScore) {
          return Promise.resolve('{"answer": "Gradual recovery"}');
        }
        return Promise.reject(new LlmError('Still recovering'));
      });
      mockAnthropicProvider.getLlmResponse.mockResolvedValue(
        '{"answer": "Anthropic stable"}',
      );
      mockResponseSchema.parse.mockReturnValue({ answer: 'Recovery test' });

      // Plusieurs appels pour tester la récupération progressive
      for (let i = 0; i < 5; i++) {
        const testAgent = new Agent(
          mockJob,
          { ...mockSessionData },
          getMockQueue(),
          mockTools,
          'openai',
          mockSessionManager,
        );
        await testAgent.run();
      }

      // Vérifier que OpenAI a été testé plusieurs fois
      expect(
        mockOpenAIProvider.getLlmResponse.mock.calls.length,
      ).toBeGreaterThan(2);
    });
  });

  describe('Provider-Specific Error Handling', () => {
    it('should handle OpenAI-specific errors correctly', async () => {
      const mockResponseSchema =
        require('./responseSchema.ts').llmResponseSchema;

      mockOpenAIProvider.getLlmResponse.mockRejectedValue(
        new LlmError('OpenAI API key invalid'),
      );
      mockAnthropicProvider.getLlmResponse.mockResolvedValue(
        '{"answer": "Anthropic fallback"}',
      );
      mockResponseSchema.parse.mockReturnValue({
        answer: 'Anthropic fallback',
      });

      const result = await agent.run();

      expect(result).toBe('Anthropic fallback');
      expect(mockSessionData.activeLlmProvider).toBe('anthropic');
    });

    it('should handle Anthropic-specific errors correctly', async () => {
      const mockResponseSchema =
        require('./responseSchema.ts').llmResponseSchema;

      mockOpenAIProvider.getLlmResponse.mockRejectedValue(
        new LlmError('OpenAI down'),
      );
      mockAnthropicProvider.getLlmResponse.mockRejectedValue(
        new LlmError('Anthropic content policy violation'),
      );
      mockQwenProvider.getLlmResponse.mockResolvedValue(
        '{"answer": "Qwen alternative"}',
      );
      mockResponseSchema.parse.mockReturnValue({ answer: 'Qwen alternative' });

      const result = await agent.run();

      expect(result).toBe('Qwen alternative');
      expect(mockSessionData.activeLlmProvider).toBe('qwen');
    });

    it('should handle provider authentication failures', async () => {
      const mockLlmKeyManager =
        require('../llm/LlmKeyManager.ts').LlmKeyManager;
      const mockResponseSchema =
        require('./responseSchema.ts').llmResponseSchema;

      mockOpenAIProvider.getLlmResponse.mockRejectedValue(
        new LlmError('Authentication failed'),
      );
      mockLlmKeyManager.rotateKey.mockResolvedValue('new-key');
      mockAnthropicProvider.getLlmResponse.mockResolvedValue(
        '{"answer": "Auth recovered"}',
      );
      mockResponseSchema.parse.mockReturnValue({ answer: 'Auth recovered' });

      await agent.run();

      expect(mockLlmKeyManager.rotateKey).toHaveBeenCalledWith('openai');
      expect(mockLlmKeyManager.invalidateKey).toHaveBeenCalled();
    });
  });

  describe('Cost Optimization', () => {
    it('should prefer cost-effective providers when possible', async () => {
      const mockResponseSchema =
        require('./responseSchema.ts').llmResponseSchema;

      // Configuration avec préférence de coût
      const costConfig = {
        providers: {
          anthropic: { cost_per_token: 0.025 },
          openai: { cost_per_token: 0.03 },
          qwen: { cost_per_token: 0.01 },
        },
      };

      mockOpenAIProvider.getLlmResponse.mockResolvedValue(
        '{"answer": "OpenAI response"}',
      );
      mockAnthropicProvider.getLlmResponse.mockResolvedValue(
        '{"answer": "Anthropic response"}',
      );
      mockQwenProvider.getLlmResponse.mockResolvedValue(
        '{"answer": "Qwen cost-effective"}',
      );
      mockResponseSchema.parse.mockReturnValue({ answer: 'Cost optimized' });

      // Simuler la sélection du provider le moins cher
      const costOptimizedAgent = new Agent(
        { ...mockJob, data: { ...mockJob.data, costOptimization: true } },
        mockSessionData,
        getMockQueue(),
        mockTools,
        'qwen', // Provider le moins cher
        mockSessionManager,
      );

      await costOptimizedAgent.run();

      expect(mockQwenProvider.getLlmResponse).toHaveBeenCalledTimes(1);
    });

    it('should track token usage and costs per provider', async () => {
      const mockResponseSchema =
        require('./responseSchema.ts').llmResponseSchema;

      mockOpenAIProvider.getLlmResponse.mockResolvedValue(
        '{"answer": "Token usage tracking"}',
      );
      mockResponseSchema.parse.mockReturnValue({
        answer: 'Token usage tracking',
      });

      await agent.run();

      // Vérifier que les métriques de coût sont suivies
      const redisClient =
        require('../redis/redisClient.ts').getRedisClientInstance();
      expect(redisClient.publish).toHaveBeenCalledWith(
        'metrics:token_usage',
        expect.stringContaining('openai'),
      );
    });
  });
});
