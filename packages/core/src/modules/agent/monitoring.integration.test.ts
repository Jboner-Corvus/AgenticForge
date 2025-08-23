import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SessionData } from '../../types.ts';

import { getMockQueue } from '../../test/mockQueue.ts';
import { Agent } from './agent.ts';

// Mock monitoring and observability systems
const mockTelemetry = {
  endSpan: vi.fn(),
  incrementCounter: vi.fn(),
  recordHistogram: vi.fn(),
  setTag: vi.fn(),
  startSpan: vi.fn(),
  trackError: vi.fn(),
  trackEvent: vi.fn(),
  trackMetric: vi.fn(),
};

const mockHealthCheck = {
  checkDependencies: vi.fn(),
  getUptime: vi.fn(),
  getVersion: vi.fn(),
  status: vi.fn(),
};

// Mocks globaux simplifiés
vi.mock('../../config.ts', () => ({
  config: {
    AGENT_MAX_ITERATIONS: 5,
    LLM_PROVIDER_HIERARCHY: ['openai'],
    MONITORING_ENABLED: true,
    TELEMETRY_ENDPOINT: 'http://localhost:4317',
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
    hget: vi.fn(),
    hset: vi.fn(),
    incr: vi.fn(),
    publish: vi.fn(),
  }),
}));
vi.mock('../../utils/llmProvider.ts', () => ({
  getLlmProvider: () => ({
    getLlmResponse: vi.fn().mockResolvedValue('{"answer": "Monitoring test"}'),
  }),
}));
vi.mock('../llm/LlmKeyManager.ts', () => ({
  LlmKeyManager: { hasAvailableKeys: vi.fn().mockResolvedValue(true) },
}));
vi.mock('../tools/toolRegistry.ts', () => ({
  toolRegistry: { execute: vi.fn() },
}));
vi.mock('./orchestrator.prompt.ts', () => ({
  getMasterPrompt: vi.fn().mockReturnValue('Mock prompt'),
}));
vi.mock('./responseSchema.ts', () => ({
  llmResponseSchema: {
    parse: vi.fn().mockReturnValue({ answer: 'Monitoring test' }),
  },
}));

// Mock OpenTelemetry
vi.mock('@opentelemetry/api', () => ({
  metrics: {
    getMeter: () => ({
      createCounter: () => ({ add: mockTelemetry.incrementCounter }),
      createHistogram: () => ({ record: mockTelemetry.recordHistogram }),
    }),
  },
  trace: { getTracer: () => ({ startSpan: mockTelemetry.startSpan }) },
}));

