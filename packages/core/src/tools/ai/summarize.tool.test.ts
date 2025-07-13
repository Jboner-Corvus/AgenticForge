import { describe, it, expect, vi } from 'vitest';
import { summarizeTool } from './ai/summarize.tool';
import { llmProvider } from '../utils/llmProvider';
import { Ctx } from '../types';

vi.mock('../utils/llmProvider', () => ({
  llmProvider: {
    getLlmResponse: vi.fn(),
  },
}));

describe('summarizeTool', () => {
  const mockCtx: Ctx = {
    log: {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
    },
    job: { id: 'test-job-id' } as any,
    session: {} as any,
    taskQueue: {} as any,
    reportProgress: vi.fn(),
    streamContent: vi.fn(),
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
    expect(result.erreur).toContain(errorMessage);
    expect(mockCtx.log.error).toHaveBeenCalled();
  });
});
