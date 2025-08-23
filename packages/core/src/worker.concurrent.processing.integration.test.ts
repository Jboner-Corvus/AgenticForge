import { EventEmitter } from 'events';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { Worker } from 'worker_threads';

import { getConfig } from './config.ts';

interface TestWorker {
  [key: string]: any; // Allow other properties for mock
  busy: boolean;
  id: number;
}

describe('Worker Concurrent Processing Integration Tests', () => {
  let config: ReturnType<typeof getConfig>;
  let workerPool: TestWorker[];
  let jobQueue: EventEmitter;

  beforeAll(async () => {
    config = getConfig();
    workerPool = [];
    jobQueue = new EventEmitter();
    jobQueue.setMaxListeners(100);
  });

  afterAll(async () => {
    // Cleanup all workers
    await Promise.all(
      workerPool.map(
        (worker) =>
          new Promise<void>((resolve) => {
            worker.terminate().then(() => resolve());
          }),
      ),
    );
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up any remaining workers
    while (workerPool.length > 0) {
      const worker = workerPool.pop()!;
      await worker.terminate();
    }
    jobQueue.removeAllListeners();
  });

  it('should create and manage worker pool', async () => {
    const poolSize = 4;
    const workers: TestWorker[] = [];

    // Simulate worker creation (without actual worker files)
    for (let i = 0; i < poolSize; i++) {
      const mockWorker = {
        busy: false,
        id: i,
        on: vi.fn(),
        once: vi.fn(),
        postMessage: vi.fn(),
        removeListener: vi.fn(),
        terminate: vi.fn().mockResolvedValue(undefined),
      } as any;

      workers.push(mockWorker);
      workerPool.push(mockWorker);
    }

    expect(workers).toHaveLength(poolSize);
    expect(workerPool).toHaveLength(poolSize);

    // Test worker availability
    const availableWorkers = workers.filter((w) => !w.busy);
    expect(availableWorkers).toHaveLength(poolSize);
  });

  it('should distribute jobs across workers concurrently', async () => {
    const workers = Array.from({ length: 3 }, (_, i) => ({
      busy: false,
      completedJobs: 0,
      id: i,
      on: vi.fn(),
      once: vi.fn(),
      postMessage: vi.fn(),
      removeListener: vi.fn(),
      terminate: vi.fn().mockResolvedValue(undefined),
    })) as TestWorker[];

    workerPool.push(...workers);

    const jobs = Array.from({ length: 9 }, (_, i) => ({
      id: `job-${i}`,
      payload: { task: `task-${i}` },
      type: 'agent',
    }));

    // Simulate job distribution
    const assignJob = (job: any): Promise<any> => {
      const availableWorker = workers.find((w) => !w.busy);
      if (!availableWorker) {
        return Promise.reject(new Error('No available workers'));
      }

      availableWorker.busy = true;

      return new Promise((resolve) => {
        setTimeout(() => {
          availableWorker.busy = false;
          availableWorker.completedJobs++;
          resolve({
            jobId: job.id,
            result: 'completed',
            workerId: availableWorker.id,
          });
        }, Math.random() * 100); // Random processing time
      });
    };

    // Process jobs with worker pool
    const results = await Promise.all(jobs.map((job) => assignJob(job)));

    expect(results).toHaveLength(9);
    results.forEach((result) => {
      expect(result).toHaveProperty('jobId');
      expect(result).toHaveProperty('workerId');
      expect(result.result).toBe('completed');
    });

    // Check that work was distributed across workers
    const totalCompletedJobs = workers.reduce(
      (sum, w) => sum + w.completedJobs,
      0,
    );
    expect(totalCompletedJobs).toBe(9);
  });

  it('should handle worker failures gracefully', async () => {
    const workers = Array.from({ length: 2 }, (_, i) => ({
      busy: false,
      failed: false,
      id: i,
      on: vi.fn(),
      once: vi.fn(),
      postMessage: vi.fn(),
      removeListener: vi.fn(),
      terminate: vi.fn().mockResolvedValue(undefined),
    })) as TestWorker[];

    workerPool.push(...workers);

    const processJob = (job: any): Promise<any> => {
      const availableWorker = workers.find((w) => !w.busy && !w.failed);
      if (!availableWorker) {
        return Promise.reject(new Error('No available workers'));
      }

      availableWorker.busy = true;

      return new Promise((resolve, reject) => {
        // Simulate worker failure for specific jobs
        if (job.id === 'failing-job') {
          availableWorker.failed = true;
          availableWorker.busy = false;
          reject(new Error(`Worker ${availableWorker.id} failed`));
          return;
        }

        setTimeout(() => {
          availableWorker.busy = false;
          resolve({
            jobId: job.id,
            result: 'completed',
            workerId: availableWorker.id,
          });
        }, 50);
      });
    };

    const jobs = [
      { id: 'job-1', type: 'agent' },
      { id: 'failing-job', type: 'agent' },
      { id: 'job-3', type: 'agent' },
    ];

    const results = await Promise.allSettled(
      jobs.map((job) => processJob(job)),
    );

    expect(results[0].status).toBe('fulfilled');
    expect(results[1].status).toBe('rejected');
    expect(results[2].status).toBe('fulfilled');

    // Check that one worker failed
    const failedWorkers = workers.filter((w) => w.failed);
    expect(failedWorkers).toHaveLength(1);
  });

  it('should implement job priority queue', async () => {
    interface PriorityJob {
      id: string;
      priority: number;
      processedAt?: number;
      type: string;
    }

    class PriorityQueue {
      private jobs: PriorityJob[] = [];

      dequeue(): PriorityJob | undefined {
        return this.jobs.shift();
      }

      enqueue(job: PriorityJob) {
        this.jobs.push(job);
        this.jobs.sort((a, b) => b.priority - a.priority); // Higher priority first
      }

      size(): number {
        return this.jobs.length;
      }
    }

    const queue = new PriorityQueue();
    const processedJobs: PriorityJob[] = [];

    // Add jobs with different priorities
    const jobs: PriorityJob[] = [
      { id: 'low-1', priority: 1, type: 'agent' },
      { id: 'high-1', priority: 10, type: 'critical' },
      { id: 'medium-1', priority: 5, type: 'agent' },
      { id: 'high-2', priority: 10, type: 'critical' },
      { id: 'low-2', priority: 1, type: 'agent' },
    ];

    jobs.forEach((job) => queue.enqueue(job));

    // Process jobs by priority
    while (queue.size() > 0) {
      const job = queue.dequeue()!;
      job.processedAt = Date.now();
      processedJobs.push(job);
      await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay
    }

    expect(processedJobs).toHaveLength(5);

    // Check that high priority jobs were processed first
    expect(processedJobs[0].priority).toBe(10);
    expect(processedJobs[1].priority).toBe(10);
    expect(processedJobs[2].priority).toBe(5);
    expect(processedJobs[3].priority).toBe(1);
    expect(processedJobs[4].priority).toBe(1);
  });

  it('should handle concurrent job processing with rate limiting', async () => {
    const rateLimiter = {
      currentlyProcessing: 0,
      maxConcurrent: 3,
      processedCount: 0,
      async processJob(job: any): Promise<any> {
        if (this.currentlyProcessing >= this.maxConcurrent) {
          this.rejectedCount++;
          throw new Error('Rate limit exceeded');
        }

        this.currentlyProcessing++;

        try {
          await new Promise((resolve) => setTimeout(resolve, 100));
          this.processedCount++;
          return { jobId: job.id, result: 'completed' };
        } finally {
          this.currentlyProcessing--;
        }
      },

      rejectedCount: 0,
    };

    const jobs = Array.from({ length: 10 }, (_, i) => ({ id: `job-${i}` }));

    // Try to process all jobs at once (should hit rate limit)
    const results = await Promise.allSettled(
      jobs.map((job) => rateLimiter.processJob(job)),
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    expect(succeeded).toBeLessThanOrEqual(3); // Due to rate limiting
    expect(failed).toBeGreaterThan(0);
    expect(rateLimiter.rejectedCount).toBeGreaterThan(0);
  });

  it('should implement worker load balancing', async () => {
    interface LoadBalancedWorker {
      busy: boolean;
      completedJobs: number;
      id: number;
      load: number;
    }

    const workers: LoadBalancedWorker[] = Array.from({ length: 4 }, (_, i) => ({
      busy: false,
      completedJobs: 0,
      id: i,
      load: 0,
    }));

    const loadBalancer = {
      async assignJob(job: any): Promise<any> {
        const worker = this.selectWorker();
        if (!worker) throw new Error('No available workers');

        worker.busy = true;
        worker.load += job.weight || 1;

        try {
          await new Promise((resolve) =>
            setTimeout(resolve, job.duration || 50),
          );
          worker.completedJobs++;
          return { jobId: job.id, result: 'completed', workerId: worker.id };
        } finally {
          worker.busy = false;
          worker.load -= job.weight || 1;
        }
      },

      selectWorker(): LoadBalancedWorker | null {
        const availableWorkers = workers.filter((w) => !w.busy);
        if (availableWorkers.length === 0) return null;

        // Select worker with lowest load
        return availableWorkers.reduce((min, worker) =>
          worker.load < min.load ? worker : min,
        );
      },
    };

    const jobs = Array.from({ length: 12 }, (_, i) => ({
      duration: Math.floor(Math.random() * 50) + 25, // Random duration 25-75ms
      id: `job-${i}`,
      weight: Math.floor(Math.random() * 3) + 1, // Random weight 1-3
    }));

    const results = await Promise.all(
      jobs.map((job) => loadBalancer.assignJob(job)),
    );

    expect(results).toHaveLength(12);

    // Check load distribution
    const totalJobs = workers.reduce((sum, w) => sum + w.completedJobs, 0);
    expect(totalJobs).toBe(12);

    // Workers should have relatively balanced loads
    const maxJobs = Math.max(...workers.map((w) => w.completedJobs));
    const minJobs = Math.min(...workers.map((w) => w.completedJobs));
    expect(maxJobs - minJobs).toBeLessThanOrEqual(4); // Reasonable distribution
  });

  it('should handle worker memory management', async () => {
    interface MemoryManagedWorker {
      busy: boolean;
      id: number;
      jobsProcessed: number;
      maxMemory: number;
      memoryUsage: number;
    }

    const workers: MemoryManagedWorker[] = Array.from(
      { length: 2 },
      (_, i) => ({
        busy: false,
        id: i,
        jobsProcessed: 0,
        maxMemory: 1000, // 1000 units max
        memoryUsage: 0,
      }),
    );

    const memoryManager = {
      canProcessJob(worker: MemoryManagedWorker, job: any): boolean {
        const estimatedMemory = job.memoryRequirement || 100;
        return worker.memoryUsage + estimatedMemory <= worker.maxMemory;
      },

      async processJob(job: any): Promise<any> {
        const availableWorker = workers.find(
          (w) => !w.busy && this.canProcessJob(w, job),
        );

        if (!availableWorker) {
          throw new Error('No worker with sufficient memory available');
        }

        availableWorker.busy = true;
        availableWorker.memoryUsage += job.memoryRequirement || 100;

        try {
          await new Promise((resolve) => setTimeout(resolve, 50));
          availableWorker.jobsProcessed++;
          return {
            jobId: job.id,
            result: 'completed',
            workerId: availableWorker.id,
          };
        } finally {
          availableWorker.busy = false;
          availableWorker.memoryUsage -= job.memoryRequirement || 100;
        }
      },
    };

    const jobs = [
      { id: 'small-1', memoryRequirement: 200 },
      { id: 'large-1', memoryRequirement: 800 },
      { id: 'small-2', memoryRequirement: 150 },
      { id: 'large-2', memoryRequirement: 900 },
      { id: 'medium-1', memoryRequirement: 400 },
    ];

    const results = await Promise.allSettled(
      jobs.map((job) => memoryManager.processJob(job)),
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    expect(succeeded).toBeGreaterThan(0);
    // Some jobs might fail due to memory constraints
    expect(succeeded + failed).toBe(jobs.length);
  });

  it('should implement job retry mechanism with exponential backoff', async () => {
    interface RetryableJob {
      attempts: number;
      id: string;
      lastAttempt?: number;
      maxAttempts: number;
    }

    const jobRetryManager = {
      async processWithRetry(job: RetryableJob): Promise<any> {
        const delay = Math.pow(2, job.attempts) * 100; // Exponential backoff

        if (job.lastAttempt && Date.now() - job.lastAttempt < delay) {
          throw new Error('Too early for retry');
        }

        job.attempts++;
        job.lastAttempt = Date.now();

        // Simulate job that fails first few times
        if (job.id === 'flaky-job' && job.attempts < 3) {
          throw new Error(`Attempt ${job.attempts} failed`);
        }

        return { attempts: job.attempts, jobId: job.id, result: 'completed' };
      },

      async retryJob(job: RetryableJob): Promise<any> {
        while (job.attempts < job.maxAttempts) {
          try {
            return await this.processWithRetry(job);
          } catch (error) {
            if (job.attempts >= job.maxAttempts) {
              throw new Error(
                `Job ${job.id} failed after ${job.maxAttempts} attempts`,
              );
            }

            // Wait for exponential backoff
            const delay = Math.pow(2, job.attempts) * 10; // Shorter delay for testing
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      },
    };

    const jobs: RetryableJob[] = [
      { attempts: 0, id: 'stable-job', maxAttempts: 3 },
      { attempts: 0, id: 'flaky-job', maxAttempts: 5 },
    ];

    const results = await Promise.allSettled(
      jobs.map((job) => jobRetryManager.retryJob(job)),
    );

    expect(results[0].status).toBe('fulfilled'); // Stable job should succeed on first try
    expect(results[1].status).toBe('fulfilled'); // Flaky job should succeed after retries

    if (results[1].status === 'fulfilled') {
      expect((results[1].value as any).attempts).toBe(3); // Should succeed on 3rd attempt
    }
  });

  it('should monitor worker pool health and performance', async () => {
    interface MonitoredWorker {
      errorCount: number;
      id: number;
      isHealthy: boolean;
      lastHeartbeat: number;
      responseTime: number[];
    }

    const workers: MonitoredWorker[] = Array.from({ length: 3 }, (_, i) => ({
      errorCount: 0,
      id: i,
      isHealthy: true,
      lastHeartbeat: Date.now(),
      responseTime: [],
    }));

    const healthMonitor = {
      checkWorkerHealth(worker: MonitoredWorker): boolean {
        const now = Date.now();
        const heartbeatTimeout = 5000; // 5 seconds
        const maxErrors = 3;
        const maxAvgResponseTime = 1000; // 1 second

        // Check heartbeat
        if (now - worker.lastHeartbeat > heartbeatTimeout) {
          return false;
        }

        // Check error rate
        if (worker.errorCount > maxErrors) {
          return false;
        }

        // Check average response time
        if (worker.responseTime.length > 0) {
          const avgResponseTime =
            worker.responseTime.reduce((a, b) => a + b, 0) /
            worker.responseTime.length;
          if (avgResponseTime > maxAvgResponseTime) {
            return false;
          }
        }

        return true;
      },

      getPoolHealth(): any {
        const healthyWorkers = workers.filter((w) => this.checkWorkerHealth(w));
        const totalWorkers = workers.length;

        return {
          avgResponseTime:
            workers.reduce((sum, w) => {
              const avg =
                w.responseTime.length > 0
                  ? w.responseTime.reduce((a, b) => a + b, 0) /
                    w.responseTime.length
                  : 0;
              return sum + avg;
            }, 0) / totalWorkers,
          healthPercentage: (healthyWorkers.length / totalWorkers) * 100,
          healthyWorkers: healthyWorkers.length,
          totalWorkers,
        };
      },

      async processJobWithMonitoring(
        worker: MonitoredWorker,
        job: any,
      ): Promise<any> {
        const startTime = Date.now();

        try {
          // Simulate job processing
          await new Promise((resolve) =>
            setTimeout(resolve, Math.random() * 200),
          );

          const responseTime = Date.now() - startTime;
          worker.responseTime.push(responseTime);

          // Keep only last 10 response times
          if (worker.responseTime.length > 10) {
            worker.responseTime.shift();
          }

          worker.lastHeartbeat = Date.now();

          return {
            jobId: job.id,
            responseTime,
            result: 'completed',
            workerId: worker.id,
          };
        } catch (error) {
          worker.errorCount++;
          throw error;
        }
      },
    };

    // Process some jobs
    const jobs = Array.from({ length: 15 }, (_, i) => ({ id: `job-${i}` }));

    const promises = jobs.map((job, index) => {
      const worker = workers[index % workers.length];
      return healthMonitor.processJobWithMonitoring(worker, job);
    });

    await Promise.all(promises);

    const poolHealth = healthMonitor.getPoolHealth();

    expect(poolHealth.totalWorkers).toBe(3);
    expect(poolHealth.healthyWorkers).toBeGreaterThan(0);
    expect(poolHealth.healthPercentage).toBeGreaterThan(0);
    expect(poolHealth.avgResponseTime).toBeGreaterThan(0);
    expect(poolHealth.avgResponseTime).toBeLessThan(1000);
  });
});
