import { Queue } from 'bullmq';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Ctx } from '@/types';
import * as shellUtils from '@/utils/shellUtils';

import { executeShellCommandTool } from './executeShellCommand.tool'; // Temp fix

vi.mock('@/utils/shellUtils', async () => {
  const actual = await vi.importActual('@/utils/shellUtils');
  return {
    ...actual,
    executeShellCommand: vi.fn(),
  };
});

vi.mock('../../../redis/redisClient', () => ({
  redisClient: {
    publish: vi.fn(),
  },
}));

describe('executeShellCommandTool', () => {
  let mockCtx: Ctx;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCtx = {
      job: {
        data: {} as unknown,
        id: 'test-job',
        isFailed: vi.fn(),
        name: 'test-job-name',
      } as Ctx['job'],
      llm: {} as Ctx['llm'],
      log: {
        child: vi.fn().mockReturnThis(),
        debug: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
      } as unknown as Ctx['log'],
      reportProgress: vi.fn(),
      session: {
        history: [],
        id: 'test-session',
        identities: [],
        name: 'Test Session',
        timestamp: Date.now(),
      },
      streamContent: vi.fn(),
      taskQueue: { add: vi.fn() } as unknown as Queue,
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('should execute a non-detached command and return stdout/stderr', async () => {
    const command = 'echo hello';
    const expectedStdout = 'hello\n';
    const expectedStderr = 'error\n';

    vi.spyOn(shellUtils, 'executeShellCommand').mockResolvedValue({
      exitCode: 0,
      stderr: expectedStderr,
      stdout: expectedStdout,
    });

    const result = await executeShellCommandTool.execute(
      { command, detach: false },
      mockCtx,
    );

    expect(shellUtils.executeShellCommand).toHaveBeenCalledWith(
      command,
      mockCtx,
    );
    expect(result).toEqual({
      exitCode: 0,
      stderr: expectedStderr,
      stdout: expectedStdout,
    });
  });

  it('should enqueue a detached command and return immediately', async () => {
    const command = 'long-running-script.sh';
    const args = { command, detach: true };

    const result = await executeShellCommandTool.execute(args, mockCtx);

    expect(mockCtx.taskQueue.add).toHaveBeenCalledWith(
      'execute-shell-command-detached',
      expect.objectContaining({
        command,
        jobId: mockCtx.job!.id,
        notificationChannel: `job:${mockCtx.job!.id}:events`,
      }),
      expect.objectContaining({
        jobId: expect.any(String),
        removeOnComplete: true,
        removeOnFail: true,
      }),
    );
    expect((result as { exitCode: number }).exitCode).toBe(0);
    expect((result as { stdout: string }).stdout).toContain(
      'enqueued for background execution',
    );
    expect((result as { stderr: string }).stderr).toBe('');
  });

  it('should handle child process error event', async () => {
    const command = 'nonexistent-command';
    const errorMessage = 'spawn nonexistent-command ENOENT';

    vi.spyOn(shellUtils, 'executeShellCommand').mockRejectedValue(
      new Error(errorMessage),
    );

    const result = await executeShellCommandTool.execute(
      { command, detach: false },
      mockCtx,
    );

    expect((result as { exitCode: number }).exitCode).toBe(1);
    expect((result as { stderr: string }).stderr).toBe(
      `An unexpected error occurred: ${errorMessage}`,
    );
    expect((result as { stdout: string }).stdout).toBe('');
    expect(mockCtx.log.error).toHaveBeenCalledWith(
      { err: expect.any(Error) },
      `Error executing shell command: ${errorMessage}`,
    );
  });

  it('should stream stdout and stderr via streamContent', async () => {
    const command = 'echo test && echo error >&2';
    const stdoutChunk1 = 'test\n';
    const stderrChunk1 = 'error\n';

    vi.spyOn(shellUtils, 'executeShellCommand').mockImplementation(
      async (cmd: string, ctx: Ctx) => {
        if (ctx.streamContent) {
          await ctx.streamContent([
            {
              content: stdoutChunk1,
              toolName: 'executeShellCommand',
              type: 'stdout',
            },
          ]);
        }
        if (ctx.streamContent) {
          await ctx.streamContent([
            {
              content: stderrChunk1,
              toolName: 'executeShellCommand',
              type: 'stderr',
            },
          ]);
        }
        return { exitCode: 0, stderr: stderrChunk1, stdout: stdoutChunk1 };
      },
    );

    await executeShellCommandTool.execute({ command, detach: false }, mockCtx);

    expect(mockCtx.streamContent).toHaveBeenCalledWith([
      {
        content: stdoutChunk1,
        toolName: 'executeShellCommand',
        type: 'stdout',
      },
    ]);
    expect(mockCtx.streamContent).toHaveBeenCalledWith([
      {
        content: stderrChunk1,
        toolName: 'executeShellCommand',
        type: 'stderr',
      },
    ]);
  });
});
