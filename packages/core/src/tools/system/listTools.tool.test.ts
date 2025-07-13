/// <reference types="vitest/globals" />
import { Job, Queue } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';

import logger from '../../logger.js';
import { getAllTools } from '../../tools/index.js';
import { Ctx, SessionData, Tool } from '../../types.js';
import { listToolsTool } from './listTools.tool.js';

vi.mock('../../tools/index.js', () => ({
  getAllTools: vi.fn(),
}));

vi.mock('../../logger.js', () => ({
  default: {
    child: vi.fn().mockReturnThis(),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('listToolsTool', () => {
  const mockCtx: Ctx = {
    job: { id: 'test-job-id' } as Job,
    log: logger,
    reportProgress: vi.fn(),
    session: {} as SessionData,
    streamContent: vi.fn(),
    taskQueue: {} as Queue,
  };

  it('should list all available tool names', async () => {
    vi.mocked(getAllTools).mockResolvedValueOnce([
      { name: 'tool1' },
      { name: 'tool2' },
    ] as Tool[]);

    const result = await listToolsTool.execute({}, mockCtx);
    expect(result).toEqual({ tools: ['tool1', 'tool2'] });
  });

  it('should return an empty array if no tools are available', async () => {
    vi.mocked(getAllTools).mockResolvedValueOnce([]);

    const result = await listToolsTool.execute({}, mockCtx);
    expect(result).toEqual({ tools: [] });
  });

  it('should return an error if getAllTools fails', async () => {
    const errorMessage = 'Failed to get tools';
    vi.mocked(getAllTools).mockRejectedValueOnce(new Error(errorMessage));

    const result = await listToolsTool.execute({}, mockCtx);
    if (typeof result === 'object' && result && 'erreur' in result) {
      expect(result.erreur).toContain(errorMessage);
    } else {
      expect.fail('Expected an error object');
    }
    expect(mockCtx.log.error).toHaveBeenCalled();
  });
});
