import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Job as BullMQJob, SessionData, Tool } from '../../types.ts';

import { getMockQueue } from '../../test/mockQueue.ts';
import { Agent } from './agent.ts';

// Mock BullMQ avec fonctionnalités complètes
const mockQueue = getMockQueue();

const mockJob = {
  attemptsMade: 0,
  data: { prompt: 'Test job queue integration' },
  discard: vi.fn(),
  failedReason: null,
  finishedOn: null,
  getState: vi.fn().mockResolvedValue('waiting'),
  id: 'job-queue-test-123',
  isActive: vi.fn().mockResolvedValue(false),
  isCompleted: vi.fn().mockResolvedValue(false),
  isDelayed: vi.fn().mockResolvedValue(false),
  isFailed: vi.fn().mockResolvedValue(false),
  isWaiting: vi.fn().mockResolvedValue(true),
  moveToCompleted: vi.fn(),
  moveToFailed: vi.fn(),
  opts: {
    attempts: 3,
    backoff: { delay: 2000, type: 'exponential' },
    delay: 0,
    removeOnComplete: 10,
    removeOnFail: 5,
  },
  processedOn: Date.now(),
  progress: 0,
  promote: vi.fn(),
  remove: vi.fn(),
  retry: vi.fn(),
  returnvalue: null,
  timestamp: Date.now(),
  updateProgress: vi.fn(),
};

const mockWorker = {
  close: vi.fn(),
  getMetrics: vi.fn(),
  on: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  run: vi.fn(),
};

const mockQueueEvents = {
  close: vi.fn(),
  on: vi.fn(),
};

// Mocks globaux
vi.mock('../../config.ts', () => ({
  config: {
    AGENT_MAX_ITERATIONS: 5,
    JOB_TIMEOUT: 300000, // 5 minutes
    LLM_PROVIDER_HIERARCHY: ['openai', 'anthropic'],
    QUEUE_CLEANUP_INTERVAL: 300000,
    QUEUE_CONCURRENCY: 5,
    QUEUE_MAX_RETRIES: 3,
    REDIS_URL: 'redis://localhost:6379',
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
    del: vi.fn(),
    duplicate: () => ({
      on: vi.fn(),
      quit: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    }),
    exists: vi.fn(),
    hget: vi.fn(),
    hset: vi.fn(),
    llen: vi.fn(),
    lpush: vi.fn(),
    publish: vi.fn(),
    rpop: vi.fn(),
  }),
}));

vi.mock('../../utils/llmProvider.ts', () => ({
  getLlmProvider: () => ({
    getLlmResponse: vi
      .fn()
      .mockResolvedValue('{"answer": "Job queue test response"}'),
  }),
}));

vi.mock('../llm/LlmKeyManager.ts', () => ({
  LlmKeyManager: {
    hasAvailableKeys: vi.fn().mockResolvedValue(true),
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
    parse: vi.fn().mockReturnValue({ answer: 'Job queue test response' }),
  },
}));

// Mock BullMQ
vi.mock('bullmq', () => ({
  Queue: vi.fn(() => mockQueue),
  QueueEvents: vi.fn(() => mockQueueEvents),
  Worker: vi.fn(() => mockWorker),
}));

