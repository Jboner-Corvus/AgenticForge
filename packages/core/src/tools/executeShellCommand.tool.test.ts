import { describe, it, expect, vi } from 'vitest';
import { executeShellCommandTool } from './executeShellCommand.tool';
import { Ctx } from '../types';

describe('executeShellCommandTool', () => {
  const mockCtx: Ctx = {
    log: {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
    },
    job: { id: 'test-job-id' } as any,
    session: {} as any,
    taskQueue: {} as any,
    reportProgress: vi.fn(),
    streamContent: vi.fn(),
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
