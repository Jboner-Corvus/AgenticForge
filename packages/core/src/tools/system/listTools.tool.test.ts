/// <reference types="vitest/globals" />
import { Job, Queue } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';
import { pino } from 'pino';

import { getAllTools } from '../../tools/index.js';
import { Ctx, SessionData, Tool } from '../../types.js';
import { listToolsTool } from './listTools.tool.js';

vi.mock('../../tools/index.js', () => ({
  getAllTools: vi.fn(),
}));

const mockLogger = pino({ enabled: false });

describe('listToolsTool', () => {
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

  it('should list all available tool names', async () => {
    (getAllTools as any).mockResolvedValueOnce([
      { name: 'tool1' },
      { name: 'tool2' },
    ] as Tool[]);

    const result = await listToolsTool.execute({}, mockCtx);
    expect(result).toEqual({ tools: ['tool1', 'tool2'] });
  });

  it('should return an empty array if no tools are available', async () => {
    (getAllTools as any).mockResolvedValueOnce([]);

    const result = await listToolsTool.execute({}, mockCtx);
    expect(result).toEqual({ tools: [] });
  });

  it('should return an error if getAllTools fails', async () => {
    const errorMessage = 'Failed to get tools';
    (getAllTools as any).mockRejectedValueOnce(new Error(errorMessage));

    const result = await listToolsTool.execute({}, mockCtx);
    if (typeof result === 'object' && result && 'erreur' in result) {
      expect(result.erreur).toContain(errorMessage);
    } else {
      expect.fail('Expected an error object');
    }
    expect(mockCtx.log.error).toHaveBeenCalled();
  });
});
