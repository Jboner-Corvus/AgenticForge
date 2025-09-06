import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  getTodosForSession,
  todoWriteTool
} from "../../../../../chunk-KA35TNKT.js";
import {
  beforeEach,
  describe,
  globalExpect,
  it,
  vi
} from "../../../../../chunk-AQKYZ7X3.js";
import "../../../../../chunk-S22IAFZZ.js";
import "../../../../../chunk-WUF5ZZ3T.js";
import "../../../../../chunk-LORZP3MC.js";
import {
  init_esm_shims
} from "../../../../../chunk-SB7UONON.js";

// src/modules/tools/definitions/system/__tests__/todoWrite.test.ts
init_esm_shims();
var mockPublish = vi.fn();
vi.mock("../../../../../modules/redis/redisClient", () => ({
  getRedisClientInstance: () => ({
    publish: mockPublish
  })
}));
describe("todoWrite.tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  const createMockContext = (sessionName = "test-session", jobId = "job-123") => ({
    session: { name: sessionName },
    job: { id: jobId },
    log: {
      info: vi.fn(),
      error: vi.fn()
    }
  });
  it("should handle simple todo creation like Claude Code", async () => {
    const ctx = createMockContext();
    const todos = [
      { id: "1", content: "First task", status: "pending" },
      { id: "2", content: "Second task", status: "in_progress" },
      { id: "3", content: "Third task", status: "completed" }
    ];
    const result = await todoWriteTool.execute({ todos }, ctx);
    globalExpect(result.success).toBe(true);
    globalExpect(result.todos).toEqual(todos);
    globalExpect(result.message).toContain("3 total tasks");
  });
  it("should publish WebSocket message in Claude Code format", async () => {
    const ctx = createMockContext("session-1", "job-456");
    const todos = [
      { id: "1", content: "Test task", status: "pending" }
    ];
    await todoWriteTool.execute({ todos }, ctx);
    globalExpect(mockPublish).toHaveBeenCalledWith(
      "job:job-456:events",
      globalExpect.stringContaining('"type":"claude_code_todo"')
    );
    const publishCall = mockPublish.mock.calls[0];
    const publishedData = JSON.parse(publishCall[1]);
    globalExpect(publishedData.type).toBe("claude_code_todo");
    globalExpect(publishedData.data.todos).toEqual(todos);
    globalExpect(publishedData.data.stats.total).toBe(1);
    globalExpect(publishedData.data.stats.pending).toBe(1);
  });
  it("should store todos globally per session", async () => {
    const ctx = createMockContext("session-test");
    const todos = [
      { id: "1", content: "Stored task", status: "pending" }
    ];
    await todoWriteTool.execute({ todos }, ctx);
    const storedTodos = getTodosForSession("session-test");
    globalExpect(storedTodos).toEqual(todos);
  });
  it("should calculate stats correctly", async () => {
    const ctx = createMockContext();
    const todos = [
      { id: "1", content: "Task 1", status: "pending" },
      { id: "2", content: "Task 2", status: "pending" },
      { id: "3", content: "Task 3", status: "in_progress" },
      { id: "4", content: "Task 4", status: "completed" },
      { id: "5", content: "Task 5", status: "completed" }
    ];
    await todoWriteTool.execute({ todos }, ctx);
    const publishCall = mockPublish.mock.calls[0];
    const publishedData = JSON.parse(publishCall[1]);
    globalExpect(publishedData.data.stats).toEqual({
      pending: 2,
      in_progress: 1,
      completed: 2,
      total: 5
    });
  });
  it("should handle errors gracefully", async () => {
    const ctx = createMockContext();
    mockPublish.mockRejectedValue(new Error("Redis error"));
    const result = await todoWriteTool.execute({ todos: [] }, ctx);
    globalExpect(result.success).toBe(false);
    globalExpect(result.message).toContain("Failed to update todos");
  });
});
