import { Queue } from 'bullmq';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Ctx, ILlmProvider, SessionData } from '@/types.js';

import { getLoggerInstance } from '../../../../logger';

vi.mock('../../../../logger', () => ({
  getLoggerInstance: vi.fn(() => ({
    child: vi.fn().mockReturnThis(),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  })),
}));
import { webSearchTool } from './webSearch.tool.js';

describe('webSearchTool', () => {
  let mockCtx: Ctx;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(global, 'fetch').mockRestore(); // Restore fetch mock

    mockCtx = {
      job: {
        data: { prompt: 'test prompt' },
        id: 'test-job-id',
        isFailed: vi.fn(),
        name: 'test-job',
      },
      llm: {} as ILlmProvider,
      log: getLoggerInstance(),
      reportProgress: vi.fn(),
      session: {} as SessionData,
      streamContent: vi.fn(),
      taskQueue: {} as Queue,
    };
  });

  it('should perform a web search and return a summary', async () => {
    const mockApiResponse = {
      AbstractText: 'Test answer',
      RelatedTopics: [
        {
          FirstURL: 'http://example.com/1',
          Text: 'Result 1',
        },
        {
          FirstURL: 'http://example.com/2',
          Text: 'Result 2',
        },
      ],
    };

    const mockResponse = {
      json: () => Promise.resolve(mockApiResponse),
      ok: true,
    } as Response;

    vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

    const query = 'test search';
    const result = await webSearchTool.execute({ query }, mockCtx);

    expect(getLoggerInstance().info).toHaveBeenCalledWith(
      `Performing web search for: "${query}"`,
    );
    expect(result).toContain('Test answer');
    expect(result).toContain('- [Result 1](http://example.com/1)');
    expect(result).toContain('- [Result 2](http://example.com/2)');
  });

  it('should return a message if no direct answer is found', async () => {
    const mockApiResponse = {
      AbstractText: '',
      RelatedTopics: [],
    };

    const mockResponse = {
      json: () => Promise.resolve(mockApiResponse),
      ok: true,
    } as Response;

    vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

    const query = 'test search';
    const result = await webSearchTool.execute({ query }, mockCtx);

    expect(result).toEqual('No direct answer found for this query.');
  });

  it('should return an error message if fetch request fails', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: () => Promise.resolve('API error'),
    } as Response;

    vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

    const query = 'test search';
    const result = await webSearchTool.execute({ query }, mockCtx);

    expect(result).toEqual({
      erreur: 'DuckDuckGo API request failed: API error',
    });
    expect(getLoggerInstance().error).toHaveBeenCalled();
  });

  it('should return an error message if the fetch call throws an exception', async () => {
    const errorMessage = 'Network failure';
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error(errorMessage));

    const query = 'test search';
    const result = await webSearchTool.execute({ query }, mockCtx);

    expect(result).toEqual({
      erreur: `An unexpected error occurred: ${errorMessage}`,
    });
    expect(getLoggerInstance().error).toHaveBeenCalled();
  });
});
