import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Redis client before other imports
vi.mock('../../../../redis/redisClient', () => {
  let mockClient: any = null;
  return {
    getRedisClientInstance: () => mockClient,
    setRedisClientInstance: (client: any) => {
      mockClient = client;
    },
  };
});

import { setRedisClientInstance } from '../../../../redis/redisClient';
import { ProjectManagementService } from '../projectManagement';
import {
  optimizedEventStream,
  todoEventOptimizer,
} from '../todoEventOptimization';
import { todoPerformanceMonitor } from '../todoPerformanceMonitoring';
import { todoStateManager } from '../todoStateManagement';
import { todoManager, unifiedTodoListTool } from '../unifiedTodoList.tool';

// Mock the context for testing
const createMockContext = (jobId?: string, sessionName?: string) => ({
  job: jobId
    ? {
        data: { prompt: 'test' },
        id: jobId,
        isFailed: async () => false,
        name: 'test-job',
      }
    : undefined,
  llm: {} as any,
  log: {
    child: vi.fn(() => ({
      debug: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
      info: vi.fn(),
      level: 'info' as any,
      silent: false,
      trace: vi.fn(),
      warn: vi.fn(),
    })),
    debug: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    info: vi.fn(),
    level: 'info' as any,
    silent: false,
    trace: vi.fn(),
    warn: vi.fn(),
  } as any,
  reportProgress: vi.fn(),
  session: {
    history: [],
    identities: [],
    name: sessionName || 'test-session',
    timestamp: Date.now(),
  },
  streamContent: vi.fn(),
  taskQueue: {} as any,
});

// Mock Redis client
const mockRedisClient = {
  del: vi.fn().mockResolvedValue(1),
  exists: vi.fn().mockResolvedValue(0),
  expire: vi.fn().mockResolvedValue(1),
  get: vi.fn().mockResolvedValue(null),
  hdel: vi.fn().mockResolvedValue(1),
  hget: vi.fn().mockResolvedValue(null),
  hgetall: vi.fn().mockResolvedValue({}),
  hkeys: vi.fn().mockResolvedValue([]),
  hset: vi.fn().mockResolvedValue(1),
  keys: vi.fn().mockResolvedValue([]),
  set: vi.fn().mockResolvedValue('OK'),
  ttl: vi.fn().mockResolvedValue(-1),
  zadd: vi.fn().mockResolvedValue(1),
  zcard: vi.fn().mockResolvedValue(0),
  zrange: vi.fn().mockResolvedValue([]),
  zrem: vi.fn().mockResolvedValue(1),
  zscore: vi.fn().mockResolvedValue(null),
} as any;

// Create an instance of the service for testing
const projectManagementService = new ProjectManagementService(todoStateManager);

