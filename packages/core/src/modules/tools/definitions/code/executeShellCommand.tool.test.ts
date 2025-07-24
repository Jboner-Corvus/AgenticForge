import { Queue } from 'bullmq';
import { spawn } from 'child_process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Ctx } from '@/types';

import { config } from '../../../../config';
import { redis } from '../../../redis/redisClient';
import { executeShellCommandTool } from './executeShellCommand.tool';

// Mock child_process.spawn
vi.mock('child_process', () => ({
  spawn: vi.fn(() => {
    const mockChildProcess = {
      kill: vi.fn(),
      on: vi.fn(),
      stderr: { on: vi.fn() },
      stdout: { on: vi.fn() },
    };
    // Simulate immediate close for non-detached commands
    mockChildProcess.on.mockImplementation(
      (event: string, callback: (...args: any[]) => void) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      },
    );
    return mockChildProcess;
  }),
}));

// Mock redis.publish
vi.mock('../../../redis/redisClient', () => ({
  redis: {
    publish: vi.fn(),
  },
}));

// Mock config
vi.mock('../../../../config', () => ({
  config: {
    WORKSPACE_PATH: '/tmp/workspace',
  },
}));

describe('executeShellCommandTool', () => {
  let mockCtx: Ctx;
  let mockChildProcess: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockChildProcess = {
      kill: vi.fn(),
      on: vi.fn(),
      stderr: { on: vi.fn() },
      // Re-mock child process for each test
      stdout: { on: vi.fn() },
    };
    // Default mock for spawn to simulate successful command execution
    vi.mocked(spawn).mockImplementation((__cmd, __args, __options) => {
      mockChildProcess.on.mockImplementation(
        (event: string, callback: (...args: any[]) => void) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
        },
      );
      return mockChildProcess as any;
    });

    mockCtx = {
      job: { id: 'test-job' } as Ctx['job'],
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

    vi.mocked(spawn).mockImplementation((__cmd, __args, __options) => {
      mockChildProcess.stdout.on.mockImplementation(
        (event: string, callback: (chunk: Buffer) => void) => {
          if (event === 'data') {
            callback(Buffer.from(expectedStdout));
          }
        },
      );
      mockChildProcess.stderr.on.mockImplementation(
        (event: string, callback: (chunk: Buffer) => void) => {
          if (event === 'data') {
            callback(Buffer.from(expectedStderr));
          }
        },
      );
      mockChildProcess.on.mockImplementation(
        (event: string, callback: (code: number) => void) => {
          if (event === 'close') {
            callback(0);
          }
        },
      );
      return mockChildProcess as any;
    });

    const result = await executeShellCommandTool.execute(
      { command, detach: false },
      mockCtx,
    );

    expect(spawn).toHaveBeenCalledWith(command, {
      cwd: config.WORKSPACE_PATH,
      shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash',
      stdio: 'pipe',
    });
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
      'async-tasks',
      expect.objectContaining({
        command,
        jobId: mockCtx.job!.id,
        notificationChannel: `job:${mockCtx.job!.id}:events`,
      }),
      expect.objectContaining({ jobId: expect.any(String) }),
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

    vi.mocked(spawn).mockImplementation((__cmd, __args, __options) => {
      mockChildProcess.on.mockImplementation(
        (event: string, callback: (err: Error) => void) => {
          if (event === 'error') {
            callback(new Error(errorMessage));
          }
        },
      );
      return mockChildProcess as any;
    });

    const result = await executeShellCommandTool.execute(
      { command, detach: false },
      mockCtx,
    );

    expect((result as { exitCode: number }).exitCode).toBe(1);
    expect((result as { stderr: string }).stderr).toBe(
      `Failed to start command: ${errorMessage}`,
    );
    expect((result as { stdout: string }).stdout).toBe('');
    expect(mockCtx.log.error).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      `Failed to start shell command: ${command}`,
    );
  });

  it('should stream stdout and stderr to frontend via redis.publish', async () => {
    const command = 'echo test && echo error >&2';
    const stdoutChunk1 = 'test\n';
    const stderrChunk1 = 'error\n';

    vi.mocked(spawn).mockImplementation((__cmd, __args, __options) => {
      mockChildProcess.stdout.on.mockImplementation(
        (event: string, callback: (chunk: Buffer) => void) => {
          if (event === 'data') {
            callback(Buffer.from(stdoutChunk1));
          }
        },
      );
      mockChildProcess.stderr.on.mockImplementation(
        (event: string, callback: (chunk: Buffer) => void) => {
          if (event === 'data') {
            callback(Buffer.from(stderrChunk1));
          }
        },
      );
      mockChildProcess.on.mockImplementation(
        (event: string, callback: (code: number) => void) => {
          if (event === 'close') {
            callback(0);
          }
        },
      );
      return mockChildProcess as any;
    });

    await executeShellCommandTool.execute({ command, detach: false }, mockCtx);

    expect(redis.publish).toHaveBeenCalledWith(
      `job:${mockCtx.job!.id}:events`,
      JSON.stringify({
        data: {
          content: stdoutChunk1,
          type: 'stdout',
        },
        type: 'tool_stream',
      }),
    );
    expect(redis.publish).toHaveBeenCalledWith(
      `job:${mockCtx.job!.id}:events`,
      JSON.stringify({
        data: {
          content: stderrChunk1,
          type: 'stderr',
        },
        type: 'tool_stream',
      }),
    );
    expect(redis.publish).toHaveBeenCalledWith(
      `job:${mockCtx.job!.id}:events`,
      JSON.stringify({
        data: {
          content: '\n--- COMMAND FINISHED ---\nExit Code: 0',
          type: 'stdout',
        },
        type: 'tool_stream',
      }),
    );
  });
});
