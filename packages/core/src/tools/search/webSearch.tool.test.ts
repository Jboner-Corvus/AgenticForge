import { Job, Queue } from 'bullmq';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { config } from '../../config.js';
import logger from '../../logger.js';
import { Ctx, SessionData } from '../../types.js';
import { webSearchTool } from './webSearch.tool.js';

// Mock external dependencies
vi.mock('../../config.js', () => ({
  config: {
    TAVILY_API_KEY: 'mock-api-key',
  },
}));

vi.mock('node-fetch'); // Keep the mock simple if not used directly

vi.mock('../../logger.js', () => ({
  default: {
    child: vi.fn().mockReturnThis(),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('webSearchTool', () => {
  let mockCtx: Ctx;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(global, 'fetch').mockRestore(); // Restore fetch mock

    mockCtx = {
      job: { id: 'test-job-id' } as Job,
      log: logger,
      reportProgress: vi.fn(),
      session: {} as SessionData,
      streamContent: vi.fn(),
      taskQueue: {} as Queue,
    };

    // Reset API key before each test
    config.TAVILY_API_KEY = 'mock-api-key';
  });

  it('should perform a web search and return a summary', async () => {
    const mockApiResponse = {
      answer: 'Test answer',
      results: [
        {
          content: 'Content 1',
          title: 'Result 1',
          url: 'http://example.com/1',
        },
        {
          content: 'Content 2',
          title: 'Result 2',
          url: 'http://example.com/2',
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

    expect(mockCtx.log.info).toHaveBeenCalledWith(
      `Performing web search for: "${query}"`,
    );
    expect(result).toContain('Test answer');
    expect(result).toContain('[Result 1](http://example.com/1): Content 1');
    expect(result).toContain('[Result 2](http://example.com/2): Content 2');
  });

  it('should return an error message if API key is not configured', async () => {
    config.TAVILY_API_KEY = undefined; // Simulate missing API key
    const query = 'test search';
    const result = await webSearchTool.execute({ query }, mockCtx);

    expect(result).toEqual({ erreur: 'Tavily API key is not configured.' });
    expect(mockCtx.log.error).toHaveBeenCalledWith(
      'Tavily API key is not configured.',
    );
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
      erreur: 'Tavily API request failed: API error',
    });
    expect(mockCtx.log.error).toHaveBeenCalled();
  });

  it('should return an error message if the fetch call throws an exception', async () => {
    const errorMessage = 'Network failure';
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error(errorMessage));

    const query = 'test search';
    const result = await webSearchTool.execute({ query }, mockCtx);

    expect(result).toEqual({
      erreur: `An unexpected error occurred: ${errorMessage}`,
    });
    expect(mockCtx.log.error).toHaveBeenCalled();
  });
});
