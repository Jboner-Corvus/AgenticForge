import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  enhancedTodoListTool
} from "../../../../chunk-VGWB5JHI.js";
import "../../../../chunk-FG6D2ATS.js";
import {
  sendToCanvas
} from "../../../../chunk-5OJML75I.js";
import {
  beforeEach,
  describe,
  globalExpect,
  it,
  vi
} from "../../../../chunk-AQKYZ7X3.js";
import "../../../../chunk-2TWFUMQU.js";
import "../../../../chunk-5JE7E5SU.js";
import "../../../../chunk-DVHMHG4X.js";
import {
  init_esm_shims
} from "../../../../chunk-SB7UONON.js";

// src/modules/tools/definitions/system/enhancedTodoList.tool.test.ts
init_esm_shims();
vi.mock("../../../../utils/canvasUtils.ts", () => ({
  sendToCanvas: vi.fn()
}));
vi.mock("../../../../modules/redis/redisClient.ts", () => ({
  getRedisClientInstance: vi.fn(() => ({
    publish: vi.fn()
  }))
}));
describe("enhancedTodoListTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  const createMockContext = (jobId) => ({
    job: jobId ? {
      data: { prompt: "test" },
      id: jobId,
      isFailed: async () => false,
      name: "test-job"
    } : void 0,
    llm: {
      getErrorType: () => "UNKNOWN",
      getLlmResponse: async () => "test"
    },
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
      name: "test-session",
      timestamp: Date.now()
    },
    streamContent: vi.fn(),
    taskQueue: {}
  });
  it("should have correct name and description", () => {
    globalExpect(enhancedTodoListTool.name).toBe("enhanced_todo_list");
    globalExpect(enhancedTodoListTool.description).toContain(
      "Manages enhanced todo lists"
    );
  });
  it("should create a new project successfully", async () => {
    const mockCtx = createMockContext("test-job-id");
    const project = {
      completedTasks: 0,
      createdAt: Date.now(),
      description: "Creating the Duke Nukem 2 game",
      id: "project-1",
      name: "Duke Nukem 2 Development",
      progress: 0,
      status: "planning",
      totalTasks: 0,
      updatedAt: Date.now()
    };
    const result = await enhancedTodoListTool.execute(
      {
        action: "create_project",
        project,
        title: "Duke Nukem 2 Project"
      },
      mockCtx
    );
    globalExpect(result).toHaveProperty("success", true);
    globalExpect(result).toHaveProperty("project");
    if ("project" in result && result.project) {
      globalExpect(result.project.name).toBe("Duke Nukem 2 Development");
    }
    globalExpect(sendToCanvas).toHaveBeenCalled();
    globalExpect(mockCtx.log.info).toHaveBeenCalledWith(
      "Created project: Duke Nukem 2 Development"
    );
  });
  it("should create new tasks successfully", async () => {
    const mockCtx = createMockContext("test-job-id");
    const tasks = [
      {
        content: "Design game levels",
        createdAt: Date.now(),
        id: "1",
        status: "pending",
        updatedAt: Date.now()
      },
      {
        content: "Create character sprites",
        createdAt: Date.now(),
        id: "2",
        status: "in_progress",
        updatedAt: Date.now()
      }
    ];
    const result = await enhancedTodoListTool.execute(
      {
        action: "create_task",
        tasks,
        title: "Game Development Tasks"
      },
      mockCtx
    );
    globalExpect(result).toHaveProperty("success", true);
    globalExpect(result).toHaveProperty("tasks");
    if ("tasks" in result && result.tasks) {
      globalExpect(result.tasks).toHaveLength(2);
      globalExpect(result.tasks[0].content).toBe("Design game levels");
    }
    globalExpect(sendToCanvas).toHaveBeenCalledWith(
      "test-job-id",
      globalExpect.stringContaining('"type":"enhanced_todo_list"'),
      "text"
    );
    globalExpect(mockCtx.log.info).toHaveBeenCalledWith("Created 2 tasks");
  });
  it("should update task status successfully", async () => {
    const mockCtx = createMockContext("test-job-id");
    await enhancedTodoListTool.execute(
      {
        action: "create_task",
        tasks: [
          {
            content: "Design game levels",
            createdAt: Date.now(),
            id: "1",
            status: "pending",
            updatedAt: Date.now()
          }
        ]
      },
      mockCtx
    );
    vi.clearAllMocks();
    const result = await enhancedTodoListTool.execute(
      {
        action: "update_task",
        status: "completed",
        taskId: "1"
      },
      mockCtx
    );
    globalExpect(result).toHaveProperty("success", true);
    if ("tasks" in result && result.tasks) {
      globalExpect(result.tasks[0].status).toBe("completed");
    }
    globalExpect(sendToCanvas).toHaveBeenCalledWith(
      "test-job-id",
      globalExpect.stringContaining('"type":"enhanced_todo_list"'),
      "text"
    );
    globalExpect(mockCtx.log.info).toHaveBeenCalledWith(
      "Updated task 1 to status completed"
    );
  });
  it("should display tasks successfully", async () => {
    const mockCtx = createMockContext("test-job-id");
    const result = await enhancedTodoListTool.execute(
      {
        action: "create_task",
        tasks: [
          {
            content: "Design game levels",
            createdAt: Date.now(),
            id: "1",
            status: "pending",
            updatedAt: Date.now()
          },
          {
            content: "Create character sprites",
            createdAt: Date.now(),
            id: "2",
            status: "completed",
            updatedAt: Date.now()
          }
        ],
        title: "My Game Tasks"
      },
      mockCtx
    );
    globalExpect(result).toHaveProperty("success", true);
    globalExpect(result).toHaveProperty("message", "Created 2 tasks successfully");
    globalExpect(sendToCanvas).toHaveBeenCalledWith(
      "test-job-id",
      globalExpect.stringContaining('"type":"enhanced_todo_list"'),
      "text"
    );
  });
  it("should clear tasks and project successfully", async () => {
    const mockCtx = createMockContext("test-job-id");
    await enhancedTodoListTool.execute(
      {
        action: "create_task",
        tasks: [
          {
            content: "Design game levels",
            createdAt: Date.now(),
            id: "1",
            status: "pending",
            updatedAt: Date.now()
          }
        ]
      },
      mockCtx
    );
    const result = await enhancedTodoListTool.execute(
      {
        action: "clear"
      },
      mockCtx
    );
    globalExpect(result).toHaveProperty("success", true);
    globalExpect(result).toHaveProperty("message", "Todo list and project cleared");
    if ("tasks" in result && result.tasks) {
      globalExpect(result.tasks).toHaveLength(0);
    }
    globalExpect(mockCtx.log.info).toHaveBeenCalledWith(
      "Cleared todo list and project"
    );
  });
  it("should handle errors when updating non-existent task", async () => {
    const mockCtx = createMockContext("test-job-id");
    const result = await enhancedTodoListTool.execute(
      {
        action: "update_task",
        status: "completed",
        taskId: "non-existent"
      },
      mockCtx
    );
    globalExpect(result).toHaveProperty("error");
    if ("error" in result) {
      globalExpect(result.error).toContain("not found");
    }
  });
  it("should handle missing parameters for create_task action", async () => {
    const mockCtx = createMockContext("test-job-id");
    const result = await enhancedTodoListTool.execute(
      {
        action: "create_task"
      },
      mockCtx
    );
    globalExpect(result).toHaveProperty(
      "error",
      "No tasks provided for create_task action"
    );
  });
  it("should handle missing parameters for update_task action", async () => {
    const mockCtx = createMockContext("test-job-id");
    const result = await enhancedTodoListTool.execute(
      {
        action: "update_task"
      },
      mockCtx
    );
    globalExpect(result).toHaveProperty(
      "error",
      "No taskId provided for update_task action"
    );
  });
  it("should work without job ID (no canvas display)", async () => {
    const mockCtx = createMockContext();
    const result = await enhancedTodoListTool.execute(
      {
        action: "create_task",
        tasks: [
          {
            content: "Design game levels",
            createdAt: Date.now(),
            id: "1",
            status: "pending",
            updatedAt: Date.now()
          }
        ]
      },
      mockCtx
    );
    globalExpect(result).toHaveProperty("success", true);
    globalExpect(sendToCanvas).not.toHaveBeenCalled();
  });
  it("should handle state recovery", async () => {
    const mockCtx = createMockContext("test-job-id");
    const result = await enhancedTodoListTool.execute(
      {
        action: "recover_state"
      },
      mockCtx
    );
    globalExpect(result).toHaveProperty("success", true);
    globalExpect(result).toHaveProperty("message", "State loaded successfully");
    if ("recoveryStatus" in result) {
      globalExpect(result.recoveryStatus).toBeDefined();
    }
  });
});