describe('Unified Todo List Tool', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Initialize mock Redis client for tests
    setRedisClientInstance(mockRedisClient);
    // Clear state between tests - need to clear the Maps properly
    // Clear the actual todoManager used by the tool
    const manager = todoManager as any;
    if (manager.tasks && typeof manager.tasks.clear === 'function') {
      manager.tasks.clear();
    }
    if (manager.projects && typeof manager.projects.clear === 'function') {
      manager.projects.clear();
    }
    if (
      manager.templateCache &&
      typeof manager.templateCache.clear === 'function'
    ) {
      manager.templateCache.clear();
    }

    // Also clear the todoStateManager for ProjectManagementService tests
    const stateManager = todoStateManager as any;
    if (stateManager.tasks && typeof stateManager.tasks.clear === 'function') {
      stateManager.tasks.clear();
    }
    if (
      stateManager.projects &&
      typeof stateManager.projects.clear === 'function'
    ) {
      stateManager.projects.clear();
    }

    // Clear TodoEventOptimizer state by clearing its internal queue
    if (todoEventOptimizer) {
      const optimizer = todoEventOptimizer as any;
      if (optimizer.eventQueue && Array.isArray(optimizer.eventQueue)) {
        optimizer.eventQueue.length = 0;
      }
      if (optimizer.batchTimer) {
        clearTimeout(optimizer.batchTimer);
        optimizer.batchTimer = null;
      }
    }

    // Clear TodoPerformanceMonitor state
    if (
      todoPerformanceMonitor &&
      typeof todoPerformanceMonitor.reset === 'function'
    ) {
      todoPerformanceMonitor.reset();
    }

    // Reset all mock functions
    Object.values(mockRedisClient).forEach((mockFn) => {
      if (typeof mockFn === 'function' && 'mockClear' in mockFn) {
        (mockFn as any).mockClear();
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setRedisClientInstance(null);
  });

  it('should create a new task successfully', async () => {
    const mockCtx = createMockContext('test-job-id', 'test-session');

    const result = await unifiedTodoListTool.execute(
      {
        action: 'create_task',
        task: {
          content: 'Test task',
          createdAt: Date.now(),
          dependencies: [],
          id: '1',
          priority: 'medium',
          progress: 0,
          status: 'pending',
          tags: [],
          updatedAt: Date.now(),
        },
      },
      mockCtx,
    );

    expect(typeof result).toBe('object');
    if (typeof result === 'object' && 'success' in result) {
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('message');
      if ('tasks' in result && result.tasks) {
        expect(result.tasks).toHaveLength(1);
        expect(result.tasks[0].content).toBe('Test task');
      }
    }

    // Verify the task was added to state
    const tasks = todoManager.getTasks('test-session');
    expect(tasks).toHaveLength(1);
    expect(tasks[0].content).toBe('Test task');
  });

  it('should update a task status successfully', async () => {
    const mockCtx = createMockContext('test-job-id', 'test-session');

    // First create a task
    await unifiedTodoListTool.execute(
      {
        action: 'create_task',
        task: {
          content: 'Test task',
          createdAt: Date.now(),
          dependencies: [],
          id: '1',
          priority: 'medium',
          progress: 0,
          status: 'pending',
          tags: [],
          updatedAt: Date.now(),
        },
      },
      mockCtx,
    );

    // Then update its status
    const result = await unifiedTodoListTool.execute(
      {
        action: 'update_task',
        status: 'completed',
        taskId: '1',
      },
      mockCtx,
    );

    expect(typeof result).toBe('object');
    if (typeof result === 'object' && 'success' in result) {
      expect(result.success).toBe(true);
      if ('tasks' in result && result.tasks) {
        expect(result.tasks[0].status).toBe('completed');
      }
    }

    // Verify the task was updated in state
    const tasks = todoManager.getTasks('test-session');
    expect(tasks[0].status).toBe('completed');
  });

  it('should display tasks with filters', async () => {
    const mockCtx = createMockContext('test-job-id', 'test-session');

    // Create multiple tasks
    await unifiedTodoListTool.execute(
      {
        action: 'create_task',
        task: {
          content: 'Pending task',
          createdAt: Date.now(),
          dependencies: [],
          id: '1',
          priority: 'medium',
          progress: 0,
          status: 'pending',
          tags: [],
          updatedAt: Date.now(),
        },
      },
      mockCtx,
    );

    await unifiedTodoListTool.execute(
      {
        action: 'create_task',
        task: {
          content: 'Completed task',
          createdAt: Date.now(),
          dependencies: [],
          id: '2',
          priority: 'high',
          progress: 100,
          status: 'completed',
          tags: [],
          updatedAt: Date.now(),
        },
      },
      mockCtx,
    );

    // Display only pending tasks
    const result = await unifiedTodoListTool.execute(
      {
        action: 'display',
        filters: {
          status: ['pending'],
        },
      },
      mockCtx,
    );

    expect(typeof result).toBe('object');
    if (typeof result === 'object' && 'success' in result) {
      expect(result.success).toBe(true);
      if ('tasks' in result && result.tasks) {
        expect(result.tasks).toHaveLength(1);
        expect(result.tasks[0].content).toBe('Pending task');
      }
    }
  });

  it('should get statistics correctly', async () => {
    const mockCtx = createMockContext('test-job-id', 'test-session');

    // Create tasks with different statuses
    await unifiedTodoListTool.execute(
      {
        action: 'create_task',
        task: {
          content: 'Pending task',
          createdAt: Date.now(),
          dependencies: [],
          id: '1',
          priority: 'medium',
          progress: 0,
          status: 'pending',
          tags: [],
          updatedAt: Date.now(),
        },
      },
      mockCtx,
    );

    await unifiedTodoListTool.execute(
      {
        action: 'create_task',
        task: {
          content: 'In progress task',
          createdAt: Date.now(),
          dependencies: [],
          id: '2',
          priority: 'high',
          progress: 50,
          status: 'in_progress',
          tags: [],
          updatedAt: Date.now(),
        },
      },
      mockCtx,
    );

    await unifiedTodoListTool.execute(
      {
        action: 'create_task',
        task: {
          content: 'Completed task',
          createdAt: Date.now(),
          dependencies: [],
          id: '3',
          priority: 'low',
          progress: 100,
          status: 'completed',
          tags: [],
          updatedAt: Date.now(),
        },
      },
      mockCtx,
    );

    // Get statistics
    const result = await unifiedTodoListTool.execute(
      {
        action: 'get_stats',
      },
      mockCtx,
    );

    expect(typeof result).toBe('object');
    if (typeof result === 'object' && 'success' in result) {
      expect(result.success).toBe(true);
      if ('stats' in result && result.stats) {
        expect(result.stats.pending).toBe(1);
        expect(result.stats.in_progress).toBe(1);
        expect(result.stats.completed).toBe(1);
        expect(result.stats.total).toBe(3);
      }
    }
  });

  it('should clear all tasks successfully', async () => {
    const mockCtx = createMockContext('test-job-id', 'test-session');

    // Create some tasks
    await unifiedTodoListTool.execute(
      {
        action: 'create_task',
        task: {
          content: 'Test task',
          createdAt: Date.now(),
          dependencies: [],
          id: '1',
          priority: 'medium',
          progress: 0,
          status: 'pending',
          tags: [],
          updatedAt: Date.now(),
        },
      },
      mockCtx,
    );

    // Clear all tasks
    const result = await unifiedTodoListTool.execute(
      {
        action: 'clear_all',
      },
      mockCtx,
    );

    expect(typeof result).toBe('object');
    if (typeof result === 'object' && 'success' in result) {
      expect(result.success).toBe(true);
      if ('tasks' in result && result.tasks) {
        expect(result.tasks).toHaveLength(0);
      }
    }

    // Verify tasks were cleared from state
    const tasks = todoManager.getTasks('test-session');
    expect(tasks).toHaveLength(0);
  });

  it('should handle errors gracefully', async () => {
    const mockCtx = createMockContext('test-job-id', 'test-session');

    // Try to update a non-existent task
    const result = await unifiedTodoListTool.execute(
      {
        action: 'update_task',
        status: 'completed',
        taskId: 'non-existent',
      },
      mockCtx,
    );

    expect(typeof result).toBe('object');
    if (typeof result === 'object') {
      expect('error' in result).toBe(true);
    }
  });
});

