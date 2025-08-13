import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Agent } from './agent.js';
import { getMockQueue } from '../../test/mockQueue.js';
import type { SessionData, Tool } from '../../types.js';

// Mock Redis avec simulation complète des fonctionnalités
const mockRedisClientInstance = {
  publish: vi.fn(),
  duplicate: vi.fn(() => ({
    on: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    quit: vi.fn(),
    psubscribe: vi.fn(),
    punsubscribe: vi.fn(),
  })),
  set: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
  exists: vi.fn(),
  expire: vi.fn(),
  hset: vi.fn(),
  hget: vi.fn(),
  hgetall: vi.fn(),
  lpush: vi.fn(),
  rpop: vi.fn(),
  llen: vi.fn(),
  quit: vi.fn(),
};

// Mocks globaux
vi.mock('../../config.js', () => ({
  config: {
    AGENT_MAX_ITERATIONS: 5,
    LLM_PROVIDER_HIERARCHY: ['openai', 'anthropic'],
    REDIS_URL: 'redis://localhost:6379',
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
  getRedisClientInstance: () => mockRedisClientInstance,
}));

vi.mock('../../utils/llmProvider.js', () => ({
  getLlmProvider: () => ({
    getLlmResponse: vi.fn().mockResolvedValue('{"answer": "Redis test response"}'),
  }),
}));

vi.mock('../llm/LlmKeyManager.js', () => ({
  LlmKeyManager: {
    hasAvailableKeys: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('../tools/toolRegistry.js', () => ({
  toolRegistry: {
    execute: vi.fn(),
  },
}));

vi.mock('./orchestrator.prompt.js', () => ({
  getMasterPrompt: vi.fn().mockReturnValue('Mock prompt'),
}));

vi.mock('./responseSchema.js', () => ({
  llmResponseSchema: {
    parse: vi.fn().mockReturnValue({ answer: 'Redis test response' }),
  },
}));

describe('Redis Communication Integration Tests', () => {
  let mockJob: any;
  let mockSessionData: SessionData;
  let mockSessionManager: any;
  let mockTools: Tool[];
  let agent: Agent;

  beforeEach(() => {
    vi.clearAllMocks();

    mockJob = {
      id: 'redis-test-job',
      data: { prompt: 'Test Redis communication' },
      isFailed: vi.fn().mockResolvedValue(false),
      updateProgress: vi.fn(),
    };

    mockSessionData = {
      history: [],
      identities: [{ id: 'test-user', type: 'user' }],
      name: 'Redis Test Session',
      timestamp: Date.now(),
      activeLlmProvider: 'openai',
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
      mockSessionManager
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Agent Progress Broadcasting', () => {
    it('should publish progress updates to Redis', async () => {
      await agent.run();

      expect(mockRedisClientInstance.publish).toHaveBeenCalled();
      const publishCalls = mockRedisClientInstance.publish.mock.calls;
      
      // Vérifier qu'au moins un appel de progress a été fait
      const progressCalls = publishCalls.filter(call => 
        call[0] && call[0].includes('progress')
      );
      expect(progressCalls.length).toBeGreaterThan(0);
    });

    it('should publish agent status changes', async () => {
      await agent.run();

      expect(mockRedisClientInstance.publish).toHaveBeenCalledWith(
        expect.stringContaining('agent'),
        expect.stringContaining('status')
      );
    });

    it('should publish conversation updates in real-time', async () => {
      await agent.run();

      const publishCalls = mockRedisClientInstance.publish.mock.calls;
      const conversationUpdates = publishCalls.filter(call =>
        call[1] && JSON.parse(call[1]).type === 'conversation_update'
      );
      
      expect(conversationUpdates.length).toBeGreaterThan(0);
    });
  });

  describe('Agent Interruption via Redis', () => {
    it('should set up Redis subscription for interruption signals', async () => {
      const mockDuplicate = mockRedisClientInstance.duplicate();
      
      await agent.run();

      expect(mockRedisClientInstance.duplicate).toHaveBeenCalled();
      expect(mockDuplicate.on).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockDuplicate.subscribe).toHaveBeenCalledWith(
        expect.stringContaining('interrupt')
      );
    });

    it('should handle interruption signal gracefully', async () => {
      const mockDuplicate = mockRedisClientInstance.duplicate();
      let interruptHandler: Function;

      mockDuplicate.on.mockImplementation((event: string, handler: Function) => {
        if (event === 'message') {
          interruptHandler = handler;
        }
      });

      const runPromise = agent.run();

      // Simuler un signal d'interruption
      setTimeout(() => {
        if (interruptHandler) {
          interruptHandler('interrupt:redis-test-job', JSON.stringify({ action: 'stop' }));
        }
      }, 10);

      const result = await runPromise;
      expect(result).toContain('interrupted');
    });

    it('should clean up Redis subscriptions on completion', async () => {
      const mockDuplicate = mockRedisClientInstance.duplicate();

      await agent.run();

      expect(mockDuplicate.unsubscribe).toHaveBeenCalled();
      expect(mockDuplicate.quit).toHaveBeenCalled();
    });
  });

  describe('Session Synchronization via Redis', () => {
    it('should cache session data in Redis', async () => {
      await agent.run();

      expect(mockRedisClientInstance.hset).toHaveBeenCalledWith(
        expect.stringContaining('session:redis-test-session'),
        expect.any(Object)
      );
    });

    it('should publish session updates to subscribers', async () => {
      await agent.run();

      const publishCalls = mockRedisClientInstance.publish.mock.calls;
      const sessionUpdates = publishCalls.filter(call =>
        call[0].includes('session') && call[0].includes('redis-test-session')
      );

      expect(sessionUpdates.length).toBeGreaterThan(0);
    });

    it('should handle Redis connection failures gracefully', async () => {
      mockRedisClientInstance.publish.mockRejectedValue(new Error('Redis connection failed'));

      const result = await agent.run();
      
      // Agent should continue working even if Redis fails
      expect(result).toBe('Redis test response');
    });
  });

  describe('Multi-Agent Coordination via Redis', () => {
    it('should publish agent availability status', async () => {
      await agent.run();

      expect(mockRedisClientInstance.publish).toHaveBeenCalledWith(
        'agents:status',
        expect.stringContaining('available')
      );
    });

    it('should subscribe to cross-agent communication channels', async () => {
      const mockDuplicate = mockRedisClientInstance.duplicate();

      await agent.run();

      expect(mockDuplicate.subscribe).toHaveBeenCalledWith(
        expect.stringContaining('agents:broadcast')
      );
    });

    it('should handle agent coordination messages', async () => {
      const mockDuplicate = mockRedisClientInstance.duplicate();
      let messageHandler: Function;

      mockDuplicate.on.mockImplementation((event: string, handler: Function) => {
        if (event === 'message') {
          messageHandler = handler;
        }
      });

      const runPromise = agent.run();

      // Simuler un message de coordination
      setTimeout(() => {
        if (messageHandler) {
          messageHandler('agents:broadcast', JSON.stringify({
            type: 'resource_request',
            requesterId: 'other-agent',
            resource: 'llm_provider'
          }));
        }
      }, 10);

      await runPromise;

      // Vérifier que l'agent a publié une réponse
      expect(mockRedisClientInstance.publish).toHaveBeenCalledWith(
        expect.stringContaining('agents:response'),
        expect.any(String)
      );
    });
  });

  describe('Real-time Analytics via Redis', () => {
    it('should publish performance metrics', async () => {
      await agent.run();

      const publishCalls = mockRedisClientInstance.publish.mock.calls;
      const metricsCalls = publishCalls.filter(call =>
        call[0].includes('metrics') || call[0].includes('analytics')
      );

      expect(metricsCalls.length).toBeGreaterThan(0);
    });

    it('should track conversation quality metrics', async () => {
      await agent.run();

      expect(mockRedisClientInstance.lpush).toHaveBeenCalledWith(
        expect.stringContaining('conversation_metrics'),
        expect.stringContaining('quality_score')
      );
    });

    it('should monitor resource usage and publish alerts', async () => {
      // Simuler une utilisation élevée des ressources
      const highMemoryUsage = { memoryUsage: '95%', cpuUsage: '90%' };
      
      await agent.run();

      expect(mockRedisClientInstance.publish).toHaveBeenCalledWith(
        'alerts:resource_usage',
        expect.stringContaining('memory')
      );
    });
  });

  describe('Error Recovery via Redis', () => {
    it('should publish error notifications to monitoring channel', async () => {
      const mockLlmProvider = require('../../utils/llmProvider.js').getLlmProvider();
      mockLlmProvider.getLlmResponse.mockRejectedValue(new Error('LLM Provider failed'));

      await agent.run();

      expect(mockRedisClientInstance.publish).toHaveBeenCalledWith(
        'errors:agent',
        expect.stringContaining('LLM Provider failed')
      );
    });

    it('should maintain error state in Redis for debugging', async () => {
      const mockLlmProvider = require('../../utils/llmProvider.js').getLlmProvider();
      mockLlmProvider.getLlmResponse.mockRejectedValue(new Error('Test error'));

      await agent.run();

      expect(mockRedisClientInstance.hset).toHaveBeenCalledWith(
        expect.stringContaining('error_state'),
        expect.objectContaining({
          timestamp: expect.any(String),
          error: expect.stringContaining('Test error')
        })
      );
    });

    it('should coordinate with other agents during recovery', async () => {
      const mockLlmProvider = require('../../utils/llmProvider.js').getLlmProvider();
      mockLlmProvider.getLlmResponse.mockRejectedValue(new Error('Provider overload'));

      await agent.run();

      // Agent should signal other agents about provider issues
      expect(mockRedisClientInstance.publish).toHaveBeenCalledWith(
        'agents:provider_status',
        expect.stringContaining('overload')
      );
    });
  });

  describe('Load Balancing via Redis', () => {
    it('should register agent capacity in Redis', async () => {
      await agent.run();

      expect(mockRedisClientInstance.hset).toHaveBeenCalledWith(
        'agents:capacity',
        expect.any(String),
        expect.stringContaining('available_slots')
      );
    });

    it('should participate in distributed job assignment', async () => {
      await agent.run();

      expect(mockRedisClientInstance.lpush).toHaveBeenCalledWith(
        'job_queue:available_agents',
        expect.stringContaining('redis-test-job')
      );
    });

    it('should handle job redistribution requests', async () => {
      const mockDuplicate = mockRedisClientInstance.duplicate();
      let redistributionHandler: Function;

      mockDuplicate.on.mockImplementation((event: string, handler: Function) => {
        if (event === 'message') {
          redistributionHandler = handler;
        }
      });

      const runPromise = agent.run();

      // Simuler une demande de redistribution
      setTimeout(() => {
        if (redistributionHandler) {
          redistributionHandler('load_balancer:redistribute', JSON.stringify({
            sourceAgent: 'overloaded-agent',
            jobId: 'transfer-job-123'
          }));
        }
      }, 10);

      await runPromise;

      expect(mockRedisClientInstance.publish).toHaveBeenCalledWith(
        'load_balancer:response',
        expect.stringContaining('capacity_available')
      );
    });
  });
});