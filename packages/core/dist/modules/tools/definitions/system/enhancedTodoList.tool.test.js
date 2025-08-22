import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  enhancedTodoListTool
} from "../../../../chunk-E4LGBTIT.js";
import {
  sendToCanvas
} from "../../../../chunk-KBBD5YYX.js";
import {
  beforeEach,
  describe,
  globalExpect,
  it,
  vi
} from "../../../../chunk-AQKYZ7X3.js";
import "../../../../chunk-SIBAPVHV.js";
import "../../../../chunk-E5QXXMSG.js";
import "../../../../chunk-6NLBXREQ.js";
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
    job: jobId ? { id: jobId, data: { prompt: "test" }, isFailed: async () => false, name: "test-job" } : void 0,
    log: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      fatal: vi.fn(),
      trace: vi.fn(),
      level: "info",
      silent: false,
      child: vi.fn(() => ({
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        fatal: vi.fn(),
        trace: vi.fn(),
        level: "info",
        silent: false
      }))
    },
    streamContent: vi.fn(),
    reportProgress: vi.fn(),
    session: { history: [], identities: [], name: "test-session", timestamp: Date.now() },
    taskQueue: {},
    llm: { getErrorType: () => "UNKNOWN", getLlmResponse: async () => "test" }
  });
  it("should have correct name and description", () => {
    globalExpect(enhancedTodoListTool.name).toBe("enhanced_todo_list");
    globalExpect(enhancedTodoListTool.description).toContain("Manages enhanced todo lists");
  });
  it("should create a new project successfully", async () => {
    const mockCtx = createMockContext("test-job-id");
    const project = {
      id: "project-1",
      name: "Duke Nukem 2 Development",
      description: "Creating the Duke Nukem 2 game",
      status: "planning",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      progress: 0,
      totalTasks: 0,
      completedTasks: 0
    };
    const result = await enhancedTodoListTool.execute({
      action: "create_project",
      project,
      title: "Duke Nukem 2 Project"
    }, mockCtx);
    globalExpect(result).toHaveProperty("success", true);
    globalExpect(result).toHaveProperty("project");
    if ("project" in result && result.project) {
      globalExpect(result.project.name).toBe("Duke Nukem 2 Development");
    }
    globalExpect(sendToCanvas).toHaveBeenCalled();
    globalExpect(mockCtx.log.info).toHaveBeenCalledWith("Created project: Duke Nukem 2 Development");
  });
  it("should create new tasks successfully", async () => {
    const mockCtx = createMockContext("test-job-id");
    const tasks = [
      {
        id: "1",
        content: "Design game levels",
        status: "pending",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: "2",
        content: "Create character sprites",
        status: "in_progress",
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];
    const result = await enhancedTodoListTool.execute({
      action: "create_task",
      tasks,
      title: "Game Development Tasks"
    }, mockCtx);
    globalExpect(result).toHaveProperty("success", true);
    globalExpect(result).toHaveProperty("tasks");
    if ("tasks" in result && result.tasks) {
      globalExpect(result.tasks).toHaveLength(2);
      globalExpect(result.tasks[0].content).toBe("Design game levels");
    }
    globalExpect(sendToCanvas).toHaveBeenCalledWith("test-job-id", globalExpect.stringContaining('"type":"enhanced_todo_list"'), "text");
    globalExpect(mockCtx.log.info).toHaveBeenCalledWith("Created 2 tasks");
  });
  it("should update task status successfully", async () => {
    const mockCtx = createMockContext("test-job-id");
    await enhancedTodoListTool.execute({
      action: "create_task",
      tasks: [{
        id: "1",
        content: "Design game levels",
        status: "pending",
        createdAt: Date.now(),
        updatedAt: Date.now()
      }]
    }, mockCtx);
    vi.clearAllMocks();
    const result = await enhancedTodoListTool.execute({
      action: "update_task",
      taskId: "1",
      status: "completed"
    }, mockCtx);
    globalExpect(result).toHaveProperty("success", true);
    if ("tasks" in result && result.tasks) {
      globalExpect(result.tasks[0].status).toBe("completed");
    }
    globalExpect(sendToCanvas).toHaveBeenCalledWith("test-job-id", globalExpect.stringContaining('"type":"enhanced_todo_list"'), "text");
    globalExpect(mockCtx.log.info).toHaveBeenCalledWith("Updated task 1 to status completed");
  });
  it("should display tasks successfully", async () => {
    const mockCtx = createMockContext("test-job-id");
    const result = await enhancedTodoListTool.execute({
      action: "create_task",
      tasks: [
        {
          id: "1",
          content: "Design game levels",
          status: "pending",
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: "2",
          content: "Create character sprites",
          status: "completed",
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ],
      title: "My Game Tasks"
    }, mockCtx);
    globalExpect(result).toHaveProperty("success", true);
    globalExpect(result).toHaveProperty("message", "Created 2 tasks successfully");
    globalExpect(sendToCanvas).toHaveBeenCalledWith("test-job-id", globalExpect.stringContaining('"type":"enhanced_todo_list"'), "text");
  });
  it("should clear tasks and project successfully", async () => {
    const mockCtx = createMockContext("test-job-id");
    await enhancedTodoListTool.execute({
      action: "create_task",
      tasks: [{
        id: "1",
        content: "Design game levels",
        status: "pending",
        createdAt: Date.now(),
        updatedAt: Date.now()
      }]
    }, mockCtx);
    const result = await enhancedTodoListTool.execute({
      action: "clear"
    }, mockCtx);
    globalExpect(result).toHaveProperty("success", true);
    globalExpect(result).toHaveProperty("message", "Todo list and project cleared");
    if ("tasks" in result && result.tasks) {
      globalExpect(result.tasks).toHaveLength(0);
    }
    globalExpect(mockCtx.log.info).toHaveBeenCalledWith("Cleared todo list and project");
  });
  it("should handle errors when updating non-existent task", async () => {
    const mockCtx = createMockContext("test-job-id");
    const result = await enhancedTodoListTool.execute({
      action: "update_task",
      taskId: "non-existent",
      status: "completed"
    }, mockCtx);
    globalExpect(result).toHaveProperty("error");
    if ("error" in result) {
      globalExpect(result.error).toContain("not found");
    }
  });
  it("should handle missing parameters for create_task action", async () => {
    const mockCtx = createMockContext("test-job-id");
    const result = await enhancedTodoListTool.execute({
      action: "create_task"
    }, mockCtx);
    globalExpect(result).toHaveProperty("error", "No tasks provided for create_task action");
  });
  it("should handle missing parameters for update_task action", async () => {
    const mockCtx = createMockContext("test-job-id");
    const result = await enhancedTodoListTool.execute({
      action: "update_task"
    }, mockCtx);
    globalExpect(result).toHaveProperty("error", "No taskId provided for update_task action");
  });
  it("should work without job ID (no canvas display)", async () => {
    const mockCtx = createMockContext();
    const result = await enhancedTodoListTool.execute({
      action: "create_task",
      tasks: [{
        id: "1",
        content: "Design game levels",
        status: "pending",
        createdAt: Date.now(),
        updatedAt: Date.now()
      }]
    }, mockCtx);
    globalExpect(result).toHaveProperty("success", true);
    globalExpect(sendToCanvas).not.toHaveBeenCalled();
  });
  it("should handle state recovery", async () => {
    const mockCtx = createMockContext("test-job-id");
    const result = await enhancedTodoListTool.execute({
      action: "recover_state"
    }, mockCtx);
    globalExpect(result).toHaveProperty("success", true);
    globalExpect(result).toHaveProperty("message", "State loaded successfully");
    if ("recoveryStatus" in result) {
      globalExpect(result.recoveryStatus).toBeDefined();
    }
  });
});
