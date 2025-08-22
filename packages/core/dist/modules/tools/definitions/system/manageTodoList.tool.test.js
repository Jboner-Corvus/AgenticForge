import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  manageTodoListTool
} from "../../../../chunk-GNM57R4S.js";
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

// src/modules/tools/definitions/system/manageTodoList.tool.test.ts
init_esm_shims();
vi.mock("../../../../utils/canvasUtils.ts", () => ({
  sendToCanvas: vi.fn()
}));
vi.mock("../../../../modules/redis/redisClient.ts", () => ({
  getRedisClientInstance: vi.fn(() => ({
    publish: vi.fn()
  }))
}));
describe("manageTodoListTool", () => {
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
    globalExpect(manageTodoListTool.name).toBe("manage_todo_list");
    globalExpect(manageTodoListTool.description).toContain("Manages a todo list");
  });
  it("should create new todos successfully", async () => {
    const mockCtx = createMockContext("test-job-id");
    const todos = [
      { id: "1", content: "Task 1", status: "pending" },
      { id: "2", content: "Task 2", status: "in_progress" }
    ];
    const result = await manageTodoListTool.execute({
      action: "create",
      todos,
      title: "Test Todo List"
    }, mockCtx);
    globalExpect(result).toHaveProperty("success", true);
    globalExpect(result).toHaveProperty("todos");
    if ("todos" in result && result.todos) {
      globalExpect(result.todos).toHaveLength(2);
      globalExpect(result.todos[0].content).toBe("Task 1");
    }
    globalExpect(sendToCanvas).toHaveBeenCalledWith("test-job-id", globalExpect.stringContaining("<!DOCTYPE html>"), "html");
    globalExpect(sendToCanvas).toHaveBeenCalledWith("test-job-id", globalExpect.stringContaining('"type":"todo_list"'), "json");
    globalExpect(mockCtx.log.info).toHaveBeenCalledWith("Created 2 todos");
  });
  it("should update todo status successfully", async () => {
    const mockCtx = createMockContext("test-job-id");
    await manageTodoListTool.execute({
      action: "create",
      todos: [{ id: "1", content: "Task 1", status: "pending" }]
    }, mockCtx);
    vi.clearAllMocks();
    const result = await manageTodoListTool.execute({
      action: "update",
      itemId: "1",
      status: "completed"
    }, mockCtx);
    globalExpect(result).toHaveProperty("success", true);
    if ("todos" in result && result.todos) {
      globalExpect(result.todos[0].status).toBe("completed");
    }
    globalExpect(sendToCanvas).toHaveBeenCalledWith("test-job-id", globalExpect.stringContaining('"type":"todo_list"'), "json");
    globalExpect(mockCtx.log.info).toHaveBeenCalledWith("Updated todo 1 to status completed");
  });
  it("should display todos successfully", async () => {
    const mockCtx = createMockContext("test-job-id");
    const result = await manageTodoListTool.execute({
      action: "create",
      todos: [
        { id: "1", content: "Task 1", status: "pending" },
        { id: "2", content: "Task 2", status: "completed" }
      ],
      title: "My Tasks"
    }, mockCtx);
    globalExpect(result).toHaveProperty("success", true);
    globalExpect(result).toHaveProperty("message", "Created 2 todo items");
    globalExpect(sendToCanvas).toHaveBeenCalledWith("test-job-id", globalExpect.stringContaining('"type":"todo_list"'), "json");
  });
  it("should clear todos successfully", async () => {
    const mockCtx = createMockContext("test-job-id");
    await manageTodoListTool.execute({
      action: "create",
      todos: [{ id: "1", content: "Task 1", status: "pending" }]
    }, mockCtx);
    const result = await manageTodoListTool.execute({
      action: "clear"
    }, mockCtx);
    globalExpect(result).toHaveProperty("success", true);
    globalExpect(result).toHaveProperty("message", "Todo list cleared");
    if ("todos" in result && result.todos) {
      globalExpect(result.todos).toHaveLength(0);
    }
    globalExpect(mockCtx.log.info).toHaveBeenCalledWith("Cleared todo list");
  });
  it("should handle errors when updating non-existent todo", async () => {
    const mockCtx = createMockContext("test-job-id");
    const result = await manageTodoListTool.execute({
      action: "update",
      itemId: "non-existent",
      status: "completed"
    }, mockCtx);
    globalExpect(result).toHaveProperty("error");
    if ("error" in result) {
      globalExpect(result.error).toContain("not found");
    }
  });
  it("should handle missing parameters for create action", async () => {
    const mockCtx = createMockContext("test-job-id");
    const result = await manageTodoListTool.execute({
      action: "create"
    }, mockCtx);
    globalExpect(result).toHaveProperty("error", "No todos provided for create action");
  });
  it("should handle missing parameters for update action", async () => {
    const mockCtx = createMockContext("test-job-id");
    const result = await manageTodoListTool.execute({
      action: "update"
    }, mockCtx);
    globalExpect(result).toHaveProperty("error", "Item ID and status are required for update action");
  });
  it("should work without job ID (no canvas display)", async () => {
    const mockCtx = createMockContext();
    const result = await manageTodoListTool.execute({
      action: "create",
      todos: [{ id: "1", content: "Task 1", status: "pending" }]
    }, mockCtx);
    globalExpect(result).toHaveProperty("success", true);
    globalExpect(sendToCanvas).not.toHaveBeenCalled();
  });
});