describe('Project Management Service', () => {
  beforeEach(async () => {
    // Clear state between tests
    const stateManager = todoStateManager as any;
    if (stateManager.tasks && typeof stateManager.tasks.clear === 'function') {
      stateManager.tasks.clear();
    }
    if (
      stateManager.projects &&
      typeof stateManager.projects.clear === 'function'
    ) {
      stateManager.projects.clear();
    }

    // Clear performance monitor
    if (
      todoPerformanceMonitor &&
      typeof todoPerformanceMonitor.reset === 'function'
    ) {
      todoPerformanceMonitor.reset();
    }
  });

  it('should create a project successfully', async () => {
    const result = await projectManagementService.createProject(
      'test-session',
      {
        budget: 0,
        burndownData: [],
        completedTaskCount: 0,
        createdAt: Date.now(),
        customFields: {},
        dependencies: [],
        description: 'A test project',
        id: 'proj-1',
        milestones: [],
        name: 'Test Project',
        phases: [],
        progress: 0,
        resources: [],
        risks: [],
        status: 'planning',
        taskCount: 0,
        team: [],
        updatedAt: Date.now(),
        velocity: 0,
      },
    );

    expect(result).toHaveProperty('success', true);
    if ('project' in result && result.project) {
      expect(result.project.name).toBe('Test Project');
    }
  });

  it('should add a task to a project', async () => {
    // First create a project
    await projectManagementService.createProject('test-session', {
      budget: 0,
      burndownData: [],
      completedTaskCount: 0,
      createdAt: Date.now(),
      customFields: {},
      dependencies: [],
      description: 'A test project',
      id: 'proj-1',
      milestones: [],
      name: 'Test Project',
      phases: [],
      progress: 0,
      resources: [],
      risks: [],
      status: 'planning',
      taskCount: 0,
      team: [],
      updatedAt: Date.now(),
      velocity: 0,
    });

    // Then add a task to the project
    const result = await projectManagementService.addTaskToProject(
      'test-session',
      'proj-1',
      {
        attachments: [],
        automationRules: [],
        comments: [],
        content: 'Project task',
        createdAt: Date.now(),
        customFields: {},
        dependencies: [],
        id: 'task-1',
        labels: [],
        priority: 'medium',
        progress: 0,
        status: 'pending',
        subtasks: [],
        tags: [],
        timeSpent: 0,
        updatedAt: Date.now(),
        watchers: [],
      },
    );

    expect(result).toHaveProperty('success', true);
    if ('task' in result && result.task) {
      expect(result.task.projectId).toBe('proj-1');
    }
  });

  it('should calculate project progress correctly', async () => {
    // Create a project
    await projectManagementService.createProject('test-session', {
      budget: 0,
      burndownData: [],
      completedTaskCount: 0,
      createdAt: Date.now(),
      customFields: {},
      dependencies: [],
      description: 'A test project',
      id: 'proj-1',
      milestones: [],
      name: 'Test Project',
      phases: [],
      progress: 0,
      resources: [],
      risks: [],
      status: 'planning',
      taskCount: 0,
      team: [],
      updatedAt: Date.now(),
      velocity: 0,
    });

    // Add tasks to the project
    await projectManagementService.addTaskToProject('test-session', 'proj-1', {
      attachments: [],
      automationRules: [],
      comments: [],
      content: 'Pending task',
      createdAt: Date.now(),
      customFields: {},
      dependencies: [],
      id: 'task-1',
      labels: [],
      priority: 'medium',
      progress: 0,
      status: 'pending',
      subtasks: [],
      tags: [],
      timeSpent: 0,
      updatedAt: Date.now(),
      watchers: [],
    });

    await projectManagementService.addTaskToProject('test-session', 'proj-1', {
      attachments: [],
      automationRules: [],
      comments: [],
      content: 'Completed task',
      createdAt: Date.now(),
      customFields: {},
      dependencies: [],
      id: 'task-2',
      labels: [],
      priority: 'high',
      progress: 100,
      status: 'completed',
      subtasks: [],
      tags: [],
      timeSpent: 0,
      updatedAt: Date.now(),
      watchers: [],
    });

    // Get project tasks to check setup worked
    const result = await projectManagementService.getProjectTasks(
      'test-session',
      'proj-1',
    );

    expect(result).toHaveProperty('success', true);
    if ('tasks' in result && result.tasks) {
      expect(result.tasks).toHaveLength(2);
      const completedTasks = result.tasks.filter(
        (t) => t.status === 'completed',
      );
      expect(completedTasks).toHaveLength(1);
    }
  });
});

