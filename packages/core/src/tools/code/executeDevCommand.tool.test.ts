/// <reference types="vitest/globals" />
import { Job, Queue } from 'bullmq';
import { exec } from 'child_process';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Ctx, SessionData } from '../../types.js';
import { executeDevCommandTool } from './executeDevCommand.tool.js';

vi.mock('child_process', () => ({
  exec: vi.fn(),
}));

describe('executeDevCommandTool', () => {
  vi.mock('../../logger.js', () => {
  const mockLogger = {
    level: 'info',
    silent: vi.fn(),
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn(() => mockLogger),
    version: '9.7.0',
    levels: {
      labels: { 10: 'trace', 20: 'debug', 30: 'info', 40: 'warn', 50: 'error', 60: 'fatal' },
      values: { trace: 10, debug: 20, info: 30, warn: 40, error: 50, fatal: 60 },
    },
    useLevelLabels: false,
    levelVal: 30,
    isLevelEnabled: vi.fn(() => true),
    flush: vi.fn(),
    on: vi.fn(),
    bindings: vi.fn(() => ({})),
    setBindings: vi.fn(),
    stdSerializers: {},
    customLevels: {},
    useOnlyCustomLevels: false,
  };
  return {
    default: mockLogger,
  };
});

  import logger from '../../logger.js';

  import logger from '../../logger.js';

  const mockCtx: Ctx = {
    job: { id: 'test-job-id' } as Job,
    log: logger.default,
    reportProgress: vi.fn(),
    session: {} as SessionData,
    streamContent: vi.fn(),
    taskQueue: {} as Queue,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute a command successfully', async () => {
    (exec as vi.Mock).mockImplementationOnce((command: string, callback: (error: Error | null, stdout: string, stderr: string) => void) => {
      callback(null, 'stdout output', 'stderr output');
    });

    const command = 'npm install';
    const result = await executeDevCommandTool.execute({ command }, mockCtx);
    expect(result).toContain('stdout output');
    expect(result).toContain('stderr output');
    expect(mockCtx.log.info).toHaveBeenCalledWith(`Executing dev command locally: "${command}"`);
  });

  it('should return an error if command fails', async () => {
    (exec as vi.Mock).mockImplementationOnce((command: string, callback: (error: Error | null, stdout: string, stderr: string) => void) => {
      callback(new Error('Command failed'), '', 'Error message');
    });

    const command = 'invalid-command';
    const result = await executeDevCommandTool.execute({ command }, mockCtx);
    expect(result).toHaveProperty('erreur');
    expect(typeof result === 'object' && result !== null && 'erreur' in result ? result.erreur : result).toContain('Command failed');
    expect(mockCtx.log.error).toHaveBeenCalled();
  });
});
