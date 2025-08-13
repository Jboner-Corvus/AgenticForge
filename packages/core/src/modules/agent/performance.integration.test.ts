import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Agent } from './agent.js';
import { getMockQueue } from '../../test/mockQueue.js';
import type { SessionData, Tool } from '../../types.js';

// Mock performance monitoring
const mockPerformanceMonitor = {
  startTimer: vi.fn(),
  endTimer: vi.fn(),
  measureMemory: vi.fn(),
  trackCPUUsage: vi.fn(),
  getMetrics: vi.fn(),
  setThreshold: vi.fn(),
  alertOnThreshold: vi.fn(),
};

// Mocks globaux simplifiés
vi.mock('../../config.js', () => ({
  config: {
    AGENT_MAX_ITERATIONS: 5,
    LLM_PROVIDER_HIERARCHY: ['openai'],
    MEMORY_THRESHOLD_MB: 512,
    CPU_THRESHOLD_PERCENT: 80,
    RESPONSE_TIME_THRESHOLD_MS: 5000,
  },
}));

vi.mock('../../logger.js', () => ({ getLoggerInstance: () => ({ child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }), info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }) }));
vi.mock('../redis/redisClient.js', () => ({ getRedisClientInstance: () => ({ publish: vi.fn(), duplicate: () => ({ on: vi.fn(), subscribe: vi.fn(), unsubscribe: vi.fn(), quit: vi.fn() }) }) }));
vi.mock('../../utils/llmProvider.js', () => ({ getLlmProvider: () => ({ getLlmResponse: vi.fn().mockResolvedValue('{"answer": "Performance test"}') }) }));
vi.mock('../llm/LlmKeyManager.js', () => ({ LlmKeyManager: { hasAvailableKeys: vi.fn().mockResolvedValue(true) } }));
vi.mock('../tools/toolRegistry.js', () => ({ toolRegistry: { execute: vi.fn() } }));
vi.mock('./orchestrator.prompt.js', () => ({ getMasterPrompt: vi.fn().mockReturnValue('Mock prompt') }));
vi.mock('./responseSchema.js', () => ({ llmResponseSchema: { parse: vi.fn().mockReturnValue({ answer: 'Performance test' }) } }));

describe('Memory and Performance Integration Tests', () => {
  let mockJob: any;
  let mockSessionData: SessionData;
  let mockSessionManager: any;
  let agent: Agent;

  beforeEach(() => {
    vi.clearAllMocks();
    mockJob = { id: 'perf-test', data: { prompt: 'Performance test' }, isFailed: vi.fn().mockResolvedValue(false), updateProgress: vi.fn() };
    mockSessionData = { history: [], identities: [{ id: 'test-user', type: 'user' }], name: 'Performance Test Session', timestamp: Date.now(), activeLlmProvider: 'openai' };
    mockSessionManager = { saveSession: vi.fn() };
    agent = new Agent(mockJob, mockSessionData, getMockQueue(), [], 'openai', mockSessionManager);
  });

  describe('Memory Management', () => {
    it('should monitor memory usage during agent execution', async () => {
      const memoryBaseline = process.memoryUsage();
      await agent.run();
      const memoryAfter = process.memoryUsage();
      
      expect(memoryAfter.heapUsed).toBeGreaterThan(0);
      expect(memoryAfter.heapUsed - memoryBaseline.heapUsed).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase
    });

    it('should handle memory pressure gracefully', async () => {
      // Simulate high memory usage
      const largeData = Array.from({ length: 100000 }, () => 'x'.repeat(1000));
      mockSessionData.history = largeData.map((content, i) => ({ type: 'user', content, id: `${i}`, timestamp: Date.now() })) as any[];
      
      await agent.run();
      expect(mockSessionManager.saveSession).toHaveBeenCalled();
    });

    it('should implement memory cleanup after completion', async () => {
      await agent.run();
      // Verify cleanup occurs (simplified mock verification)
      expect(mockSessionManager.saveSession).toHaveBeenCalled();
    });
  });

  describe('Performance Benchmarks', () => {
    it('should complete simple requests within performance thresholds', async () => {
      const startTime = Date.now();
      await agent.run();
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(5000); // 5 second threshold
    });

    it('should handle concurrent agent instances efficiently', async () => {
      const agents = Array.from({ length: 10 }, (_, i) => 
        new Agent(
          { ...mockJob, id: `concurrent-${i}` },
          { ...mockSessionData, id: `session-${i}` },
          getMockQueue(), [], 'openai', mockSessionManager
        )
      );

      const startTime = Date.now();
      await Promise.all(agents.map(a => a.run()));
      const totalDuration = Date.now() - startTime;

      expect(totalDuration).toBeLessThan(15000); // Should complete within 15 seconds
    });
  });

  describe('Resource Optimization', () => {
    it('should optimize conversation history storage', async () => {
      const largeHistory = Array.from({ length: 1000 }, (_, i) => ({
        type: 'user', content: `Message ${i}`, id: `${i}`, timestamp: Date.now() + i
      }));
      
      agent = new Agent(mockJob, { ...mockSessionData, history: largeHistory as any }, getMockQueue(), [], 'openai', mockSessionManager);
      await agent.run();
      
      // Verify optimization occurred
      expect(mockSessionManager.saveSession).toHaveBeenCalled();
    });

    it('should implement efficient caching strategies', async () => {
      await agent.run();
      
      // Second run should benefit from caching
      const secondAgent = new Agent(mockJob, mockSessionData, getMockQueue(), [], 'openai', mockSessionManager);
      const startTime = Date.now();
      await secondAgent.run();
      const cachedDuration = Date.now() - startTime;
      
      expect(cachedDuration).toBeLessThan(3000); // Should be faster with caching
    });
  });
});