/// <reference types="vitest/globals" />
import { Queue } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';

import { Ctx, ILlmProvider, SessionData, Tool } from '@/types.js';

import logger from '../../../../logger.js';
import { getAllTools } from '../index.js';
import { listToolsTool } from './listTools.tool.js';

vi.mock('../../../tools/definitions/index.js', () => ({
  getAllTools: vi.fn(),
}));

vi.mock('../../../../logger.js', async () => {
  const actual = await vi.importActual<typeof import('../../../../logger.js')>(
    '../../../../logger.js',
  );
  return {
    default: {
      ...actual.default,
      error: vi.fn(),
    },
  };
});

describe('listToolsTool', () => {
  const mockCtx: Ctx = {
    llm: {} as ILlmProvider,
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
