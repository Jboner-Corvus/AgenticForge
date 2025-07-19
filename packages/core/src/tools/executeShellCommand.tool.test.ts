/// <reference types="vitest/globals" />
import { Job, Queue } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';

import logger from '../logger.ts';
import { Ctx, ILlmProvider, SessionData } from '../types.js';
import { executeShellCommandTool } from './code/executeShellCommand.tool.js';

vi.mock('../../redisClient.js', () => ({
  redis: {
    publish: vi.fn(),
  },
}));

vi.mock('../logger.ts', () => ({
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
    job: { id: 'test-job' } as Job,
    llm: {} as ILlmProvider,
    log: logger,
    reportProgress: vi.fn(),
    session: {} as SessionData,
    streamContent: vi.fn(),
    taskQueue: {} as Queue,
  };

  it('should execute a valid command and return success message', async () => {
    const command = 'node -e "console.log(\'hello\')"';
    const result = await executeShellCommandTool.execute({ command }, mockCtx);
    
    // CORRECTION : Vérifie que le résultat est un objet avec un code de sortie de 0 et la bonne sortie standard.
    expect(result).toEqual(expect.objectContaining({
      exitCode: 0,
      stdout: expect.stringContaining('hello'),
    }));

    expect(mockCtx.log.info).toHaveBeenCalledWith(
      `Spawning shell command: ${command}`,
    );
  });

  it('should return an error for a command that exits with a non-zero code', async () => {
    const command = 'node -e "process.exit(1)"';
    const result = await executeShellCommandTool.execute({ command }, mockCtx);

    // CORRECTION : Vérifie que le résultat est un objet avec un code de sortie non nul.
    // L'outil ne renvoie pas de propriété 'erreur' dans ce cas.
    expect(result).toEqual(expect.objectContaining({
      exitCode: 1,
    }));
  });
});