import { describe, it, expect, vi } from 'vitest';
import { listToolsTool } from './system/listTools.tool';
import { getAllTools } from '../index';
import { Ctx } from '../types';

vi.mock('../index', () => ({
  getAllTools: vi.fn(),
}));

describe('listToolsTool', () => {
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

  it('should list all available tool names', async () => {
    (getAllTools as vi.Mock).mockResolvedValueOnce([
      { name: 'tool1' },
      { name: 'tool2' },
    ]);

    const result = await listToolsTool.execute({}, mockCtx);
    expect(result).toEqual({ tools: ['tool1', 'tool2'] });
  });

  it('should return an empty array if no tools are available', async () => {
    (getAllTools as vi.Mock).mockResolvedValueOnce([]);

    const result = await listToolsTool.execute({}, mockCtx);
    expect(result).toEqual({ tools: [] });
  });

  it('should return an error if getAllTools fails', async () => {
    const errorMessage = 'Failed to get tools';
    (getAllTools as vi.Mock).mockRejectedValueOnce(new Error(errorMessage));

    const result = await listToolsTool.execute({}, mockCtx);
    expect(result).toHaveProperty('erreur');
    expect(result.erreur).toContain(errorMessage);
    expect(mockCtx.log.error).toHaveBeenCalled();
  });
});
