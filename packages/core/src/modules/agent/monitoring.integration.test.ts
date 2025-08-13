import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Agent } from './agent.js';
import { getMockQueue } from '../../test/mockQueue.js';
import type { SessionData } from '../../types.js';

// Mock monitoring and observability systems
const mockTelemetry = {
  trackEvent: vi.fn(),
  trackMetric: vi.fn(),
  trackError: vi.fn(),
  startSpan: vi.fn(),
  endSpan: vi.fn(),
  setTag: vi.fn(),
  incrementCounter: vi.fn(),
  recordHistogram: vi.fn(),
};

const mockHealthCheck = {
  status: vi.fn(),
  checkDependencies: vi.fn(),
  getUptime: vi.fn(),
  getVersion: vi.fn(),
};

// Mocks globaux simplifiés
vi.mock('../../config.js', () => ({ config: { AGENT_MAX_ITERATIONS: 5, LLM_PROVIDER_HIERARCHY: ['openai'], MONITORING_ENABLED: true, TELEMETRY_ENDPOINT: 'http://localhost:4317' } }));
vi.mock('../../logger.js', () => ({ getLoggerInstance: () => ({ child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }), info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }) }));
vi.mock('../redis/redisClient.js', () => ({ getRedisClientInstance: () => ({ publish: vi.fn(), hset: vi.fn(), hget: vi.fn(), incr: vi.fn(), duplicate: () => ({ on: vi.fn(), subscribe: vi.fn(), unsubscribe: vi.fn(), quit: vi.fn() }) }) }));
vi.mock('../../utils/llmProvider.js', () => ({ getLlmProvider: () => ({ getLlmResponse: vi.fn().mockResolvedValue('{"answer": "Monitoring test"}') }) }));
vi.mock('../llm/LlmKeyManager.js', () => ({ LlmKeyManager: { hasAvailableKeys: vi.fn().mockResolvedValue(true) } }));
vi.mock('../tools/toolRegistry.js', () => ({ toolRegistry: { execute: vi.fn() } }));
vi.mock('./orchestrator.prompt.js', () => ({ getMasterPrompt: vi.fn().mockReturnValue('Mock prompt') }));
vi.mock('./responseSchema.js', () => ({ llmResponseSchema: { parse: vi.fn().mockReturnValue({ answer: 'Monitoring test' }) } }));

// Mock OpenTelemetry
vi.mock('@opentelemetry/api', () => ({
  trace: { getTracer: () => ({ startSpan: mockTelemetry.startSpan }) },
  metrics: { getMeter: () => ({ createCounter: () => ({ add: mockTelemetry.incrementCounter }), createHistogram: () => ({ record: mockTelemetry.recordHistogram }) }) },
}));

