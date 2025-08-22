import { Queue } from 'bullmq';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getLoggerInstance } from '../../../../logger';
import { Ctx, ILlmProvider, SessionData } from '../../../../types.ts';

// Define the mock for getLoggerInstance outside vi.mock to ensure consistency
const mockLoggerInstance = {
  child: vi.fn().mockReturnThis(),
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
};

vi.mock('../../../../logger', () => ({
  getLoggerInstance: vi.fn(() => mockLoggerInstance),
}));

// Mock puppeteer
vi.mock('puppeteer', () => {
  const mockPage = {
    evaluate: vi.fn(),
    goto: vi.fn(),
    screenshot: vi.fn(),
  };

  const mockBrowser = {
    close: vi.fn(),
    newPage: vi.fn().mockResolvedValue(mockPage),
  };

  return {
    default: {
      launch: vi.fn().mockResolvedValue(mockBrowser),
    },
  };
});

import { webSearchTool } from './webSearch.tool.ts';

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
    // Get the mocked puppeteer module
    const puppeteer = await import('puppeteer');

    // Mock the page methods
    const mockPage = {
      evaluate: vi.fn().mockResolvedValue([
        {
          description: 'Result 1 description',
          title: 'Result 1',
          url: 'http://example.com/1',
        },
        {
          description: 'Result 2 description',
          title: 'Result 2',
          url: 'http://example.com/2',
        },
      ]),
      goto: vi.fn(),
      screenshot: vi.fn().mockResolvedValue('mock-base64-screenshot'),
    };

    // Mock the browser methods
    const mockBrowser = {
      close: vi.fn(),
      newPage: vi.fn().mockResolvedValue(mockPage),
    };

    // Update the launch mock to return our new mockBrowser
    vi.mocked(puppeteer.default.launch).mockResolvedValue(mockBrowser as any);

    const query = 'test search';
    const result = (await webSearchTool.execute({ query }, mockCtx)) as {
      screenshot: string;
      summary: string;
    };

    expect(mockLoggerInstance.info).toHaveBeenCalledWith(
      `Performing web search for: "${query}"`,
    );
    expect(result.screenshot).toBe('mock-base64-screenshot');
    expect(result.summary).toContain('[Result 1](http://example.com/1)');
    expect(result.summary).toContain('[Result 2](http://example.com/2)');
  });

  it('should return an error message if the browser launch fails', async () => {
    const errorMessage = 'Browser launch failed';
    const puppeteer = await import('puppeteer');
    vi.mocked(puppeteer.default.launch).mockRejectedValue(
      new Error(errorMessage),
    );

    const query = 'test search';
    const result = (await webSearchTool.execute({ query }, mockCtx)) as {
      screenshot: string;
      summary: string;
    };

    expect(result.screenshot).toBe('');
    expect(result.summary).toContain(
      `An unexpected error occurred: ${errorMessage}`,
    );
    expect(mockLoggerInstance.error).toHaveBeenCalled();
  });

  it('should return an error message if the page navigation fails', async () => {
    const errorMessage = 'Navigation failed';
    const puppeteer = await import('puppeteer');

    // Mock the page methods
    const mockPage = {
      evaluate: vi.fn(),
      goto: vi.fn().mockRejectedValue(new Error(errorMessage)),
      screenshot: vi.fn(),
    };

    // Mock the browser methods
    const mockBrowser = {
      close: vi.fn(),
      newPage: vi.fn().mockResolvedValue(mockPage),
    };

    // Update the launch mock to return our new mockBrowser
    vi.mocked(puppeteer.default.launch).mockResolvedValue(mockBrowser as any);

    const query = 'test search';
    const result = (await webSearchTool.execute({ query }, mockCtx)) as {
      screenshot: string;
      summary: string;
    };

    expect(result.screenshot).toBe('');
    expect(result.summary).toContain(
      `An unexpected error occurred: ${errorMessage}`,
    );
    expect(mockLoggerInstance.error).toHaveBeenCalled();
  });
});
