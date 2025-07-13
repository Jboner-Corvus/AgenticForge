import { Job, Queue } from 'bullmq';
/// <reference types="vitest/globals" />
import { chromium } from 'playwright';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Ctx, SessionData } from '../types.js';
import { browserTool } from './browser.tool.js';

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

describe('browserTool', () => {
  vi.mock('../logger.js', () => {
  const mockLogger = {
    level: 'info',
    silent: vi.fn(),
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn(() => mockLogger),
    version: '9.7.0',
    levels: {
      labels: { 10: 'trace', 20: 'debug', 30: 'info', 40: 'warn', 50: 'error', 60: 'fatal' },
      values: { trace: 10, debug: 20, info: 30, warn: 40, error: 50, fatal: 60 },
    },
    useLevelLabels: false,
    levelVal: 30,
    isLevelEnabled: vi.fn(() => true),
    flush: vi.fn(),
    on: vi.fn(),
    bindings: vi.fn(() => ({})),
    setBindings: vi.fn(),
    stdSerializers: {},
    customLevels: {},
    useOnlyCustomLevels: false,
  };
  return {
    default: mockLogger,
  };
});

  import logger from '../logger.js';

  const mockCtx: Ctx = {
    job: { id: 'test-job-id' } as Job,
    log: logger.default,
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
    (chromium.launch as vi.Mock).mockImplementationOnce(() => ({
      close: vi.fn(() => Promise.resolve()),
      newPage: vi.fn(() => ({
        evaluate: vi.fn(),
        goto: vi.fn(() => Promise.reject(new Error('Navigation failed'))),
      })),
    }));

    const result = await browserTool.execute({ url }, mockCtx);
    expect(result).toHaveProperty('erreur');
    expect(typeof result === 'object' && result !== null && 'erreur' in result ? result.erreur : result).toContain('Navigation failed');
    expect(mockCtx.log.error).toHaveBeenCalled();
  });
});
