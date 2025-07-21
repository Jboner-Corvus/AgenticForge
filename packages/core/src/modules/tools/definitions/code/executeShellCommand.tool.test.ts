/// <reference types="vitest/globals" />
import { Job, Queue } from 'bullmq';
import { EventEmitter } from 'events';
import { describe, expect, it, vi } from 'vitest';

import logger from '../../../../logger.js';
import { Ctx, ILlmProvider, SessionData } from '../../../../types.js';
import { executeShellCommandTool } from './executeShellCommand.tool.js';

vi.mock('child_process', () => ({
  spawn: vi.fn((command, _args, _options) => {
    const stdoutEmitter = new EventEmitter();
    const stderrEmitter = new EventEmitter();
    const child = new EventEmitter();

    // Mock stdout and stderr streams
    (child as any).stdout = stdoutEmitter;
    (child as any).stderr = stderrEmitter;

    // Simulate command execution
    process.nextTick(() => {
      if (command.includes('echo hello')) {
        stdoutEmitter.emit('data', 'hello\n');
        child.emit('close', 0);
      } else if (command.includes('process.exit(1)')) {
        stderrEmitter.emit('data', 'Error: Command failed\n');
        child.emit('close', 1);
      } else {
        stderrEmitter.emit('data', `Unknown command: ${command}\n`);
        child.emit('close', 1);
      }
    });

    return child;
  }),
}));

vi.mock('../../../redisClient.js', async () => {
  const vitest = await import('vitest');
  return {
    redis: {
      publish: vitest.vi.fn(),
    },
  };
});

vi.mock('../../../../logger.js', async () => {
  const vitest = await import('vitest');
  const loggerMock = await vitest.vi.importActual(
    '../../../../test/mocks/logger.js',
  );
  return {
    default: loggerMock.default,
  };
});

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
    const command = 'echo hello';
    const result = await executeShellCommandTool.execute({ command }, mockCtx);

    // CORRECTION : Vérifie que le résultat est un objet avec un code de sortie de 0 et la bonne sortie standard.
    expect(result).toEqual(
      expect.objectContaining({
        exitCode: 0,
        stdout: expect.stringContaining('hello'),
      }),
    );

    expect(mockCtx.log.info).toHaveBeenCalledWith(
      `Spawning shell command: ${command}`,
    );
  });

  it('should return an error for a command that exits with a non-zero code', async () => {
    const command = 'node -e "process.exit(1)"';
    const result = await executeShellCommandTool.execute({ command }, mockCtx);

    // CORRECTION : Vérifie que le résultat est un objet avec un code de sortie non nul.
    // L'outil ne renvoie pas de propriété 'erreur' dans ce cas.
    expect(result).toEqual(
      expect.objectContaining({
        exitCode: 1,
      }),
    );
  });
});