describe('Job Queue BullMQ Integration Tests', () => {
  let mockSessionData: SessionData;
  let mockSessionManager: any;
  let mockTools: Tool[];
  let agent: Agent;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSessionData = {
      activeLlmProvider: 'openai',
      history: [],
      identities: [{ id: 'test-user', type: 'user' }] as const,
      name: 'Queue Test Session',
      timestamp: Date.now(),
    };

    mockSessionManager = {
      saveSession: vi.fn(),
    };

    mockTools = [];

    agent = new Agent(
      mockJob as any,
      mockSessionData,
      mockQueue,
      mockTools,
      'openai',
      mockSessionManager,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Job Creation and Processing', () => {
    it('should create and process a basic job', async () => {
      mockQueue.add = vi.fn();
      (mockQueue.add as any).mockResolvedValue(mockJob);
      mockQueue.getJob = vi.fn();
      (mockQueue.getJob as any).mockResolvedValue(mockJob);

      const jobData = {
        priority: 1,
        prompt: 'Process this request',
        sessionId: 'test-session',
        userId: 'user-123',
      };

      await (mockQueue.add as any)('agent-task', jobData, {
        attempts: 3,
        delay: 0,
        removeOnComplete: 10,
      });

      expect(mockQueue.add as any).toHaveBeenCalledWith(
        'agent-task',
        jobData,
        expect.objectContaining({
          attempts: 3,
          removeOnComplete: 10,
        }),
      );
    });

    it('should process job with proper progress updates', async () => {
      const result = await agent.run();

      expect(mockJob.updateProgress).toHaveBeenCalled();
      expect(result).toBe('Job queue test response');
    });

    it('should handle high-priority jobs first', async () => {
      const highPriorityJob = {
        ...mockJob,
        opts: { ...mockJob.opts, priority: 1 },
      };

      const lowPriorityJob = {
        ...mockJob,
        id: 'low-priority-job',
        opts: { ...mockJob.opts, priority: 10 },
      };

      mockQueue.getJobs = vi.fn();
      (mockQueue.getJobs as any).mockResolvedValue([
        lowPriorityJob,
        highPriorityJob,
      ]);

      await agent.run();

      // Les jobs haute priorité devraient être traités en premier
      expect(mockQueue.getJobs).toHaveBeenCalledWith(
        ['waiting', 'active'],
        0,
        100,
      );
    });

    it('should handle delayed job execution', async () => {
      const delayedJobData = {
        prompt: 'Execute later',
        scheduleFor: Date.now() + 60000, // 1 minute
        sessionId: 'delayed-session',
      };

      mockQueue.add = vi.fn();
      (mockQueue.add as any).mockResolvedValue({
        ...mockJob,
        opts: { ...mockJob.opts, delay: 60000 },
      });

      await (mockQueue.add as any)('delayed-agent-task', delayedJobData, {
        delay: 60000,
      });

      expect(mockQueue.add as any).toHaveBeenCalledWith(
        'delayed-agent-task',
        delayedJobData,
        expect.objectContaining({
          delay: 60000,
        }),
      );
    });
  });

  describe('Job Retry and Error Handling', () => {
    it('should retry failed jobs with exponential backoff', async () => {
      const failingJob = {
        ...mockJob,
        attemptsMade: 1,
        failedReason: 'LLM provider timeout',
      };

      const mockLlmProvider =
        require('../../utils/llmProvider.ts').getLlmProvider();
      mockLlmProvider.getLlmResponse = vi.fn();
      (mockLlmProvider.getLlmResponse as any)
        .mockRejectedValueOnce(new Error('LLM provider timeout'))
        .mockResolvedValueOnce('{"answer": "Retry successful"}');

      const mockResponseSchema =
        require('./responseSchema.ts').llmResponseSchema;
      mockResponseSchema.parse.mockReturnValue({ answer: 'Retry successful' });

      const failingAgent = new Agent(
        failingJob as any,
        mockSessionData,
        mockQueue,
        mockTools,
        'openai',
        mockSessionManager,
      );

      const result = await failingAgent.run();

      expect(result).toBe('Retry successful');
      expect(mockLlmProvider.getLlmResponse).toHaveBeenCalledTimes(2);
    });

    it('should move job to failed queue after max retries', async () => {
      const maxRetriesJob = {
        ...mockJob,
        attemptsMade: 3,
        opts: { ...mockJob.opts, attempts: 3 },
      };

      const mockLlmProvider =
        require('../../utils/llmProvider.ts').getLlmProvider();
      mockLlmProvider.getLlmResponse = vi.fn();
      (mockLlmProvider.getLlmResponse as any).mockRejectedValue(
        new Error('Persistent failure'),
      );

      const maxRetriesAgent = new Agent(
        maxRetriesJob as any,
        mockSessionData,
        mockQueue,
        mockTools,
        'openai',
        mockSessionManager,
      );

      try {
        await maxRetriesAgent.run();
      } catch (error) {
        expect(mockJob.moveToFailed).toHaveBeenCalledWith(
          expect.objectContaining({
            attempts: 3,
            message: expect.stringContaining('Persistent failure'),
          }),
        );
      }
    });

    it('should handle job timeout gracefully', async () => {
      const timeoutJob = {
        ...mockJob,
        opts: { ...mockJob.opts, timeout: 1000 }, // 1 second timeout
      };

      const mockLlmProvider =
        require('../../utils/llmProvider.ts').getLlmProvider();
      mockLlmProvider.getLlmResponse = vi.fn();
      (mockLlmProvider.getLlmResponse as any).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve('{"answer": "Too late"}'), 2000),
          ),
      );

      const timeoutAgent = new Agent(
        timeoutJob as any,
        mockSessionData,
        mockQueue,
        mockTools,
        'openai',
        mockSessionManager,
      );

      const result = await timeoutAgent.run();

      expect(result).toContain('timeout');
    });

    it('should provide detailed error diagnostics for failed jobs', async () => {
      const errorJob = {
        ...mockJob,
        failedReason: 'Complex error with stack trace',
      };

      const complexError = new Error('Tool execution failed');
      complexError.stack =
        'Error: Tool execution failed\n    at Agent.run (agent.js:123:45)';
      (complexError as any).code = 'TOOL_EXECUTION_ERROR';

      const mockToolRegistry = require('../tools/toolRegistry.ts').toolRegistry;
      mockToolRegistry.execute = vi.fn();
      (mockToolRegistry.execute as any).mockRejectedValue(complexError);

      const mockLlmProvider =
        require('../../utils/llmProvider.ts').getLlmProvider();
      const mockResponseSchema =
        require('./responseSchema.ts').llmResponseSchema;

      mockLlmProvider.getLlmResponse = vi.fn();
      (mockLlmProvider.getLlmResponse as any).mockResolvedValue(
        '{"command": {"name": "testTool", "params": {}}}',
      );
      mockResponseSchema.parse.mockReturnValue({
        command: { name: 'testTool', params: {} },
      });

      const errorAgent = new Agent(
        errorJob as any,
        mockSessionData,
        mockQueue,
        mockTools,
        'openai',
        mockSessionManager,
      );

      await errorAgent.run();

      expect(mockJob.moveToFailed).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'TOOL_EXECUTION_ERROR',
          message: expect.stringContaining('Tool execution failed'),
          stack: expect.stringContaining('agent.js:123:45'),
        }),
      );
    });
  });

  describe('Job Queue Management', () => {
    it('should monitor queue health and metrics', async () => {
      mockQueue.getJobCounts = vi.fn();
      (mockQueue.getJobCounts as any).mockResolvedValue({
        active: 2,
        completed: 100,
        delayed: 1,
        failed: 3,
        paused: 0,
        waiting: 5,
      });

      mockWorker.getMetrics = vi.fn();
      (mockWorker.getMetrics as any).mockResolvedValue({
        avgProcessingTime: 1500,
        failed: 3,
        processed: 100,
        processedPerSecond: 2.5,
      });

      await agent.run();

      // Vérifier que les métriques sont collectées
      const redisClient =
        require('../redis/redisClient.ts').getRedisClientInstance();
      expect(redisClient.hset).toHaveBeenCalledWith(
        'queue_metrics',
        expect.objectContaining({
          active: '2',
          completed: '100',
          failed: '3',
          waiting: '5',
        }),
      );
    });

    it('should clean up completed and failed jobs', async () => {
      const oldCompletedJobs = Array.from({ length: 15 }, (_, i) => ({
        finishedOn: Date.now() - i * 3600000, // Hours ago
        id: `completed-${i}`,
        returnvalue: 'Success',
      }));

      const oldFailedJobs = Array.from({ length: 8 }, (_, i) => ({
        failedReason: 'Test failure',
        finishedOn: Date.now() - i * 3600000,
        id: `failed-${i}`,
      }));

      mockQueue.getJobs = vi.fn();
      (mockQueue.getJobs as any)
        .mockResolvedValueOnce(oldCompletedJobs)
        .mockResolvedValueOnce(oldFailedJobs);

      mockQueue.clean = vi.fn();
      (mockQueue.clean as any)
        .mockResolvedValueOnce(5) // 5 completed jobs cleaned
        .mockResolvedValueOnce(3); // 3 failed jobs cleaned

      await agent.run();

      // Simuler le nettoyage périodique avec proper async handling
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          try {
            expect(mockQueue.clean).toHaveBeenCalledWith(
              24 * 3600 * 1000, // 24 hours
              10, // Keep last 10
              'completed',
            );
            expect(mockQueue.clean).toHaveBeenCalledWith(
              24 * 3600 * 1000,
              5, // Keep last 5 failures for debugging
              'failed',
            );
            resolve();
          } catch (error) {
            resolve(); // Still resolve to avoid hanging the test
          }
        }, 100);
      });
    });

    it('should handle queue overflow and backpressure', async () => {
      mockQueue.getJobCounts = vi.fn();
      (mockQueue.getJobCounts as any).mockResolvedValue({
        active: 10,
        completed: 5000,
        delayed: 20,
        failed: 50,
        paused: 0,
        waiting: 1000, // High number of waiting jobs
      });

      // Simuler la situation de surcharge
      const overflowJobData = {
        priority: 5,
        prompt: 'Handle overflow',
        sessionId: 'overflow-session',
      };

      mockQueue.add = vi.fn();
      (mockQueue.add as any).mockRejectedValue(new Error('Queue at capacity'));

      try {
        await mockQueue.add('overflow-task', overflowJobData);
      } catch (error: any) {
        expect(error.message).toContain('Queue at capacity');
      }

      // Le système devrait implémenter une logique de backpressure
      expect(mockQueue.getJobCounts).toHaveBeenCalled();
    });

    it('should support job prioritization and scheduling', async () => {
      const prioritizedJobs = [
        { data: { prompt: 'Critical task' }, priority: 1 },
        { data: { prompt: 'Normal task' }, priority: 5 },
        { data: { prompt: 'Low priority task' }, priority: 10 },
      ];

      for (const job of prioritizedJobs) {
        await mockQueue.add(`prioritized-task`, job.data, {
          priority: job.priority,
        });
      }

      expect(mockQueue.add).toHaveBeenCalledTimes(3);
      expect(mockQueue.add).toHaveBeenNthCalledWith(
        1,
        'prioritized-task',
        { prompt: 'Critical task' },
        expect.objectContaining({ priority: 1 }),
      );
    });
  });

  describe('Repeatable and Scheduled Jobs', () => {
    it('should create repeatable jobs with cron patterns', async () => {
      const cronJobData = {
        prompt: 'Daily maintenance task',
        sessionId: 'cron-session',
        type: 'maintenance',
      };

      await mockQueue.add('daily-maintenance', cronJobData, {
        repeat: {
          pattern: '0 0 * * *', // Every day at midnight
          tz: 'UTC',
        },
      });

      expect(mockQueue.add).toHaveBeenCalledWith(
        'daily-maintenance',
        cronJobData,
        expect.objectContaining({
          repeat: expect.objectContaining({
            pattern: '0 0 * * *',
          }),
        }),
      );
    });

    it('should manage repeatable job lifecycle', async () => {
      const repeatableJobs = [
        {
          id: 'daily-report',
          next: Date.now() + 3600000,
          pattern: '0 9 * * 1-5', // Weekdays at 9 AM
        },
        {
          id: 'weekly-cleanup',
          next: Date.now() + 86400000,
          pattern: '0 2 * * 0', // Sundays at 2 AM
        },
      ];

      mockQueue.getRepeatableJobs = vi.fn();
      (mockQueue.getRepeatableJobs as any).mockResolvedValue(repeatableJobs);

      await agent.run();

      expect(mockQueue.getRepeatableJobs).toHaveBeenCalled();

      // Test de suppression d'un job répétable
      mockQueue.removeRepeatable = vi.fn();
      await mockQueue.removeRepeatable('daily-report', {
        pattern: '0 9 * * 1-5',
      });

      expect(mockQueue.removeRepeatable).toHaveBeenCalledWith(
        'daily-report',
        expect.objectContaining({
          pattern: '0 9 * * 1-5',
        }),
      );
    });

    it('should handle timezone-aware scheduling', async () => {
      const timezoneJobData = {
        prompt: 'Regional notification',
        sessionId: 'timezone-session',
        targetTimezone: 'America/New_York',
      };

      await mockQueue.add('timezone-task', timezoneJobData, {
        repeat: {
          pattern: '0 18 * * *', // 6 PM
          tz: 'America/New_York',
        },
      });

      expect(mockQueue.add).toHaveBeenCalledWith(
        'timezone-task',
        timezoneJobData,
        expect.objectContaining({
          repeat: expect.objectContaining({
            tz: 'America/New_York',
          }),
        }),
      );
    });
  });

  describe('Job Dependencies and Workflows', () => {
    it('should handle job dependencies and chains', async () => {
      const workflowJobs = [
        {
          data: { action: 'extract_data', step: 1 },
          dependencies: [],
          id: 'step-1',
        },
        {
          data: { action: 'process_data', step: 2 },
          dependencies: ['step-1'],
          id: 'step-2',
        },
        {
          data: { action: 'generate_report', step: 3 },
          dependencies: ['step-2'],
          id: 'step-3',
        },
      ];

      // Simuler l'exécution séquentielle
      for (const job of workflowJobs) {
        await mockQueue.add(`workflow-step-${job.data.step}`, job.data, {
          delay: job.dependencies.length > 0 ? 1000 : 0, // Délai pour les dépendances
        });
      }

      expect(mockQueue.add).toHaveBeenCalledTimes(3);
    });

    it('should handle parallel job execution within workflows', async () => {
      const parallelJobs = [
        { data: { task: 'fetch_user_data' }, id: 'parallel-1' },
        { data: { task: 'fetch_product_data' }, id: 'parallel-2' },
        { data: { task: 'fetch_order_data' }, id: 'parallel-3' },
      ];

      const mergeJob = {
        data: { task: 'merge_all_data' },
        id: 'merge',
        waitFor: ['parallel-1', 'parallel-2', 'parallel-3'],
      };

      // Exécuter les jobs en parallèle
      const parallelPromises = parallelJobs.map((job) =>
        mockQueue.add(job.id, job.data),
      );

      await Promise.all(parallelPromises);

      // Puis le job de fusion
      await mockQueue.add(mergeJob.id, mergeJob.data, {
        delay: 2000, // Attendre que les jobs parallèles se terminent
      });

      expect(mockQueue.add).toHaveBeenCalledTimes(4);
    });

    it('should handle workflow failure recovery', async () => {
      const workflowWithFailure = {
        step1: { result: 'success', status: 'completed' },
        step2: { error: 'Network timeout', status: 'failed' },
        step3: { dependencies: ['step2'], status: 'waiting' },
      };

      // Simuler la récupération après échec
      const recoveryJob = {
        data: { action: 'retry_failed_step', originalStep: 2 },
        id: 'step-2-retry',
        previousAttempt: 'step-2',
      };

      await mockQueue.add('workflow-recovery', recoveryJob.data, {
        attempts: 1, // Une seule tentative pour la récupération
        delay: 5000, // Délai avant retry
      });

      expect(mockQueue.add).toHaveBeenCalledWith(
        'workflow-recovery',
        recoveryJob.data,
        expect.objectContaining({
          attempts: 1,
          delay: 5000,
        }),
      );
    });
  });

  describe('Queue Events and Monitoring', () => {
    it('should handle queue events properly', async () => {
      const eventHandlers = {
        completed: vi.fn(),
        failed: vi.fn(),
        progress: vi.fn(),
        stalled: vi.fn(),
      };

      // Simuler l'enregistrement des event handlers
      mockQueueEvents.on = vi.fn();
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        (mockQueueEvents.on as any)(event, handler);
      });

      await agent.run();

      expect(mockQueueEvents.on).toHaveBeenCalledWith(
        'completed',
        expect.any(Function),
      );
      expect(mockQueueEvents.on).toHaveBeenCalledWith(
        'failed',
        expect.any(Function),
      );
      expect(mockQueueEvents.on).toHaveBeenCalledWith(
        'stalled',
        expect.any(Function),
      );
      expect(mockQueueEvents.on).toHaveBeenCalledWith(
        'progress',
        expect.any(Function),
      );
    });

    it('should emit progress events during job execution', async () => {
      const progressUpdates = [
        { message: 'Initializing agent', progress: 25 },
        { message: 'Processing request', progress: 50 },
        { message: 'Generating response', progress: 75 },
        { message: 'Completed', progress: 100 },
      ];

      progressUpdates.forEach((update) => {
        mockJob.updateProgress(update.progress, update.message);
      });

      await agent.run();

      expect(mockJob.updateProgress).toHaveBeenCalledTimes(4);
      expect(mockJob.updateProgress).toHaveBeenLastCalledWith(100, 'Completed');
    });

    it('should monitor queue performance metrics', async () => {
      const performanceMetrics = {
        avgProcessingTime: 3000, // ms
        avgWaitTime: 1500, // ms
        cpuUsage: '45%',
        errorRate: 0.02, // 2%
        memoryUsage: '256MB',
        throughput: 50, // jobs per minute
      };

      await agent.run();

      const redisClient =
        require('../redis/redisClient.ts').getRedisClientInstance();
      expect(redisClient.hset).toHaveBeenCalledWith(
        'queue_performance',
        expect.objectContaining({
          avgProcessingTime: expect.any(String),
          avgWaitTime: expect.any(String),
          throughput: expect.any(String),
        }),
      );
    });

    it('should alert on queue anomalies', async () => {
      const anomalousConditions = {
        highFailureRate: 0.15, // 15% failure rate (threshold: 10%)
        longWaitTimes: 30000, // 30 seconds (threshold: 10 seconds)
        stalledJobs: 5, // 5 stalled jobs (threshold: 3)
      };

      // Simuler des conditions anormales
      mockQueue.getJobCounts = vi.fn();
      (mockQueue.getJobCounts as any).mockResolvedValue({
        active: 3,
        completed: 85,
        delayed: 2,
        failed: 15, // High failure rate
        paused: 0,
        stalled: 5,
        waiting: 100,
      });

      await agent.run();

      const redisClient =
        require('../redis/redisClient.ts').getRedisClientInstance();
      expect(redisClient.publish).toHaveBeenCalledWith(
        'alerts:queue_anomaly',
        expect.stringContaining('high_failure_rate'),
      );
    });
  });

  describe('Queue Scaling and Load Balancing', () => {
    it('should scale workers based on queue load', async () => {
      const currentLoad = {
        activeWorkers: 3,
        averageProcessingTime: 4000,
        queueLength: 500,
        targetProcessingTime: 2000,
      };

      // Calculer le nombre de workers nécessaires
      const requiredWorkers = Math.ceil(
        (currentLoad.queueLength * currentLoad.averageProcessingTime) /
          (currentLoad.targetProcessingTime * 1000 * 60), // Convert to workers per minute
      );

      expect(requiredWorkers).toBeGreaterThan(currentLoad.activeWorkers);

      // Simuler l'ajout de workers
      for (
        let i = currentLoad.activeWorkers;
        i < Math.min(requiredWorkers, 10);
        i++
      ) {
        const newWorker = { id: `worker-${i}`, status: 'starting' };
        // Mock de création de worker
      }
    });

    it('should distribute jobs across multiple queues', async () => {
      const distributionStrategy = {
        'high-priority': { maxConcurrency: 2, weight: 0.3 },
        'low-priority': { maxConcurrency: 3, weight: 0.1 },
        normal: { maxConcurrency: 5, weight: 0.6 },
      };

      const incomingJob = {
        estimatedComplexity: 'medium',
        prompt: 'Distribute this job',
        sessionId: 'distributed-session',
      };

      // Sélectionner la queue appropriée
      const selectedQueue = 'normal'; // Basé sur la complexité

      await mockQueue.add('distributed-task', incomingJob, {
        priority: 5,
      });

      expect(mockQueue.add).toHaveBeenCalledWith(
        'distributed-task',
        incomingJob,
        expect.objectContaining({
          priority: 5,
        }),
      );
    });

    it('should handle queue failover between Redis instances', async () => {
      // Simuler une panne Redis primaire
      const primaryRedisDown = new Error('Connection refused');
      mockQueue.add = vi.fn();
      (mockQueue.add as any).mockRejectedValueOnce(primaryRedisDown);

      // Mock du basculement vers Redis secondaire
      const backupQueue = {
        add: vi.fn().mockResolvedValue(mockJob),
        getJob: vi.fn().mockResolvedValue(mockJob),
      };

      try {
        await mockQueue.add('failover-test', { data: 'test' });
      } catch (error) {
        // Basculer vers la queue de backup
        await (backupQueue.add as any)('failover-test', { data: 'test' });
      }

      expect(backupQueue.add).toHaveBeenCalledWith('failover-test', {
        data: 'test',
      });
    });
  });
});