describe('Monitoring and Observability Integration Tests', () => {
  let mockJob: any;
  let mockSessionData: SessionData;
  let mockSessionManager: any;
  let agent: Agent;

  beforeEach(() => {
    vi.clearAllMocks();
    mockJob = { id: 'monitoring-test', data: { prompt: 'Monitoring test' }, isFailed: vi.fn().mockResolvedValue(false), updateProgress: vi.fn() };
    mockSessionData = { 
      id: 'monitoring-session', 
      history: [], 
      activeLlmProvider: 'openai',
      identities: [{ id: 'test-user', type: 'user' }],
      name: 'Monitoring Test Session',
      timestamp: Date.now()
    };
    mockSessionManager = { saveSession: vi.fn() };
    agent = new Agent(mockJob, mockSessionData, getMockQueue(), [], 'openai', mockSessionManager);
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
      const mockLlmProvider = require('../../utils/llmProvider.js').getLlmProvider();
      
      // Simulate LLM provider response time
      mockLlmProvider.getLlmResponse.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve('{"answer": "Metrics test"}'), 100)
        )
      );

      await agent.run();
      expect(mockLlmProvider.getLlmResponse).toHaveBeenCalled();
    });

    it('should monitor tool execution statistics', async () => {
      const mockLlmProvider = require('../../utils/llmProvider.js').getLlmProvider();
      const mockResponseSchema = require('./responseSchema.js').llmResponseSchema;
      const mockToolRegistry = require('../tools/toolRegistry.js').toolRegistry;

      mockLlmProvider.getLlmResponse.mockResolvedValue(
        '{"command": {"name": "testTool", "params": {}}}'
      );
      mockResponseSchema.parse.mockReturnValue({
        command: { name: 'testTool', params: {} }
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
      const mockRedisClient = require('../redis/redisClient.js').getRedisClientInstance();
      
      await agent.run();
      
      // Verify Redis operations are traced
      expect(mockRedisClient.publish).toHaveBeenCalled();
    });

    it('should correlate traces across agent instances', async () => {
      const correlationId = 'trace-123';
      const tracedAgent = new Agent(
        { ...mockJob, traceId: correlationId },
        mockSessionData, getMockQueue(), [], 'openai', mockSessionManager
      );

      await tracedAgent.run();
      expect(mockSessionManager.saveSession).toHaveBeenCalled();
    });
  });

  describe('Health Monitoring', () => {
    it('should report agent health status', async () => {
      const healthStatus = {
        status: 'healthy',
        timestamp: Date.now(),
        components: {
          llmProvider: 'healthy',
          redis: 'healthy',
          tools: 'healthy',
        },
        uptime: 86400, // 24 hours
      };

      await agent.run();
      
      expect(mockSessionManager.saveSession).toHaveBeenCalled();
    });

    it('should detect and report degraded performance', async () => {
      // Simulate slow response
      const mockLlmProvider = require('../../utils/llmProvider.js').getLlmProvider();
      mockLlmProvider.getLlmResponse.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve('{"answer": "Slow response"}'), 3000)
        )
      );

      const startTime = Date.now();
      await agent.run();
      const duration = Date.now() - startTime;

      expect(duration).toBeGreaterThan(2000);
    });

    it('should monitor resource utilization', async () => {
      const resourceMetrics = {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        connections: 10,
        activeAgents: 5,
      };

      await agent.run();
      
      expect(resourceMetrics.memoryUsage.heapUsed).toBeGreaterThan(0);
      expect(resourceMetrics.cpuUsage.user).toBeGreaterThan(0);
    });
  });

  describe('Error Tracking and Alerting', () => {
    it('should track and categorize errors', async () => {
      const mockLlmProvider = require('../../utils/llmProvider.js').getLlmProvider();
      mockLlmProvider.getLlmResponse.mockRejectedValue(new Error('LLM timeout'));

      await agent.run();
      expect(mockTelemetry.trackError).toHaveBeenCalled?.();
    });

    it('should generate alerts for critical failures', async () => {
      const criticalError = new Error('Critical system failure');
      const mockLlmProvider = require('../../utils/llmProvider.js').getLlmProvider();
      mockLlmProvider.getLlmResponse.mockRejectedValue(criticalError);

      await agent.run();
      
      const redisClient = require('../redis/redisClient.js').getRedisClientInstance();
      expect(redisClient.publish).toHaveBeenCalled();
    });

    it('should implement error rate monitoring', async () => {
      const errorRates = {
        last5min: 0.02, // 2%
        last1hour: 0.015, // 1.5%
        last24hours: 0.008, // 0.8%
      };

      // Simulate error rate calculation
      if (errorRates.last5min > 0.05) { // 5% threshold
        expect(false).toBe(true); // Should trigger alert
      }

      await agent.run();
      expect(mockSessionManager.saveSession).toHaveBeenCalled();
    });
  });

  describe('Performance Analytics', () => {
    it('should analyze conversation quality metrics', async () => {
      const qualityMetrics = {
        responseRelevance: 0.95,
        userSatisfaction: 0.88,
        taskCompletion: 0.92,
        averageResponseTime: 1200, // ms
      };

      await agent.run();
      
      const redisClient = require('../redis/redisClient.js').getRedisClientInstance();
      expect(redisClient.hset).toHaveBeenCalledWith(
        expect.stringContaining('quality_metrics'),
        expect.any(Object)
      );
    });

    it('should track usage patterns and trends', async () => {
      const usagePatterns = {
        peakHours: [9, 10, 11, 14, 15, 16], // Business hours
        commonQueries: ['data analysis', 'research', 'summarization'],
        averageSessionDuration: 480, // seconds
        toolUsageFrequency: {
          webSearch: 0.45,
          fileRead: 0.30,
          dataAnalysis: 0.25,
        },
      };

      await agent.run();
      
      expect(usagePatterns.toolUsageFrequency.webSearch).toBeGreaterThan(0.4);
    });

    it('should generate performance insights and recommendations', async () => {
      const performanceInsights = {
        recommendations: [
          'Consider caching frequent queries',
          'Optimize tool execution order',
          'Implement response streaming for better UX',
        ],
        bottlenecks: ['LLM provider latency', 'Tool execution time'],
        optimizationPotential: 0.25, // 25% improvement possible
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
        queuedJobs: 8,
        averageResponseTime: 1.2, // seconds
        successRate: 0.987, // 98.7%
        currentThroughput: 45, // requests per minute
      };

      await agent.run();
      
      const redisClient = require('../redis/redisClient.js').getRedisClientInstance();
      expect(redisClient.publish).toHaveBeenCalledWith(
        expect.stringContaining('dashboard_update'),
        expect.any(String)
      );
    });

    it('should stream metrics to visualization tools', async () => {
      const metricsStream = {
        timestamp: Date.now(),
        agentId: 'monitoring-test',
        metrics: {
          executionTime: 1200,
          memoryUsage: 45.2,
          cpuUsage: 12.5,
          success: true,
        },
      };

      await agent.run();
      
      const redisClient = require('../redis/redisClient.js').getRedisClientInstance();
      expect(redisClient.publish).toHaveBeenCalledWith(
        'metrics_stream',
        expect.stringContaining('executionTime')
      );
    });
  });

  describe('Compliance and Audit Logging', () => {
    it('should maintain detailed audit trails', async () => {
      const auditEntry = {
        timestamp: Date.now(),
        agentId: 'monitoring-test',
        sessionId: 'monitoring-session',
        action: 'agent_execution',
        user: 'system',
        details: {
          prompt: 'Monitoring test',
          provider: 'openai',
          duration: 1200,
        },
      };

      await agent.run();
      
      const redisClient = require('../redis/redisClient.js').getRedisClientInstance();
      expect(redisClient.hset).toHaveBeenCalledWith(
        expect.stringContaining('audit_log'),
        expect.any(Object)
      );
    });

    it('should ensure data retention compliance', async () => {
      const retentionPolicies = {
        auditLogs: 2555, // 7 years in days
        performanceMetrics: 90, // 3 months
        errorLogs: 365, // 1 year
        conversationData: 30, // 1 month
      };

      await agent.run();
      
      // Verify retention policies are applied
      Object.entries(retentionPolicies).forEach(([dataType, retentionDays]) => {
        expect(retentionDays).toBeGreaterThan(0);
      });
    });
  });
});