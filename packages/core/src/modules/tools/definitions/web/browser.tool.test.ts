/// <reference types="vitest/globals" />
import { afterAll, describe, expect, it, vi } from 'vitest';

import { browserTool } from './browser.tool.js';
import { closeBrowser } from './browserManager.js';

// Mock browserManager to prevent actual browser launches and closures
vi.mock('./browserManager.js', () => ({
  closeBrowser: vi.fn(() => Promise.resolve()),
  getBrowser: vi.fn(() => ({
    newPage: vi.fn(() => ({
      close: vi.fn(() => Promise.resolve()),
      evaluate: vi.fn(() => Promise.resolve('Mocked page content')),
      goto: vi.fn(() => Promise.resolve()),
    })),
  })),
}));

// Mock redisClient to prevent actual Redis interactions
vi.mock('../../../redis/redisClient.js', () => ({
  redisClient: {
    publish: vi.fn(() => Promise.resolve()),
  },
}));

import { getLoggerInstance } from '../../logger';

// Mock the logger to prevent console output during tests
vi.mock('../../logger', () => ({
  getLoggerInstance: vi.fn(() => ({
    child: vi.fn().mockReturnThis(),
    debug: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    info: vi.fn(),
    level: 'debug',
    warn: vi.fn(),
  })),
}));

describe.skip('browserTool', () => {
  afterAll(async () => {
    // Ensure browser is closed after all tests in this suite
    await closeBrowser();
  });

  it('should execute successfully and return content', async () => {
    const mockCtx = {
      job: {
        data: { prompt: 'test' },
        id: 'test-job-id',
        isFailed: vi.fn(() => Promise.resolve(false)),
        name: 'mock-job',
      },
      llm: {} as any, // Mock LLM provider
      log: getLoggerInstance(),
      session: {} as any, // Mock session
      taskQueue: {} as any, // Mock task queue
    };
    const args = { url: 'https://example.com' };

    const result = await browserTool.execute(args, mockCtx);

    expect(result).toEqual({
      content: 'Mocked page content',
      url: 'https://example.com',
    });
    expect(mockCtx.log.info).toHaveBeenCalledWith(
      `Navigating to URL: ${args.url}`,
    );
    expect(mockCtx.log.info).toHaveBeenCalledWith('New page created.');
    expect(mockCtx.log.info).toHaveBeenCalledWith(`Going to ${args.url}...`);
    expect(mockCtx.log.info).toHaveBeenCalledWith(`Page loaded: ${args.url}`);
    expect(mockCtx.log.info).toHaveBeenCalledWith(
      `Successfully retrieved content from ${args.url}. Length: ${'Mocked page content'.length}`,
    );
  });
});
