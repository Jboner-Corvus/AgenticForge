import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Ctx } from '@/types';

import { getLlmProvider } from '../../../../utils/llmProvider.js';
import { summarizeTool } from './summarize.tool.js';

// Mock dependencies
vi.mock('../../../../utils/llmProvider.js', () => ({
  getLlmProvider: vi.fn(() => ({
    getLlmResponse: vi.fn(),
  })),
}));

const mockLogger = {
  child: vi.fn().mockReturnThis(),
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
};

const mockCtx: Ctx = {
  llm: getLlmProvider(),
  log: mockLogger as unknown as Ctx['log'],
  reportProgress: vi.fn(),
  session: {} as Ctx['session'],
  streamContent: vi.fn(),
  taskQueue: {} as Ctx['taskQueue'],
};

describe('summarizeTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should summarize the text successfully', async () => {
    vi.mocked(getLlmProvider().getLlmResponse).mockResolvedValue(
      'This is a summary.',
    );
    const result = await summarizeTool.execute(
      { text: 'Long text to summarize.' },
      mockCtx,
    );
    expect(result).toEqual('This is a summary.');
    expect(getLlmProvider().getLlmResponse).toHaveBeenCalled();
  });

  it('should return an error object if summarization fails', async () => {
    vi.mocked(getLlmProvider().getLlmResponse).mockResolvedValue('');
    const result = await summarizeTool.execute(
      { text: 'Long text to summarize.' },
      mockCtx,
    );
    expect(result).toEqual({ erreur: 'No LLM API key available.' });
  });

  it('should return an error object if textToSummarize is an empty string', async () => {
    const result = await summarizeTool.execute({ text: '' }, mockCtx);
    expect(result).toEqual({
      erreur:
        'Failed to summarize text: Input text for summarization is empty.',
    });
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Input text for summarization is empty.',
    );
  });

  it('should return an error object if getLlmResponse returns an empty string or null', async () => {
    vi.mocked(getLlmProvider().getLlmResponse).mockResolvedValue('');
    let result = await summarizeTool.execute({ text: 'Some text' }, mockCtx);
    expect(result).toEqual({
      erreur: 'Failed to summarize text: LLM returned empty response.',
    });
    expect(mockLogger.error).toHaveBeenCalledWith(
      'LLM returned empty response for summarization.',
    );

    vi.mocked(getLlmProvider().getLlmResponse).mockResolvedValue('');
    result = await summarizeTool.execute({ text: 'Some text' }, mockCtx);
    expect(result).toEqual({
      erreur: 'Failed to summarize text: LLM returned empty response.',
    });
    expect(mockLogger.error).toHaveBeenCalledWith(
      'LLM returned empty response for summarization.',
    );
  });
});
