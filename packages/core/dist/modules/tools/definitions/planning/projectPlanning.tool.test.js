import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  projectPlanningTool
} from "../../../../chunk-HC7ITZPF.js";
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

// src/modules/tools/definitions/planning/projectPlanning.tool.test.ts
init_esm_shims();
vi.mock("../../../../utils/canvasUtils.ts", () => ({
  sendToCanvas: vi.fn()
}));
vi.mock("../../../redis/redisClient.ts", () => ({
  getRedisClientInstance: vi.fn(() => ({
    publish: vi.fn()
  }))
}));
describe("projectPlanningTool", () => {
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
    globalExpect(projectPlanningTool.name).toBe("project_planning");
    globalExpect(projectPlanningTool.description).toContain("Creates detailed project plans");
  });
  it("should generate a project plan successfully", async () => {
    const mockCtx = createMockContext("test-job-id");
    const result = await projectPlanningTool.execute({
      projectName: "Duke Nukem 2",
      projectDescription: "Create a retro-style first-person shooter game"
    }, mockCtx);
    globalExpect(result).toHaveProperty("success", true);
    globalExpect(result).toHaveProperty("plan");
    if ("plan" in result && result.plan) {
      globalExpect(result.plan.length).toBeGreaterThan(0);
      globalExpect(result.plan[0]).toHaveProperty("id");
      globalExpect(result.plan[0]).toHaveProperty("title");
      globalExpect(result.plan[0]).toHaveProperty("description");
      globalExpect(result.plan[0]).toHaveProperty("phase");
      globalExpect(result.plan[0]).toHaveProperty("estimatedTime");
      globalExpect(result.plan[0]).toHaveProperty("priority");
    }
    globalExpect(sendToCanvas).toHaveBeenCalledWith("test-job-id", globalExpect.stringContaining("<!DOCTYPE html>"), "html");
    globalExpect(sendToCanvas).toHaveBeenCalledWith("test-job-id", globalExpect.stringContaining("Project Plan: Duke Nukem 2"), "html");
    globalExpect(mockCtx.log.info).toHaveBeenCalledWith("Generating project plan for: Duke Nukem 2");
  });
  it("should handle errors gracefully", async () => {
    const mockCtx = createMockContext("test-job-id");
    vi.mocked(sendToCanvas).mockImplementationOnce(() => {
      throw new Error("Canvas error");
    });
    const result = await projectPlanningTool.execute({
      projectName: "Test Project",
      projectDescription: "Test project description"
    }, mockCtx);
    globalExpect(result).toHaveProperty("error");
    if ("error" in result) {
      globalExpect(result.error).toContain("Failed to generate project plan");
    }
  });
  it("should work without job ID (no canvas display)", async () => {
    const mockCtx = createMockContext();
    const result = await projectPlanningTool.execute({
      projectName: "Test Project",
      projectDescription: "Test project description"
    }, mockCtx);
    globalExpect(result).toHaveProperty("success", true);
    globalExpect(sendToCanvas).not.toHaveBeenCalled();
  });
});
