/// <reference types="vitest/globals" />
import { Job, Queue } from 'bullmq';
import { describe, expect, it, Mock, vi } from 'vitest';

import logger from '../../logger.js';
import { Ctx, SessionData } from '../../types.js';
import { llmProvider } from '../../utils/llmProvider.js';
import { summarizeTool } from './summarize.tool.js';

vi.mock('../../utils/llmProvider.js', () => ({
  llmProvider: {
    getLlmResponse: vi.fn(),
  },
}));

vi.mock('../../logger.js', () => ({
  default: {
    child: vi.fn().mockReturnThis(),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('summarizeTool', () => {
  const mockCtx: Ctx = {
    job: { id: 'test-job-id' } as Job,
    llm: llmProvider,
    log: logger,
    reportProgress: vi.fn(),
    session: {} as SessionData,
    streamContent: vi.fn(),
    taskQueue: {} as Queue,
  };

  it('should summarize the given text', async () => {
    const textToSummarize = 'This is a long text that needs to be summarized.';
    const expectedSummary = 'This is a summary.';
    (llmProvider.getLlmResponse as Mock).mockResolvedValue(expectedSummary);

    const result = await summarizeTool.execute(
      { text: textToSummarize },
      mockCtx,
    );
    expect(result).toBe(expectedSummary);
    expect(llmProvider.getLlmResponse).toHaveBeenCalled();
    expect(mockCtx.log.info).toHaveBeenCalledWith(
      textToSummarize,
      'Summarizing text',
    );
  });

  it('should return an error if LLM response fails', async () => {
    const textToSummarize = 'Another text.';
    const errorMessage = 'LLM failed to summarize.';
    (llmProvider.getLlmResponse as Mock).mockRejectedValue(
      new Error(errorMessage),
    );

    const result = await summarizeTool.execute(
      { text: textToSummarize },
      mockCtx,
    );
    expect(result).toHaveProperty('erreur');
    expect(
      typeof result === 'object' && result !== null && 'erreur' in result
        ? result.erreur
        : result,
    ).toContain(errorMessage);
    expect(mockCtx.log.error).toHaveBeenCalled();
  });
});