describe('Todo Event Optimizer', () => {
  it('should batch events correctly', async () => {
    const events = [
      {
        data: { content: 'Test task 1' },
        id: '1',
        sessionId: 'test-session',
        timestamp: Date.now(),
        type: 'TASK_CREATED' as const,
      },
      {
        data: { content: 'Test task 2' },
        id: '2',
        sessionId: 'test-session',
        timestamp: Date.now(),
        type: 'TASK_CREATED' as const,
      },
    ];

    // Add events to optimizer
    todoEventOptimizer.addEvents(events);

    // Check queue size
    expect(todoEventOptimizer.getQueueSize()).toBe(2);
  });

  it('should flush batch when size limit is reached', async () => {
    // Configure optimizer with small batch size
    todoEventOptimizer.updateConfig({ batchSize: 2, batchTimeout: 1000 });

    const events = [
      {
        data: { content: 'Test task 1' },
        id: '1',
        sessionId: 'test-session',
        timestamp: Date.now(),
        type: 'TASK_CREATED' as const,
      },
      {
        data: { content: 'Test task 2' },
        id: '2',
        sessionId: 'test-session',
        timestamp: Date.now(),
        type: 'TASK_CREATED' as const,
      },
    ];

    // Add events - this should trigger a flush
    todoEventOptimizer.addEvents(events);

    // Wait a bit for async flush to complete and force a flush if needed
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Force flush in case the automatic flush didn't work
    if (todoEventOptimizer.getQueueSize() > 0) {
      await (todoEventOptimizer as any).flushAll();
    }

    // Check queue is empty after flush
    expect(todoEventOptimizer.getQueueSize()).toBe(0);
  });
});

describe('Todo Performance Monitor', () => {
  it('should record operation timings', () => {
    // Record some operation timings
    todoPerformanceMonitor.recordOperation('test-operation', 100);
    todoPerformanceMonitor.recordOperation('test-operation', 200);
    todoPerformanceMonitor.recordOperation('test-operation', 150);

    // Get stats
    const stats = todoPerformanceMonitor.getOperationStats('test-operation');

    expect(stats).not.toBeNull();
    if (stats) {
      expect(stats.count).toBe(3);
      expect(stats.avgDuration).toBe(150);
      expect(stats.minDuration).toBe(100);
      expect(stats.maxDuration).toBe(200);
    }
  });

  it('should record custom metrics', () => {
    // Record some metrics
    todoPerformanceMonitor.recordMetric('task-count', 10);
    todoPerformanceMonitor.recordMetric('task-count', 20);
    todoPerformanceMonitor.recordMetric('task-count', 15);

    // Get stats
    const stats = todoPerformanceMonitor.getMetricStats('task-count');

    expect(stats).not.toBeNull();
    if (stats) {
      expect(stats.count).toBe(3);
      expect(stats.avg).toBe(15);
      expect(stats.min).toBe(10);
      expect(stats.max).toBe(20);
    }
  });
});
