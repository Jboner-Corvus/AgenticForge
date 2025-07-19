/// <reference types="vitest/globals" />
import { Job, Queue } from 'bullmq';
import { ChildProcess, exec, ExecException } from 'child_process';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import logger from '../../logger.js';
import { Ctx, ILlmProvider, SessionData } from '../../types.js';
import { executeDevCommandTool } from './executeDevCommand.tool.js';

vi.mock('../../logger.js', () => ({
  default: {
    child: vi.fn().mockReturnThis(),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('child_process', () => ({
  exec: vi.fn(),
}));

describe('executeDevCommandTool', () => {
  const mockCtx: Ctx = {
    job: { id: 'test-job-id' } as Job,
    llm: {} as ILlmProvider,
    log: logger,
    reportProgress: vi.fn(),
    session: {} as SessionData,
    streamContent: vi.fn(),
    taskQueue: {} as Queue,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute a command successfully', async () => {
    vi.mocked(exec).mockImplementation(
      (
        command: string,
        options: unknown,
        callback?: (
          error: ExecException | null,
          stdout: string,
          stderr: string,
        ) => void,
      ): ChildProcess => {
        if (typeof options === 'function') {
          callback = options as (
            error: ExecException | null,
            stdout: string,
            stderr: string,
          ) => void;
        }
        callback?.(null, 'stdout output', 'stderr output');
        return {} as ChildProcess;
      },
    );

    const command = 'npm install';
    const result = await executeDevCommandTool.execute({ command }, mockCtx);
    expect(result).toContain('stdout output');
    expect(result).toContain('stderr output');
    expect(mockCtx.log.info).toHaveBeenCalledWith(
      `Executing dev command locally: "${command}"`,
    );
  });

  it('should return an error if command fails', async () => {
    vi.mocked(exec).mockImplementation(
      (
        command: string,
        options: unknown,
        callback?: (
          error: ExecException | null,
          stdout: string,
          stderr: string,
        ) => void,
      ): ChildProcess => {
        if (typeof options === 'function') {
          callback = options as (
            error: ExecException | null,
            stdout: string,
            stderr: string,
          ) => void;
        }
        callback?.(new Error('Command failed'), '', 'Error message');
        return {} as ChildProcess;
      },
    );

    const command = 'invalid-command';
    const result = await executeDevCommandTool.execute({ command }, mockCtx);
    expect(result).toHaveProperty('erreur');
    expect(
      typeof result === 'object' && result !== null && 'erreur' in result
        ? result.erreur
        : result,
    ).toContain('Command failed');
    expect(mockCtx.log.error).toHaveBeenCalled();
  });
});
