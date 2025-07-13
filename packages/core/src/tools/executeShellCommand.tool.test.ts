/// <reference types="vitest/globals" />
import { describe, expect, it, vi } from 'vitest';

import { Ctx } from '../types.js';
import { executeShellCommandTool } from './executeShellCommand.tool.js';

describe('executeShellCommandTool', () => {
  const mockCtx: Ctx = {
    job: { id: 'test-job-id' } as any,
    log: {
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    },
    reportProgress: vi.fn(),
    session: {} as any,
    streamContent: vi.fn(),
    taskQueue: {} as any,
  };

  it('should execute a valid command and return success message', async () => {
    const command = 'echo hello';
    const result = await executeShellCommandTool.execute({ command }, mockCtx);
    expect(result).toContain('Command finished with exit code 0.');
    expect(mockCtx.log.info).toHaveBeenCalledWith(`Spawning shell command: ${command}`);
  });

  it('should return an error for an invalid command', async () => {
    const command = 'nonexistentcommand123';
    const result = await executeShellCommandTool.execute({ command }, mockCtx);
    expect(result).toHaveProperty('erreur');
    expect(result.erreur).toContain('Command finished with exit code');
    expect(mockCtx.log.error).toHaveBeenCalled();
  });
});
