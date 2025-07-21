/// <reference types="vitest/globals" />
import { describe, expect, it, vi } from 'vitest';

vi.mock('playwright', async () => {
  const vitest = await import('vitest');
  return {
    chromium: {
      launch: vitest.vi.fn().mockResolvedValue({
        close: vitest.vi.fn().mockResolvedValue(undefined),
        newPage: vitest.vi.fn().mockResolvedValue({
          evaluate: vitest.vi.fn().mockResolvedValue('Mocked page content'),
          goto: vitest.vi.fn().mockResolvedValue(undefined),
        }),
      }),
    },
  };
});

import loggerMock from '../../../../test/mocks/logger.js';
vi.mock('../../../../logger.js', () => ({
  default: loggerMock,
}));

import { Queue } from 'bullmq';
import { chromium } from 'playwright';

import logger from '../../../../logger.js';
import { Ctx, ILlmProvider, SessionData } from '../../../../types.js';
import { browserTool } from './browser.tool.js';

describe('browserTool', () => {
  const mockCtx: Ctx = {
    llm: {} as ILlmProvider,
    log: logger,
    reportProgress: vi.fn(),
    session: {} as SessionData,
    streamContent: vi.fn(),
    taskQueue: {} as Queue,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should navigate to a URL and return its content', async () => {
    const url = 'https://example.com';
    const result = await browserTool.execute({ url }, mockCtx);

    expect(chromium.launch).toHaveBeenCalled();
    expect(result).toEqual({ content: 'Mocked page content', url });
    expect(loggerMock.info).toHaveBeenCalledWith(`Navigating to URL: ${url}`);
  });

  it('should return an error if navigation fails', async () => {
    const url = 'https://bad-url.com';

    vi.mocked(chromium.launch).mockResolvedValueOnce({
      close: vi.fn().mockResolvedValue(undefined),
      newPage: vi.fn().mockResolvedValue({
        evaluate: vi.fn(),
        goto: vi.fn().mockRejectedValue(new Error('Navigation failed')),
      } as any),
    } as any);

    const result = await browserTool.execute({ url }, mockCtx);
    expect(result).toHaveProperty('erreur');
    expect(
      typeof result === 'object' && result !== null && 'erreur' in result
        ? result.erreur
        : result,
    ).toContain('Navigation failed');
    expect(loggerMock.error).toHaveBeenCalled();
  });
});
