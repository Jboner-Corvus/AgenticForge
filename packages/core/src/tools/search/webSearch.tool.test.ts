import { beforeEach, describe, expect, it, vi } from 'vitest';

import { config } from '../config.js';
import { Ctx } from '../types.js';
import { webSearchTool } from './webSearch.tool.js';

vi.mock('../config', () => ({
  config: {
    TAVILY_API_KEY: 'mock-api-key',
  },
}));

vi.mock('node-fetch', () => ({
  default: vi.fn(),
}));

describe('webSearchTool', () => {
  const mockCtx: Ctx = {
    job: { id: 'test-job-id' } as any,
    log: {
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    },
    reportProgress: vi.fn(),
    session: {} as any,
    streamContent: vi.fn(),
    taskQueue: {} as any,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should perform a web search and return a summary', async () => {
    const mockResponse = {
      json: () => Promise.resolve({
        answer: 'Test answer',
        results: [
          { content: 'Content 1', title: 'Result 1', url: 'http://example.com/1' },
          { content: 'Content 2', title: 'Result 2', url: 'http://example.com/2' },
        ],
      }),
      ok: true,
    };
    (global as any).fetch = vi.fn(() => Promise.resolve(mockResponse));

    const query = 'test search';
    const result = await webSearchTool.execute({ query }, mockCtx);

    expect(result).toContain('Test answer');
    expect(result).toContain('Result 1');
    expect(result).toContain('Result 2');
    expect(mockCtx.log.info).toHaveBeenCalledWith(`Performing web search for: "${query}"`);
  });

  it('should return an error if API key is not configured', async () => {
    config.TAVILY_API_KEY = undefined;
    const query = 'test search';
    const result = await webSearchTool.execute({ query }, mockCtx);
    expect(result).toHaveProperty('erreur');
    expect(result.erreur).toContain('Tavily API key is not configured.');
  });

  it('should return an error if fetch request fails', async () => {
    config.TAVILY_API_KEY = 'mock-api-key';
    (global as any).fetch = vi.fn(() => Promise.resolve({ ok: false, text: () => Promise.resolve('API error') }));

    const query = 'test search';
    const result = await webSearchTool.execute({ query }, mockCtx);
    expect(typeof result).toBe('object');
    if (typeof result === 'object' && result !== null && 'erreur' in result) {
      expect(result.erreur).toContain('API error');
    } else {
      throw new Error('Expected an object with an erreur property.');
    }
    expect(mockCtx.log.error).toHaveBeenCalled();
  });
});
