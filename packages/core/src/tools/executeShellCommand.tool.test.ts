/// <reference types="vitest/globals" />
import { Job, Queue } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';

import logger from '../../logger.js';
import { Ctx, SessionData } from '../types.js';
import { executeShellCommandTool } from './executeShellCommand.tool.js';

vi.mock('../../logger.js', () => ({
  default: {
    child: vi.fn().mockReturnThis(),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('executeShellCommandTool', () => {
  const mockCtx: Ctx = {
    job: { id: 'test-job-id' } as Job,
    log: logger,
    reportProgress: vi.fn(),
    session: {} as SessionData,
    streamContent: vi.fn(),
    taskQueue: {} as Queue,
  };

  it('should execute a valid command and return success message', async () => {
    const command = 'echo hello';
    const result = await executeShellCommandTool.execute({ command }, mockCtx);
    expect(result).toContain('Command finished with exit code 0.');
    expect(mockCtx.log.info).toHaveBeenCalledWith(
      `Spawning shell command: ${command}`,
    );
  });

  it('should return an error for an invalid command', async () => {
    const command = 'nonexistentcommand123';
    const result = await executeShellCommandTool.execute({ command }, mockCtx);
    expect(result).toHaveProperty('erreur');
    expect(
      typeof result === 'object' && result !== null && 'erreur' in result
        ? result.erreur
        : result,
    ).toContain('Command finished with exit code');
    expect(mockCtx.log.error).toHaveBeenCalled();
  });
});
