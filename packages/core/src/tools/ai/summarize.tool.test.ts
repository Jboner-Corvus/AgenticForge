import { Job, Queue } from 'bullmq';
/// <reference types="vitest/globals" />
import { Mock, describe, expect, it, vi } from 'vitest';

import { Ctx, SessionData } from '../../types.js';
import { llmProvider } from '../../utils/llmProvider.js';
import { summarizeTool } from './summarize.tool.js';

vi.mock('../../utils/llmProvider.js', () => ({
  llmProvider: {
    getLlmResponse: vi.fn(),
  },
}));

describe('summarizeTool', () => {
  vi.mock('../../logger.js', () => {
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

  import logger from '../../logger.js';

  const mockCtx: Ctx = {
    job: { id: 'test-job-id' } as Job,
    log: logger.default,
    reportProgress: vi.fn(),
    session: {} as SessionData,
    streamContent: vi.fn(),
    taskQueue: {} as Queue,
  };

  it('should summarize the given text', async () => {
    const textToSummarize = 'This is a long text that needs to be summarized.';
    const expectedSummary = 'This is a summary.';
    (llmProvider.getLlmResponse as vi.Mock).mockResolvedValue(expectedSummary);

    const result = await summarizeTool.execute({ text: textToSummarize }, mockCtx);
    expect(result).toBe(expectedSummary);
    expect(llmProvider.getLlmResponse).toHaveBeenCalled();
    expect(mockCtx.log.info).toHaveBeenCalledWith(textToSummarize, 'Summarizing text');
  });

  it('should return an error if LLM response fails', async () => {
    const textToSummarize = 'Another text.';
    const errorMessage = 'LLM failed to summarize.';
    (llmProvider.getLlmResponse as vi.Mock).mockRejectedValue(new Error(errorMessage));

    const result = await summarizeTool.execute({ text: textToSummarize }, mockCtx);
    expect(result).toHaveProperty('erreur');
    expect(typeof result === 'object' && result !== null && 'erreur' in result ? result.erreur : result).toContain(errorMessage);
    expect(mockCtx.log.error).toHaveBeenCalled();
  });
});
