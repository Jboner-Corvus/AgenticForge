import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Agent } from './agent.js';
import { LlmError } from '../../utils/LlmError.js';
import { getMockQueue } from '../../test/mockQueue.js';
import type { SessionData, Tool } from '../../types.js';

// Mock Qwen Provider
const mockQwenProvider = {
  getLlmResponse: vi.fn(),
  name: 'qwen',
  available: true,
  models: ['qwen2.5-72b-instruct', 'qwen2.5-14b-instruct', 'qwen2.5-7b-instruct'],
};

// Mock fallback providers
const mockGeminiProvider = {
  getLlmResponse: vi.fn(),
  name: 'gemini',
  available: true,
  models: ['gemini-pro', 'gemini-pro-vision'],
};

// Mocks globaux
vi.mock('../../config.js', () => ({
  config: {
    AGENT_MAX_ITERATIONS: 5,
    LLM_PROVIDER_HIERARCHY: ['qwen', 'gemini'],
    QWEN_API_KEY: 'test-qwen-key',
    QWEN_API_URL: 'https://api.qwen.ai/v1',
    QWEN_MAX_TOKENS: 8192,
    QWEN_TEMPERATURE: 0.7,
    QWEN_TIMEOUT: 30000,
  },
}));

vi.mock('../../logger.js', () => ({
  getLoggerInstance: () => ({
    child: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

vi.mock('../redis/redisClient.js', () => ({
  getRedisClientInstance: () => ({
    publish: vi.fn(),
    duplicate: () => ({
      on: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      quit: vi.fn(),
    }),
  }),
}));

vi.mock('../llm/LlmKeyManager.js', () => ({
  LlmKeyManager: {
    hasAvailableKeys: vi.fn().mockResolvedValue(true),
    getKey: vi.fn().mockResolvedValue('test-qwen-key'),
    invalidateKey: vi.fn(),
    rotateKey: vi.fn(),
  },
}));

vi.mock('../tools/toolRegistry.js', () => ({
  toolRegistry: {
    execute: vi.fn(),
  },
}));

vi.mock('./orchestrator.prompt.js', () => ({
  getMasterPrompt: vi.fn().mockReturnValue('Mock prompt for Qwen'),
}));

vi.mock('./responseSchema.js', () => ({
  llmResponseSchema: {
    parse: vi.fn(),
  },
}));

// Mock du provider manager avec focus sur Qwen
let currentProvider = mockQwenProvider;
vi.mock('../../utils/llmProvider.js', () => ({
  getLlmProvider: vi.fn(() => currentProvider),
  switchToProvider: vi.fn((providerName: string) => {
    switch (providerName) {
      case 'qwen':
        currentProvider = mockQwenProvider;
        break;
      case 'gemini':
        currentProvider = mockGeminiProvider;
        break;
    }
    return currentProvider;
  }),
  getAvailableProviders: vi.fn(() => ['qwen', 'gemini']),
  getProviderHealth: vi.fn(() => ({ status: 'healthy', latency: 150 })),
}));

describe('Qwen LLM Provider Integration Tests', () => {
  let mockJob: any;
  let mockSessionData: SessionData;
  let mockSessionManager: any;
  let mockTools: Tool[];
  let agent: Agent;

  beforeEach(() => {
    vi.clearAllMocks();
    currentProvider = mockQwenProvider;

    mockJob = {
      id: 'qwen-test-job',
      data: { prompt: 'Test Qwen integration' },
      isFailed: vi.fn().mockResolvedValue(false),
      updateProgress: vi.fn(),
    };

    mockSessionData = {
      history: [],
      identities: [{ id: 'test-user', type: 'user' }],
      name: 'Qwen Test Session',
      timestamp: Date.now(),
      activeLlmProvider: 'qwen',
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
      'qwen',
      mockSessionManager
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Qwen Basic Integration', () => {
    it('should successfully get response from Qwen provider', async () => {
      const mockResponseSchema = require('./responseSchema.js').llmResponseSchema;

      mockQwenProvider.getLlmResponse.mockResolvedValue('{"answer": "Qwen successful response"}');
      mockResponseSchema.parse.mockReturnValue({ answer: 'Qwen successful response' });

      const result = await agent.run();

      expect(result).toBe('Qwen successful response');
      expect(mockSessionData.activeLlmProvider).toBe('qwen');
      expect(mockQwenProvider.getLlmResponse).toHaveBeenCalledTimes(1);
    });

    it('should handle Qwen API key validation', async () => {
      const mockLlmKeyManager = require('../llm/LlmKeyManager.js').LlmKeyManager;
      const mockResponseSchema = require('./responseSchema.js').llmResponseSchema;

      mockLlmKeyManager.hasAvailableKeys.mockResolvedValue(true);
      mockLlmKeyManager.getKey.mockResolvedValue('valid-qwen-key');
      mockQwenProvider.getLlmResponse.mockResolvedValue('{"answer": "Qwen with valid key"}');
      mockResponseSchema.parse.mockReturnValue({ answer: 'Qwen with valid key' });

      await agent.run();

      expect(mockLlmKeyManager.hasAvailableKeys).toHaveBeenCalledWith('qwen');
      expect(mockLlmKeyManager.getKey).toHaveBeenCalledWith('qwen');
    });

    it('should handle missing Qwen API key gracefully', async () => {
      const mockLlmKeyManager = require('../llm/LlmKeyManager.js').LlmKeyManager;
      const mockResponseSchema = require('./responseSchema.js').llmResponseSchema;

      mockLlmKeyManager.hasAvailableKeys.mockResolvedValue(false);
      mockGeminiProvider.getLlmResponse.mockResolvedValue('{"answer": "Fallback to Gemini"}');
      mockResponseSchema.parse.mockReturnValue({ answer: 'Fallback to Gemini' });

      const result = await agent.run();

      expect(result).toBe('Fallback to Gemini');
      expect(mockSessionData.activeLlmProvider).toBe('gemini');
    });
  });

  describe('Qwen Error Handling', () => {
    it('should handle Qwen rate limiting errors', async () => {
      const mockResponseSchema = require('./responseSchema.js').llmResponseSchema;

      mockQwenProvider.getLlmResponse.mockRejectedValue(
        new LlmError('Qwen API rate limit exceeded: 429')
      );
      mockGeminiProvider.getLlmResponse.mockResolvedValue('{"answer": "Gemini after rate limit"}');
      mockResponseSchema.parse.mockReturnValue({ answer: 'Gemini after rate limit' });

      const result = await agent.run();

      expect(result).toBe('Gemini after rate limit');
      expect(mockSessionData.activeLlmProvider).toBe('gemini');
    });

    it('should handle Qwen timeout errors with retries', async () => {
      const mockResponseSchema = require('./responseSchema.js').llmResponseSchema;

      const qwenTimeoutError = new LlmError('Qwen API request failed with status 504 stream timeout');
      
      mockQwenProvider.getLlmResponse
        .mockRejectedValueOnce(qwenTimeoutError)
        .mockRejectedValueOnce(qwenTimeoutError)
        .mockResolvedValueOnce('{"answer": "Qwen timeout retry success"}');
      mockResponseSchema.parse.mockReturnValue({ answer: 'Qwen timeout retry success' });

      const result = await agent.run();

      expect(result).toBe('Qwen timeout retry success');
      expect(mockQwenProvider.getLlmResponse).toHaveBeenCalledTimes(3);
    });

    it('should handle Qwen API authentication errors', async () => {
      const mockLlmKeyManager = require('../llm/LlmKeyManager.js').LlmKeyManager;
      const mockResponseSchema = require('./responseSchema.js').llmResponseSchema;

      mockQwenProvider.getLlmResponse.mockRejectedValue(
        new LlmError('Qwen authentication failed: Invalid API key')
      );
      mockLlmKeyManager.rotateKey.mockResolvedValue('new-qwen-key');
      mockGeminiProvider.getLlmResponse.mockResolvedValue('{"answer": "Gemini after auth error"}');
      mockResponseSchema.parse.mockReturnValue({ answer: 'Gemini after auth error' });

      await agent.run();

      expect(mockLlmKeyManager.invalidateKey).toHaveBeenCalledWith('qwen');
      expect(mockLlmKeyManager.rotateKey).toHaveBeenCalledWith('qwen');
    });

    it('should handle Qwen service unavailable errors', async () => {
      const mockResponseSchema = require('./responseSchema.js').llmResponseSchema;

      mockQwenProvider.getLlmResponse.mockRejectedValue(
        new LlmError('Qwen service temporarily unavailable: 503')
      );
      mockGeminiProvider.getLlmResponse.mockResolvedValue('{"answer": "Gemini service backup"}');
      mockResponseSchema.parse.mockReturnValue({ answer: 'Gemini service backup' });

      const result = await agent.run();

      expect(result).toBe('Gemini service backup');
      expect(mockSessionData.activeLlmProvider).toBe('gemini');
    });
  });

  describe('Qwen Model Selection and Configuration', () => {
    it('should work with different Qwen model variants', async () => {
      const mockResponseSchema = require('./responseSchema.js').llmResponseSchema;

      const models = ['qwen2.5-72b-instruct', 'qwen2.5-14b-instruct', 'qwen2.5-7b-instruct'];
      
      for (const model of models) {
        vi.clearAllMocks();
        mockQwenProvider.getLlmResponse.mockResolvedValue(`{"answer": "Response from ${model}"}`);
        mockResponseSchema.parse.mockReturnValue({ answer: `Response from ${model}` });

        const modelAgent = new Agent(
          { ...mockJob, data: { ...mockJob.data, model } },
          mockSessionData,
          getMockQueue(),
          mockTools,
          'qwen',
          mockSessionManager
        );

        const result = await modelAgent.run();

        expect(result).toBe(`Response from ${model}`);
        expect(mockQwenProvider.getLlmResponse).toHaveBeenCalledWith(
          expect.objectContaining({
            model: expect.stringContaining(model)
          })
        );
      }
    });

    it('should respect Qwen temperature and token limits', async () => {
      const mockResponseSchema = require('./responseSchema.js').llmResponseSchema;

      mockQwenProvider.getLlmResponse.mockResolvedValue('{"answer": "Configured Qwen response"}');
      mockResponseSchema.parse.mockReturnValue({ answer: 'Configured Qwen response' });

      const configuredAgent = new Agent(
        {
          ...mockJob,
          data: {
            ...mockJob.data,
            temperature: 0.3,
            maxTokens: 4096
          }
        },
        mockSessionData,
        getMockQueue(),
        mockTools,
        'qwen',
        mockSessionManager
      );

      await configuredAgent.run();

      expect(mockQwenProvider.getLlmResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.3,
          max_tokens: 4096
        })
      );
    });

    it('should handle Qwen streaming responses', async () => {
      const mockResponseSchema = require('./responseSchema.js').llmResponseSchema;

      // Simuler une réponse en streaming
      const streamChunks = [
        '{"answer": "Streaming ',
        'response ',
        'from Qwen"}',
      ];

      let chunkIndex = 0;
      mockQwenProvider.getLlmResponse.mockImplementation(() => {
        return new Promise((resolve) => {
          const interval = setInterval(() => {
            if (chunkIndex < streamChunks.length) {
              // Simuler l'arrivée progressive des chunks
              chunkIndex++;
            } else {
              clearInterval(interval);
              resolve('{"answer": "Streaming response from Qwen"}');
            }
          }, 50);
        });
      });

      mockResponseSchema.parse.mockReturnValue({ answer: 'Streaming response from Qwen' });

      const result = await agent.run();

      expect(result).toBe('Streaming response from Qwen');
    });
  });

  describe('Qwen Performance and Monitoring', () => {
    it('should monitor Qwen response times', async () => {
      const mockResponseSchema = require('./responseSchema.js').llmResponseSchema;

      mockQwenProvider.getLlmResponse.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve('{"answer": "Qwen timing test"}'), 200)
        )
      );
      mockResponseSchema.parse.mockReturnValue({ answer: 'Qwen timing test' });

      const startTime = Date.now();
      await agent.run();
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThan(190);
      expect(endTime - startTime).toBeLessThan(400);

      // Vérifier que les métriques de performance sont publiées
      const redisClient = require('../redis/redisClient.js').getRedisClientInstance();
      expect(redisClient.publish).toHaveBeenCalledWith(
        'metrics:qwen_performance',
        expect.stringContaining('response_time')
      );
    });

    it('should track Qwen token usage', async () => {
      const mockResponseSchema = require('./responseSchema.js').llmResponseSchema;

      mockQwenProvider.getLlmResponse.mockResolvedValue('{"answer": "Token usage tracking"}');
      mockResponseSchema.parse.mockReturnValue({ answer: 'Token usage tracking' });

      await agent.run();

      // Vérifier que l'usage des tokens est suivi
      const redisClient = require('../redis/redisClient.js').getRedisClientInstance();
      expect(redisClient.publish).toHaveBeenCalledWith(
        'metrics:token_usage',
        expect.stringContaining('qwen')
      );
    });

    it('should implement Qwen health checks', async () => {
      const mockGetProviderHealth = require('../../utils/llmProvider.js').getProviderHealth;
      
      mockGetProviderHealth.mockResolvedValue({ 
        status: 'healthy', 
        latency: 150,
        model_availability: true,
        rate_limit_remaining: 95 
      });

      await agent.run();

      expect(mockGetProviderHealth).toHaveBeenCalledWith('qwen');
    });
  });

  describe('Qwen Context and Memory Management', () => {
    it('should handle long conversation context with Qwen', async () => {
      const mockResponseSchema = require('./responseSchema.js').llmResponseSchema;

      // Créer un historique long
      const longHistory = Array.from({ length: 100 }, (_, i) => ({
        type: 'user' as const,
        content: `Message ${i}`,
        id: `msg-${i}`,
        timestamp: Date.now() - (100 - i) * 1000,
      }));

      const sessionWithLongHistory = {
        ...mockSessionData,
        history: longHistory,
      };

      mockQwenProvider.getLlmResponse.mockResolvedValue('{"answer": "Qwen long context response"}');
      mockResponseSchema.parse.mockReturnValue({ answer: 'Qwen long context response' });

      const contextAgent = new Agent(
        mockJob,
        sessionWithLongHistory,
        getMockQueue(),
        mockTools,
        'qwen',
        mockSessionManager
      );

      const result = await contextAgent.run();

      expect(result).toBe('Qwen long context response');
      expect(mockQwenProvider.getLlmResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ content: expect.stringContaining('Message') })
          ])
        })
      );
    });

    it('should optimize context window for Qwen models', async () => {
      const mockResponseSchema = require('./responseSchema.js').llmResponseSchema;

      // Simuler un contexte qui dépasse la limite
      const oversizedContext = 'A'.repeat(10000); // Contexte très long

      mockQwenProvider.getLlmResponse.mockResolvedValue('{"answer": "Qwen optimized context"}');
      mockResponseSchema.parse.mockReturnValue({ answer: 'Qwen optimized context' });

      const contextAgent = new Agent(
        { ...mockJob, data: { ...mockJob.data, context: oversizedContext } },
        mockSessionData,
        getMockQueue(),
        mockTools,
        'qwen',
        mockSessionManager
      );

      await contextAgent.run();

      // Vérifier que le contexte a été optimisé/tronqué
      expect(mockQwenProvider.getLlmResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.any(Array)
        })
      );
    });
  });

  describe('Qwen Cost Optimization', () => {
    it('should track Qwen usage costs', async () => {
      const mockResponseSchema = require('./responseSchema.js').llmResponseSchema;

      mockQwenProvider.getLlmResponse.mockResolvedValue('{"answer": "Cost tracking test"}');
      mockResponseSchema.parse.mockReturnValue({ answer: 'Cost tracking test' });

      await agent.run();

      // Vérifier que les coûts sont suivis
      const redisClient = require('../redis/redisClient.js').getRedisClientInstance();
      expect(redisClient.publish).toHaveBeenCalledWith(
        'metrics:provider_costs',
        expect.stringContaining('qwen')
      );
    });

    it('should prefer Qwen for cost-effective operations', async () => {
      const mockResponseSchema = require('./responseSchema.js').llmResponseSchema;

      mockQwenProvider.getLlmResponse.mockResolvedValue('{"answer": "Qwen cost-effective"}');
      mockResponseSchema.parse.mockReturnValue({ answer: 'Qwen cost-effective' });

      const costOptimizedJob = {
        ...mockJob,
        data: {
          ...mockJob.data,
          costOptimization: true,
          preferredProvider: 'qwen'
        }
      };

      const costAgent = new Agent(
        costOptimizedJob,
        mockSessionData,
        getMockQueue(),
        mockTools,
        'qwen',
        mockSessionManager
      );

      const result = await costAgent.run();

      expect(result).toBe('Qwen cost-effective');
      expect(mockQwenProvider.getLlmResponse).toHaveBeenCalledTimes(1);
    });
  });
});