import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  manageTodoListTool
} from "../../../../chunk-P4LGSB2Q.js";
import {
  beforeEach,
  describe,
  globalExpect,
  it,
  vi
} from "../../../../chunk-AQKYZ7X3.js";
import {
  getRedisClientInstance
} from "../../../../chunk-2TWFUMQU.js";
import "../../../../chunk-5JE7E5SU.js";
import "../../../../chunk-DVHMHG4X.js";
import {
  init_esm_shims
} from "../../../../chunk-SB7UONON.js";

// src/modules/tools/definitions/system/manageTodoList.tool.test.ts
init_esm_shims();
var mockPublish = vi.fn();
vi.mock("../../../../modules/redis/redisClient.ts", () => ({
  getRedisClientInstance: vi.fn(() => ({
    publish: mockPublish
  }))
}));
describe("manageTodoListTool", () => {
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
    globalExpect(manageTodoListTool.name).toBe("manage_todo_list");
    globalExpect(manageTodoListTool.description).toContain("Manages a todo list");
  });
  it("should create new todos successfully", async () => {
    const mockCtx = createMockContext("test-job-id");
    const todos = [
      { content: "Task 1", id: "1", status: "pending" },
      { content: "Task 2", id: "2", status: "in_progress" }
    ];
    const result = await manageTodoListTool.execute(
      {
        action: "create",
        title: "Test Todo List",
        todos
      },
      mockCtx
    );
    globalExpect(result).toHaveProperty("success", true);
    globalExpect(result).toHaveProperty("todos");
    if ("todos" in result && result.todos) {
      globalExpect(result.todos).toHaveLength(2);
      globalExpect(result.todos[0].content).toBe("Task 1");
    }
    globalExpect(getRedisClientInstance).toHaveBeenCalled();
    globalExpect(mockPublish).toHaveBeenCalledWith(
      "job:test-job-id:events",
      globalExpect.stringContaining('"type":"chat_header_todo"')
    );
    globalExpect(mockCtx.log.info).toHaveBeenCalledWith(
      "Created 2 todos for native interface"
    );
  });
  it("should update todo status successfully", async () => {
    const mockCtx = createMockContext("test-job-id");
    await manageTodoListTool.execute(
      {
        action: "create",
        todos: [{ content: "Task 1", id: "1", status: "pending" }]
      },
      mockCtx
    );
    vi.clearAllMocks();
    const result = await manageTodoListTool.execute(
      {
        action: "update",
        itemId: "1",
        status: "completed"
      },
      mockCtx
    );
    globalExpect(result).toHaveProperty("success", true);
    if ("todos" in result && result.todos) {
      globalExpect(result.todos[0].status).toBe("completed");
    }
    globalExpect(getRedisClientInstance).toHaveBeenCalled();
    globalExpect(mockPublish).toHaveBeenCalledWith(
      "job:test-job-id:events",
      globalExpect.stringContaining('"type":"chat_header_todo"')
    );
    globalExpect(mockCtx.log.info).toHaveBeenCalledWith(
      "Updated todo 1 to status completed"
    );
  });
  it("should display todos successfully", async () => {
    const mockCtx = createMockContext("test-job-id");
    const result = await manageTodoListTool.execute(
      {
        action: "create",
        title: "My Tasks",
        todos: [
          { content: "Task 1", id: "1", status: "pending" },
          { content: "Task 2", id: "2", status: "completed" }
        ]
      },
      mockCtx
    );
    globalExpect(result).toHaveProperty("success", true);
    globalExpect(result).toHaveProperty("message", "Created 2 todo items");
    globalExpect(getRedisClientInstance).toHaveBeenCalled();
    globalExpect(mockPublish).toHaveBeenCalledWith(
      "job:test-job-id:events",
      globalExpect.stringContaining('"type":"chat_header_todo"')
    );
  });
  it("should clear todos successfully", async () => {
    const mockCtx = createMockContext("test-job-id");
    await manageTodoListTool.execute(
      {
        action: "create",
        todos: [{ content: "Task 1", id: "1", status: "pending" }]
      },
      mockCtx
    );
    const result = await manageTodoListTool.execute(
      {
        action: "clear"
      },
      mockCtx
    );
    globalExpect(result).toHaveProperty("success", true);
    globalExpect(result).toHaveProperty("message", "Todo list cleared");
    if ("todos" in result && result.todos) {
      globalExpect(result.todos).toHaveLength(0);
    }
    globalExpect(mockCtx.log.info).toHaveBeenCalledWith("Todo list cleared");
  });
  it("should handle errors when updating non-existent todo", async () => {
    const mockCtx = createMockContext("test-job-id");
    const result = await manageTodoListTool.execute(
      {
        action: "update",
        itemId: "non-existent",
        status: "completed"
      },
      mockCtx
    );
    globalExpect(result).toHaveProperty("error");
    if ("error" in result) {
      globalExpect(result.error).toContain("not found");
    }
  });
  it("should handle missing parameters for create action", async () => {
    const mockCtx = createMockContext("test-job-id");
    const result = await manageTodoListTool.execute(
      {
        action: "create"
      },
      mockCtx
    );
    globalExpect(result).toHaveProperty(
      "error",
      "No todos provided for create action"
    );
  });
  it("should handle missing parameters for update action", async () => {
    const mockCtx = createMockContext("test-job-id");
    const result = await manageTodoListTool.execute(
      {
        action: "update"
      },
      mockCtx
    );
    globalExpect(result).toHaveProperty(
      "error",
      "Item ID and status are required for update action"
    );
  });
  it("should work without job ID (no canvas display)", async () => {
    const mockCtx = createMockContext();
    const result = await manageTodoListTool.execute(
      {
        action: "create",
        todos: [{ content: "Task 1", id: "1", status: "pending" }]
      },
      mockCtx
    );
    globalExpect(result).toHaveProperty("success", true);
    globalExpect(getRedisClientInstance).not.toHaveBeenCalled();
  });
});