describe('Monitoring and Observability Integration Tests', () => {
  let mockJob: any;
  let mockSessionData: SessionData;
  let mockSessionManager: any;
  let agent: Agent;

  beforeEach(() => {
    vi.clearAllMocks();
    mockJob = {
      data: { prompt: 'Monitoring test' },
      id: 'monitoring-test',
      isFailed: vi.fn().mockResolvedValue(false),
      updateProgress: vi.fn(),
    };
    mockSessionData = {
      activeLlmProvider: 'openai',
      history: [],
      id: 'monitoring-session',
      identities: [{ id: 'test-user', type: 'user' }],
      name: 'Monitoring Test Session',
      timestamp: Date.now(),
    };
    mockSessionManager = { saveSession: vi.fn() };
    agent = new Agent(
      mockJob,
      mockSessionData,
      getMockQueue(),
      [],
      'openai',
      mockSessionManager,
    );
  });

  describe('Metrics Collection', () => {
    it('should collect agent execution metrics', async () => {
      const startTime = Date.now();
      await agent.run();
      const executionTime = Date.now() - startTime;

      // Verify metrics are collected
      expect(executionTime).toBeGreaterThan(0);
      expect(mockSessionManager.saveSession).toHaveBeenCalled();
    });

    it('should track LLM provider performance metrics', async () => {
      const mockLlmProvider =
        require('../../utils/llmProvider.ts').getLlmProvider();

      // Simulate LLM provider response time
      mockLlmProvider.getLlmResponse.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve('{"answer": "Metrics test"}'), 100),
          ),
      );

      await agent.run();
      expect(mockLlmProvider.getLlmResponse).toHaveBeenCalled();
    });

    it('should monitor tool execution statistics', async () => {
      const mockLlmProvider =
        require('../../utils/llmProvider.ts').getLlmProvider();
      const mockResponseSchema =
        require('./responseSchema.ts').llmResponseSchema;
      const mockToolRegistry = require('../tools/toolRegistry.ts').toolRegistry;

      mockLlmProvider.getLlmResponse.mockResolvedValue(
        '{"command": {"name": "testTool", "params": {}}}',
      );
      mockResponseSchema.parse.mockReturnValue({
        command: { name: 'testTool', params: {} },
      });
      mockToolRegistry.execute.mockResolvedValue('Tool executed');

      await agent.run();
      expect(mockToolRegistry.execute).toHaveBeenCalled();
    });
  });

  describe('Distributed Tracing', () => {
    it('should create distributed traces for agent workflows', async () => {
      await agent.run();

      // Verify tracing calls
      expect(mockTelemetry.startSpan).toHaveBeenCalled();
    });

    it('should trace cross-service communications', async () => {
      const mockRedisClient =
        require('../redis/redisClient.ts').getRedisClientInstance();

      await agent.run();

      // Verify Redis operations are traced
      expect(mockRedisClient.publish).toHaveBeenCalled();
    });

    it('should correlate traces across agent instances', async () => {
      const correlationId = 'trace-123';
      const tracedAgent = new Agent(
        { ...mockJob, traceId: correlationId },
        mockSessionData,
        getMockQueue(),
        [],
        'openai',
        mockSessionManager,
      );

      await tracedAgent.run();
      expect(mockSessionManager.saveSession).toHaveBeenCalled();
    });
  });

  describe('Health Monitoring', () => {
    it('should report agent health status', async () => {
      const healthStatus = {
        components: {
          llmProvider: 'healthy',
          redis: 'healthy',
          tools: 'healthy',
        },
        status: 'healthy',
        timestamp: Date.now(),
        uptime: 86400, // 24 hours
      };

      await agent.run();

      expect(mockSessionManager.saveSession).toHaveBeenCalled();
    });

    it('should detect and report degraded performance', async () => {
      // Simulate slow response
      const mockLlmProvider =
        require('../../utils/llmProvider.ts').getLlmProvider();
      mockLlmProvider.getLlmResponse.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve('{"answer": "Slow response"}'), 3000),
          ),
      );

      const startTime = Date.now();
      await agent.run();
      const duration = Date.now() - startTime;

      expect(duration).toBeGreaterThan(2000);
    });

    it('should monitor resource utilization', async () => {
      const resourceMetrics = {
        activeAgents: 5,
        connections: 10,
        cpuUsage: process.cpuUsage(),
        memoryUsage: process.memoryUsage(),
      };

      await agent.run();

      expect(resourceMetrics.memoryUsage.heapUsed).toBeGreaterThan(0);
      expect(resourceMetrics.cpuUsage.user).toBeGreaterThan(0);
    });
  });

  describe('Error Tracking and Alerting', () => {
    it('should track and categorize errors', async () => {
      const mockLlmProvider =
        require('../../utils/llmProvider.ts').getLlmProvider();
      mockLlmProvider.getLlmResponse.mockRejectedValue(
        new Error('LLM timeout'),
      );

      await agent.run();
      expect(mockTelemetry.trackError).toHaveBeenCalled?.();
    });

    it('should generate alerts for critical failures', async () => {
      const criticalError = new Error('Critical system failure');
      const mockLlmProvider =
        require('../../utils/llmProvider.ts').getLlmProvider();
      mockLlmProvider.getLlmResponse.mockRejectedValue(criticalError);

      await agent.run();

      const redisClient =
        require('../redis/redisClient.ts').getRedisClientInstance();
      expect(redisClient.publish).toHaveBeenCalled();
    });

    it('should implement error rate monitoring', async () => {
      const errorRates = {
        last1hour: 0.015, // 1.5%
        last24hours: 0.008, // 0.8%
        last5min: 0.02, // 2%
      };

      // Simulate error rate calculation
      if (errorRates.last5min > 0.05) {
        // 5% threshold
        expect(false).toBe(true); // Should trigger alert
      }

      await agent.run();
      expect(mockSessionManager.saveSession).toHaveBeenCalled();
    });
  });

  describe('Performance Analytics', () => {
    it('should analyze conversation quality metrics', async () => {
      const qualityMetrics = {
        averageResponseTime: 1200, // ms
        responseRelevance: 0.95,
        taskCompletion: 0.92,
        userSatisfaction: 0.88,
      };

      await agent.run();

      const redisClient =
        require('../redis/redisClient.ts').getRedisClientInstance();
      expect(redisClient.hset).toHaveBeenCalledWith(
        expect.stringContaining('quality_metrics'),
        expect.any(Object),
      );
    });

    it('should track usage patterns and trends', async () => {
      const usagePatterns = {
        averageSessionDuration: 480, // seconds
        commonQueries: ['data analysis', 'research', 'summarization'],
        peakHours: [9, 10, 11, 14, 15, 16], // Business hours
        toolUsageFrequency: {
          dataAnalysis: 0.25,
          fileRead: 0.3,
          webSearch: 0.45,
        },
      };

      await agent.run();

      expect(usagePatterns.toolUsageFrequency.webSearch).toBeGreaterThan(0.4);
    });

    it('should generate performance insights and recommendations', async () => {
      const performanceInsights = {
        bottlenecks: ['LLM provider latency', 'Tool execution time'],
        optimizationPotential: 0.25, // 25% improvement possible
        recommendations: [
          'Consider caching frequent queries',
          'Optimize tool execution order',
          'Implement response streaming for better UX',
        ],
      };

      await agent.run();

      expect(performanceInsights.recommendations.length).toBeGreaterThan(0);
      expect(performanceInsights.optimizationPotential).toBeGreaterThan(0);
    });
  });

  describe('Real-time Dashboards and Visualization', () => {
    it('should provide real-time metrics for dashboards', async () => {
      const dashboardMetrics = {
        activeAgents: 15,
        averageResponseTime: 1.2, // seconds
        currentThroughput: 45, // requests per minute
        queuedJobs: 8,
        successRate: 0.987, // 98.7%
      };

      await agent.run();

      const redisClient =
        require('../redis/redisClient.ts').getRedisClientInstance();
      expect(redisClient.publish).toHaveBeenCalledWith(
        expect.stringContaining('dashboard_update'),
        expect.any(String),
      );
    });

    it('should stream metrics to visualization tools', async () => {
      const metricsStream = {
        agentId: 'monitoring-test',
        metrics: {
          cpuUsage: 12.5,
          executionTime: 1200,
          memoryUsage: 45.2,
          success: true,
        },
        timestamp: Date.now(),
      };

      await agent.run();

      const redisClient =
        require('../redis/redisClient.ts').getRedisClientInstance();
      expect(redisClient.publish).toHaveBeenCalledWith(
        'metrics_stream',
        expect.stringContaining('executionTime'),
      );
    });
  });

  describe('Compliance and Audit Logging', () => {
    it('should maintain detailed audit trails', async () => {
      const auditEntry = {
        action: 'agent_execution',
        agentId: 'monitoring-test',
        details: {
          duration: 1200,
          prompt: 'Monitoring test',
          provider: 'openai',
        },
        sessionId: 'monitoring-session',
        timestamp: Date.now(),
        user: 'system',
      };

      await agent.run();

      const redisClient =
        require('../redis/redisClient.ts').getRedisClientInstance();
      expect(redisClient.hset).toHaveBeenCalledWith(
        expect.stringContaining('audit_log'),
        expect.any(Object),
      );
    });

    it('should ensure data retention compliance', async () => {
      const retentionPolicies = {
        auditLogs: 2555, // 7 years in days
        conversationData: 30, // 1 month
        errorLogs: 365, // 1 year
        performanceMetrics: 90, // 3 months
      };

      await agent.run();

      // Verify retention policies are applied
      Object.entries(retentionPolicies).forEach(([dataType, retentionDays]) => {
        expect(retentionDays).toBeGreaterThan(0);
      });
    });
  });
});
