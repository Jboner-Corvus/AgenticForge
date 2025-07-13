import { Job, Queue } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';

import { Ctx, SessionData } from '../types.js';
import { agentResponseTool } from './agentResponse.tool.js';
import logger from '../../logger.js';

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

describe('agentResponseTool', () => {
  const mockCtx: Ctx = {
    job: { id: 'test-job-id' } as Job,
    log: logger.default,
    reportProgress: vi.fn(),
    session: {} as SessionData,
    streamContent: vi.fn(),
    taskQueue: {} as Queue,
  };

  it('should return the response string', async () => {
    const response = 'Hello, user!';
    const result = await agentResponseTool.execute({ response }, mockCtx);
    expect(result).toBe(response);
    expect(mockCtx.log.info).toHaveBeenCalledWith('Responding to user', { args: { response } });
  });

  it('should handle empty response string', async () => {
    const response = '';
    const result = await agentResponseTool.execute({ response }, mockCtx);
    expect(result).toBe(response);
  });
});
