import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  afterEach,
  beforeEach,
  describe,
  globalExpect,
  it,
  vi
} from "../../../../chunk-AQKYZ7X3.js";
import {
  executeShellCommand,
  executeShellCommandTool,
  shellUtils_exports
} from "../../../../chunk-6FQJNHNL.js";
import "../../../../chunk-DVHMHG4X.js";
import {
  init_esm_shims
} from "../../../../chunk-SB7UONON.js";

// src/modules/tools/definitions/code/executeShellCommand.tool.test.ts
init_esm_shims();
vi.mock("@/utils/shellUtils", async () => {
  const actual = await vi.importActual("@/utils/shellUtils");
  return {
    ...actual,
    executeShellCommand: vi.fn()
  };
});
vi.mock("../../../redis/redisClient", () => ({
  redisClient: {
    publish: vi.fn()
  }
}));
describe("executeShellCommandTool", () => {
  let mockCtx;
  beforeEach(() => {
    vi.clearAllMocks();
    mockCtx = {
      job: {
        data: {},
        id: "test-job",
        isFailed: vi.fn(),
        name: "test-job-name"
      },
      llm: {},
      log: {
        child: vi.fn().mockReturnThis(),
        debug: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn()
      },
      reportProgress: vi.fn(),
      session: {
        history: [],
        id: "test-session",
        identities: [],
        name: "Test Session",
        timestamp: Date.now()
      },
      streamContent: vi.fn(),
      taskQueue: { add: vi.fn() }
    };
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });
  it("should execute a non-detached command and return stdout/stderr", async () => {
    const command = "echo hello";
    const expectedStdout = "hello\n";
    const expectedStderr = "error\n";
    vi.spyOn(shellUtils_exports, "executeShellCommand").mockResolvedValue({
      exitCode: 0,
      stderr: expectedStderr,
      stdout: expectedStdout
    });
    const result = await executeShellCommandTool.execute(
      { command, detach: false },
      mockCtx
    );
    globalExpect(executeShellCommand).toHaveBeenCalledWith(
      command,
      mockCtx
    );
    globalExpect(result).toEqual({
      exitCode: 0,
      stderr: expectedStderr,
      stdout: expectedStdout
    });
  });
  it("should enqueue a detached command and return immediately", async () => {
    const command = "long-running-script.sh";
    const args = { command, detach: true };
    const result = await executeShellCommandTool.execute(args, mockCtx);
    globalExpect(mockCtx.taskQueue.add).toHaveBeenCalledWith(
      "execute-shell-command-detached",
      globalExpect.objectContaining({
        command,
        jobId: mockCtx.job.id,
        notificationChannel: `job:${mockCtx.job.id}:events`
      }),
      globalExpect.objectContaining({
        jobId: globalExpect.any(String),
        removeOnComplete: true,
        removeOnFail: true
      })
    );
    globalExpect(result.exitCode).toBe(0);
    globalExpect(result.stdout).toContain(
      "enqueued for background execution"
    );
    globalExpect(result.stderr).toBe("");
  });
  it("should handle child process error event", async () => {
    const command = "nonexistent-command";
    const errorMessage = "spawn nonexistent-command ENOENT";
    vi.spyOn(shellUtils_exports, "executeShellCommand").mockRejectedValue(
      new Error(errorMessage)
    );
    const result = await executeShellCommandTool.execute(
      { command, detach: false },
      mockCtx
    );
    globalExpect(result.exitCode).toBe(1);
    globalExpect(result.stderr).toBe(
      `An unexpected error occurred: ${errorMessage}`
    );
    globalExpect(result.stdout).toBe("");
    globalExpect(mockCtx.log.error).toHaveBeenCalledWith(
      { err: globalExpect.any(Error) },
      `Error executing shell command: ${errorMessage}`
    );
  });
  it("should stream stdout and stderr via streamContent", async () => {
    const command = "echo test && echo error >&2";
    const stdoutChunk1 = "test\n";
    const stderrChunk1 = "error\n";
    vi.spyOn(shellUtils_exports, "executeShellCommand").mockImplementation(
      async (_cmd, ctx) => {
        if (ctx.streamContent) {
          await ctx.streamContent([
            {
              content: stdoutChunk1,
              toolName: "executeShellCommand",
              type: "stdout"
            }
          ]);
        }
        if (ctx.streamContent) {
          await ctx.streamContent([
            {
              content: stderrChunk1,
              toolName: "executeShellCommand",
              type: "stderr"
            }
          ]);
        }
        return { exitCode: 0, stderr: stderrChunk1, stdout: stdoutChunk1 };
      }
    );
    await executeShellCommandTool.execute({ command, detach: false }, mockCtx);
    globalExpect(mockCtx.streamContent).toHaveBeenCalledWith([
      {
        content: stdoutChunk1,
        toolName: "executeShellCommand",
        type: "stdout"
      }
    ]);
    globalExpect(mockCtx.streamContent).toHaveBeenCalledWith([
      {
        content: stderrChunk1,
        toolName: "executeShellCommand",
        type: "stderr"
      }
    ]);
  });
});
