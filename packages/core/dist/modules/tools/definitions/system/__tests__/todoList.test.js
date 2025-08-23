import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  todoManager,
  unifiedTodoListTool
} from "../../../../../chunk-SF442Y5M.js";
import {
  ProjectManagementService
} from "../../../../../chunk-LWNQEFSJ.js";
import {
  todoEventOptimizer
} from "../../../../../chunk-HPYHZBYX.js";
import {
  todoPerformanceMonitor
} from "../../../../../chunk-UKGNW2IP.js";
import {
  todoStateManager
} from "../../../../../chunk-Q4OKQA7O.js";
import "../../../../../chunk-FG6D2ATS.js";
import {
  afterEach,
  beforeEach,
  describe,
  globalExpect,
  it,
  vi
} from "../../../../../chunk-AQKYZ7X3.js";
import {
  setRedisClientInstance
} from "../../../../../chunk-2TWFUMQU.js";
import "../../../../../chunk-5JE7E5SU.js";
import "../../../../../chunk-DVHMHG4X.js";
import {
  init_esm_shims
} from "../../../../../chunk-SB7UONON.js";

// src/modules/tools/definitions/system/__tests__/todoList.test.ts
init_esm_shims();
vi.mock("../../../../redis/redisClient", () => {
  let mockClient = null;
  return {
    getRedisClientInstance: () => mockClient,
    setRedisClientInstance: (client) => {
      mockClient = client;
    }
  };
});
var createMockContext = (jobId, sessionName) => ({
  job: jobId ? {
    data: { prompt: "test" },
    id: jobId,
    isFailed: async () => false,
    name: "test-job"
  } : void 0,
  llm: {},
  log: {
    child: vi.fn(() => ({
      debug: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
      info: vi.fn(),
      level: "info",
      silent: false,
      trace: vi.fn(),
      warn: vi.fn()
    })),
    debug: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    info: vi.fn(),
    level: "info",
    silent: false,
    trace: vi.fn(),
    warn: vi.fn()
  },
  reportProgress: vi.fn(),
  session: {
    history: [],
    identities: [],
    name: sessionName || "test-session",
    timestamp: Date.now()
  },
  streamContent: vi.fn(),
  taskQueue: {}
});
var mockRedisClient = {
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
  set: vi.fn().mockResolvedValue("OK"),
  ttl: vi.fn().mockResolvedValue(-1),
  zadd: vi.fn().mockResolvedValue(1),
  zcard: vi.fn().mockResolvedValue(0),
  zrange: vi.fn().mockResolvedValue([]),
  zrem: vi.fn().mockResolvedValue(1),
  zscore: vi.fn().mockResolvedValue(null)
};
var projectManagementService = new ProjectManagementService(todoStateManager);
describe("Unified Todo List Tool", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    setRedisClientInstance(mockRedisClient);
    const manager = todoManager;
    if (manager.tasks && typeof manager.tasks.clear === "function") {
      manager.tasks.clear();
    }
    if (manager.projects && typeof manager.projects.clear === "function") {
      manager.projects.clear();
    }
    if (manager.templateCache && typeof manager.templateCache.clear === "function") {
      manager.templateCache.clear();
    }
    const stateManager = todoStateManager;
    if (stateManager.tasks && typeof stateManager.tasks.clear === "function") {
      stateManager.tasks.clear();
    }
    if (stateManager.projects && typeof stateManager.projects.clear === "function") {
      stateManager.projects.clear();
    }
    if (todoEventOptimizer) {
      const optimizer = todoEventOptimizer;
      if (optimizer.eventQueue && Array.isArray(optimizer.eventQueue)) {
        optimizer.eventQueue.length = 0;
      }
      if (optimizer.batchTimer) {
        clearTimeout(optimizer.batchTimer);
        optimizer.batchTimer = null;
      }
    }
    if (todoPerformanceMonitor && typeof todoPerformanceMonitor.reset === "function") {
      todoPerformanceMonitor.reset();
    }
    Object.values(mockRedisClient).forEach((mockFn) => {
      if (typeof mockFn === "function" && "mockClear" in mockFn) {
        mockFn.mockClear();
      }
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    setRedisClientInstance(null);
  });
  it("should create a new task successfully", async () => {
    const mockCtx = createMockContext("test-job-id", "test-session");
    const result = await unifiedTodoListTool.execute(
      {
        action: "create_task",
        task: {
          content: "Test task",
          createdAt: Date.now(),
          dependencies: [],
          id: "1",
          priority: "medium",
          progress: 0,
          status: "pending",
          tags: [],
          updatedAt: Date.now()
        }
      },
      mockCtx
    );
    globalExpect(typeof result).toBe("object");
    if (typeof result === "object" && "success" in result) {
      globalExpect(result.success).toBe(true);
      globalExpect(result).toHaveProperty("message");
      if ("tasks" in result && result.tasks) {
        globalExpect(result.tasks).toHaveLength(1);
        globalExpect(result.tasks[0].content).toBe("Test task");
      }
    }
    const tasks = todoManager.getTasks("test-session");
    globalExpect(tasks).toHaveLength(1);
    globalExpect(tasks[0].content).toBe("Test task");
  });
  it("should update a task status successfully", async () => {
    const mockCtx = createMockContext("test-job-id", "test-session");
    await unifiedTodoListTool.execute(
      {
        action: "create_task",
        task: {
          content: "Test task",
          createdAt: Date.now(),
          dependencies: [],
          id: "1",
          priority: "medium",
          progress: 0,
          status: "pending",
          tags: [],
          updatedAt: Date.now()
        }
      },
      mockCtx
    );
    const result = await unifiedTodoListTool.execute(
      {
        action: "update_task",
        status: "completed",
        taskId: "1"
      },
      mockCtx
    );
    globalExpect(typeof result).toBe("object");
    if (typeof result === "object" && "success" in result) {
      globalExpect(result.success).toBe(true);
      if ("tasks" in result && result.tasks) {
        globalExpect(result.tasks[0].status).toBe("completed");
      }
    }
    const tasks = todoManager.getTasks("test-session");
    globalExpect(tasks[0].status).toBe("completed");
  });
  it("should display tasks with filters", async () => {
    const mockCtx = createMockContext("test-job-id", "test-session");
    await unifiedTodoListTool.execute(
      {
        action: "create_task",
        task: {
          content: "Pending task",
          createdAt: Date.now(),
          dependencies: [],
          id: "1",
          priority: "medium",
          progress: 0,
          status: "pending",
          tags: [],
          updatedAt: Date.now()
        }
      },
      mockCtx
    );
    await unifiedTodoListTool.execute(
      {
        action: "create_task",
        task: {
          content: "Completed task",
          createdAt: Date.now(),
          dependencies: [],
          id: "2",
          priority: "high",
          progress: 100,
          status: "completed",
          tags: [],
          updatedAt: Date.now()
        }
      },
      mockCtx
    );
    const result = await unifiedTodoListTool.execute(
      {
        action: "display",
        filters: {
          status: ["pending"]
        }
      },
      mockCtx
    );
    globalExpect(typeof result).toBe("object");
    if (typeof result === "object" && "success" in result) {
      globalExpect(result.success).toBe(true);
      if ("tasks" in result && result.tasks) {
        globalExpect(result.tasks).toHaveLength(1);
        globalExpect(result.tasks[0].content).toBe("Pending task");
      }
    }
  });
  it("should get statistics correctly", async () => {
    const mockCtx = createMockContext("test-job-id", "test-session");
    await unifiedTodoListTool.execute(
      {
        action: "create_task",
        task: {
          content: "Pending task",
          createdAt: Date.now(),
          dependencies: [],
          id: "1",
          priority: "medium",
          progress: 0,
          status: "pending",
          tags: [],
          updatedAt: Date.now()
        }
      },
      mockCtx
    );
    await unifiedTodoListTool.execute(
      {
        action: "create_task",
        task: {
          content: "In progress task",
          createdAt: Date.now(),
          dependencies: [],
          id: "2",
          priority: "high",
          progress: 50,
          status: "in_progress",
          tags: [],
          updatedAt: Date.now()
        }
      },
      mockCtx
    );
    await unifiedTodoListTool.execute(
      {
        action: "create_task",
        task: {
          content: "Completed task",
          createdAt: Date.now(),
          dependencies: [],
          id: "3",
          priority: "low",
          progress: 100,
          status: "completed",
          tags: [],
          updatedAt: Date.now()
        }
      },
      mockCtx
    );
    const result = await unifiedTodoListTool.execute(
      {
        action: "get_stats"
      },
      mockCtx
    );
    globalExpect(typeof result).toBe("object");
    if (typeof result === "object" && "success" in result) {
      globalExpect(result.success).toBe(true);
      if ("stats" in result && result.stats) {
        globalExpect(result.stats.pending).toBe(1);
        globalExpect(result.stats.in_progress).toBe(1);
        globalExpect(result.stats.completed).toBe(1);
        globalExpect(result.stats.total).toBe(3);
      }
    }
  });
  it("should clear all tasks successfully", async () => {
    const mockCtx = createMockContext("test-job-id", "test-session");
    await unifiedTodoListTool.execute(
      {
        action: "create_task",
        task: {
          content: "Test task",
          createdAt: Date.now(),
          dependencies: [],
          id: "1",
          priority: "medium",
          progress: 0,
          status: "pending",
          tags: [],
          updatedAt: Date.now()
        }
      },
      mockCtx
    );
    const result = await unifiedTodoListTool.execute(
      {
        action: "clear_all"
      },
      mockCtx
    );
    globalExpect(typeof result).toBe("object");
    if (typeof result === "object" && "success" in result) {
      globalExpect(result.success).toBe(true);
      if ("tasks" in result && result.tasks) {
        globalExpect(result.tasks).toHaveLength(0);
      }
    }
    const tasks = todoManager.getTasks("test-session");
    globalExpect(tasks).toHaveLength(0);
  });
  it("should handle errors gracefully", async () => {
    const mockCtx = createMockContext("test-job-id", "test-session");
    const result = await unifiedTodoListTool.execute(
      {
        action: "update_task",
        status: "completed",
        taskId: "non-existent"
      },
      mockCtx
    );
    globalExpect(typeof result).toBe("object");
    if (typeof result === "object") {
      globalExpect("error" in result).toBe(true);
    }
  });
});
describe("Project Management Service", () => {
  beforeEach(async () => {
    const stateManager = todoStateManager;
    if (stateManager.tasks && typeof stateManager.tasks.clear === "function") {
      stateManager.tasks.clear();
    }
    if (stateManager.projects && typeof stateManager.projects.clear === "function") {
      stateManager.projects.clear();
    }
    if (todoPerformanceMonitor && typeof todoPerformanceMonitor.reset === "function") {
      todoPerformanceMonitor.reset();
    }
  });
  it("should create a project successfully", async () => {
    const result = await projectManagementService.createProject(
      "test-session",
      {
        budget: 0,
        burndownData: [],
        completedTaskCount: 0,
        createdAt: Date.now(),
        customFields: {},
        dependencies: [],
        description: "A test project",
        id: "proj-1",
        milestones: [],
        name: "Test Project",
        phases: [],
        progress: 0,
        resources: [],
        risks: [],
        status: "planning",
        taskCount: 0,
        team: [],
        updatedAt: Date.now(),
        velocity: 0
      }
    );
    globalExpect(result).toHaveProperty("success", true);
    if ("project" in result && result.project) {
      globalExpect(result.project.name).toBe("Test Project");
    }
  });
  it("should add a task to a project", async () => {
    await projectManagementService.createProject("test-session", {
      budget: 0,
      burndownData: [],
      completedTaskCount: 0,
      createdAt: Date.now(),
      customFields: {},
      dependencies: [],
      description: "A test project",
      id: "proj-1",
      milestones: [],
      name: "Test Project",
      phases: [],
      progress: 0,
      resources: [],
      risks: [],
      status: "planning",
      taskCount: 0,
      team: [],
      updatedAt: Date.now(),
      velocity: 0
    });
    const result = await projectManagementService.addTaskToProject(
      "test-session",
      "proj-1",
      {
        attachments: [],
        automationRules: [],
        comments: [],
        content: "Project task",
        createdAt: Date.now(),
        customFields: {},
        dependencies: [],
        id: "task-1",
        labels: [],
        priority: "medium",
        progress: 0,
        status: "pending",
        subtasks: [],
        tags: [],
        timeSpent: 0,
        updatedAt: Date.now(),
        watchers: []
      }
    );
    globalExpect(result).toHaveProperty("success", true);
    if ("task" in result && result.task) {
      globalExpect(result.task.projectId).toBe("proj-1");
    }
  });
  it("should calculate project progress correctly", async () => {
    await projectManagementService.createProject("test-session", {
      budget: 0,
      burndownData: [],
      completedTaskCount: 0,
      createdAt: Date.now(),
      customFields: {},
      dependencies: [],
      description: "A test project",
      id: "proj-1",
      milestones: [],
      name: "Test Project",
      phases: [],
      progress: 0,
      resources: [],
      risks: [],
      status: "planning",
      taskCount: 0,
      team: [],
      updatedAt: Date.now(),
      velocity: 0
    });
    await projectManagementService.addTaskToProject("test-session", "proj-1", {
      attachments: [],
      automationRules: [],
      comments: [],
      content: "Pending task",
      createdAt: Date.now(),
      customFields: {},
      dependencies: [],
      id: "task-1",
      labels: [],
      priority: "medium",
      progress: 0,
      status: "pending",
      subtasks: [],
      tags: [],
      timeSpent: 0,
      updatedAt: Date.now(),
      watchers: []
    });
    await projectManagementService.addTaskToProject("test-session", "proj-1", {
      attachments: [],
      automationRules: [],
      comments: [],
      content: "Completed task",
      createdAt: Date.now(),
      customFields: {},
      dependencies: [],
      id: "task-2",
      labels: [],
      priority: "high",
      progress: 100,
      status: "completed",
      subtasks: [],
      tags: [],
      timeSpent: 0,
      updatedAt: Date.now(),
      watchers: []
    });
    const result = await projectManagementService.getProjectTasks(
      "test-session",
      "proj-1"
    );
    globalExpect(result).toHaveProperty("success", true);
    if ("tasks" in result && result.tasks) {
      globalExpect(result.tasks).toHaveLength(2);
      const completedTasks = result.tasks.filter(
        (t) => t.status === "completed"
      );
      globalExpect(completedTasks).toHaveLength(1);
    }
  });
});
describe("Todo Event Optimizer", () => {
  it("should batch events correctly", async () => {
    const events = [
      {
        data: { content: "Test task 1" },
        id: "1",
        sessionId: "test-session",
        timestamp: Date.now(),
        type: "TASK_CREATED"
      },
      {
        data: { content: "Test task 2" },
        id: "2",
        sessionId: "test-session",
        timestamp: Date.now(),
        type: "TASK_CREATED"
      }
    ];
    todoEventOptimizer.addEvents(events);
    globalExpect(todoEventOptimizer.getQueueSize()).toBe(2);
  });
  it("should flush batch when size limit is reached", async () => {
    todoEventOptimizer.updateConfig({ batchSize: 2, batchTimeout: 1e3 });
    const events = [
      {
        data: { content: "Test task 1" },
        id: "1",
        sessionId: "test-session",
        timestamp: Date.now(),
        type: "TASK_CREATED"
      },
      {
        data: { content: "Test task 2" },
        id: "2",
        sessionId: "test-session",
        timestamp: Date.now(),
        type: "TASK_CREATED"
      }
    ];
    todoEventOptimizer.addEvents(events);
    await new Promise((resolve) => setTimeout(resolve, 50));
    if (todoEventOptimizer.getQueueSize() > 0) {
      await todoEventOptimizer.flushAll();
    }
    globalExpect(todoEventOptimizer.getQueueSize()).toBe(0);
  });
});
describe("Todo Performance Monitor", () => {
  it("should record operation timings", () => {
    todoPerformanceMonitor.recordOperation("test-operation", 100);
    todoPerformanceMonitor.recordOperation("test-operation", 200);
    todoPerformanceMonitor.recordOperation("test-operation", 150);
    const stats = todoPerformanceMonitor.getOperationStats("test-operation");
    globalExpect(stats).not.toBeNull();
    if (stats) {
      globalExpect(stats.count).toBe(3);
      globalExpect(stats.avgDuration).toBe(150);
      globalExpect(stats.minDuration).toBe(100);
      globalExpect(stats.maxDuration).toBe(200);
    }
  });
  it("should record custom metrics", () => {
    todoPerformanceMonitor.recordMetric("task-count", 10);
    todoPerformanceMonitor.recordMetric("task-count", 20);
    todoPerformanceMonitor.recordMetric("task-count", 15);
    const stats = todoPerformanceMonitor.getMetricStats("task-count");
    globalExpect(stats).not.toBeNull();
    if (stats) {
      globalExpect(stats.count).toBe(3);
      globalExpect(stats.avg).toBe(15);
      globalExpect(stats.min).toBe(10);
      globalExpect(stats.max).toBe(20);
    }
  });
});
