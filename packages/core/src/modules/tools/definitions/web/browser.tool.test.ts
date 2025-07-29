/// <reference types="vitest/globals" />
import { describe, expect, it, vi } from 'vitest';

vi.mock('playwright', async () => {
  const vitest = await import('vitest');
  return {
    chromium: {
      launch: vitest.vi.fn().mockResolvedValue({
        close: vitest.vi.fn().mockResolvedValue(undefined),
        newPage: vitest.vi.fn().mockResolvedValue({
          evaluate: vitest.vi.fn(),
          goto: vitest.vi.fn(),
        }),
      }),
    },
  };
});

import loggerMock from '../../../../test/mocks/logger.js';
vi.mock('../../../../logger.js', () => ({
  getLogger: loggerMock,
}));

import { Queue } from 'bullmq';
import { chromium } from 'playwright';

import { Ctx, ILlmProvider, SessionData } from '@/types.js';

import { getLogger } from '../../../../logger.js';
import { browserTool } from './browser.tool.js';
import { closeBrowser } from './browserManager.js';

describe('browserTool', () => {
  const mockCtx: Ctx = {
    llm: {} as ILlmProvider,
    log: getLogger(),
    reportProgress: vi.fn(),
    session: {} as SessionData,
    streamContent: vi.fn(),
    taskQueue: {} as Queue,
  };

  let mockPage: any; // Declare mockPage here to access it later

  beforeEach(async () => {
    await closeBrowser();
    vi.clearAllMocks();

    const mockBrowser = {
      close: vi.fn().mockResolvedValue(undefined),
      newPage: vi.fn().mockResolvedValue({
        close: vi.fn().mockResolvedValue(undefined),
        evaluate: vi.fn(),
        goto: vi.fn(), // This is the mock we need to control
      }),
    };

    vi.mocked(chromium.launch).mockResolvedValue(mockBrowser as any);
    mockPage = await mockBrowser.newPage();
  });

  it('should navigate to a URL and return its content', async () => {
    const url = 'https://example.com';
    mockPage.evaluate.mockResolvedValue('Mocked page content'); // Set evaluate mock here
    mockPage.goto.mockResolvedValue(undefined); // Ensure goto resolves for this test

    const result = await browserTool.execute({ url }, mockCtx);

    expect(chromium.launch).toHaveBeenCalled();
    expect(result).toEqual({ content: 'Mocked page content', url });
    expect(loggerMock.info).toHaveBeenCalledWith(`Navigating to URL: ${url}`);
  });

  it('should return an error if navigation fails', async () => {
    const url = 'https://bad-url.com';
    const errorMessage = 'Navigation failed';

    // Now, set the mockRejectedValue on the specific mockPage.goto
    mockPage.goto.mockRejectedValue(new Error(errorMessage));

    const result = await browserTool.execute({ url }, mockCtx);

    expect(result).toHaveProperty('erreur');
    expect(
      typeof result === 'object' && result !== null && 'erreur' in result
        ? result.erreur
        : result,
    ).toContain(`Error while Browse ${url}: ${errorMessage}`);
    expect(loggerMock.error).toHaveBeenCalled();
    expect(mockPage.goto).toHaveBeenCalledWith(url, expect.any(Object));
    expect(mockPage.close).toHaveBeenCalled();
  });
});
