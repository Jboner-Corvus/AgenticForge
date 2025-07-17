import { Queue } from 'bullmq';
import { chromium } from 'playwright';
/// <reference types="vitest/globals" />
import { describe, expect, it, Mock, vi } from 'vitest';

import logger from '../logger.js';
import { Ctx, ILlmProvider, SessionData } from '../types.js';
import { browserTool } from './web/browser.tool.js';

vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn(() => ({
      close: vi.fn(() => Promise.resolve()),
      newPage: vi.fn(() => ({
        evaluate: vi.fn(() => Promise.resolve('Mocked page content')),
        goto: vi.fn(() => Promise.resolve()),
      })),
    })),
  },
}));

vi.mock('../logger.js', () => ({
  default: {
    child: vi.fn().mockReturnThis(),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

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
    expect(mockCtx.log.info).toHaveBeenCalledWith(`Navigating to URL: ${url}`);
  });

  it('should return an error if navigation fails', async () => {
    const url = 'https://bad-url.com';

    (chromium.launch as Mock).mockImplementationOnce(() => ({
      close: vi.fn(() => Promise.resolve()),
      newPage: vi.fn(() => ({
        evaluate: vi.fn(),
        goto: vi.fn(() => Promise.reject(new Error('Navigation failed'))),
      })),
    }));

    const result = await browserTool.execute({ url }, mockCtx);
    expect(result).toHaveProperty('erreur');
    expect(
      typeof result === 'object' && result !== null && 'erreur' in result
        ? result.erreur
        : result,
    ).toContain('Navigation failed');
    expect(mockCtx.log.error).toHaveBeenCalled();
  });
});
