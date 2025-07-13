import { Job, Queue } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';
import { pino } from 'pino';

import { Ctx, SessionData } from '../../types.js';
import { finishTool } from './finish.tool.js';

const mockLogger = pino({ enabled: false });

describe('finishTool', () => {
  const mockCtx: Ctx = {
    job: { id: 'test-job-id' } as Job,
    log: {
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      fatal: vi.fn(),
      trace: vi.fn(),
      silent: vi.fn(),
      level: 'info',
    } as unknown as typeof mockLogger,
    reportProgress: vi.fn(),
    session: {} as SessionData,
    streamContent: vi.fn(),
    taskQueue: {} as Queue,
  };

  it('should return the final response string', async () => {
    const response = 'Goal achieved!';
    const result = await finishTool.execute({ response }, mockCtx);
    expect(result).toBe(response);
    expect(mockCtx.log.info).toHaveBeenCalledWith(`Goal accomplished: ${response}`);
  });

  it('should return an error if an unexpected error occurs', async () => {
    const originalExecute = finishTool.execute;
    finishTool.execute = vi.fn(async () => {
      throw new Error('Simulated error');
    });

    const result = await finishTool.execute({ response: 'test' }, mockCtx);
    if (typeof result === 'object' && result && 'erreur' in result) {
      expect(result.erreur).toContain('Simulated error');
    } else {
      expect.fail('Expected an error object');
    }

    finishTool.execute = originalExecute;
  });
});
