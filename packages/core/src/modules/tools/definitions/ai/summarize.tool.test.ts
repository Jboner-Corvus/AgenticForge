import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { Ctx } from '@/types';

import { ILlmProvider } from '../../../../types.js';
import { getLlmProvider } from '../../../../utils/llmProvider.js';
import { summarizeTool } from './summarize.tool.js';

// Mock dependencies
vi.mock('../../../../utils/llmProvider.js', () => {
  const mockGetLlmResponse = vi.fn();
  return {
    getLlmProvider: vi.fn(() => ({
      getLlmResponse: mockGetLlmResponse,
    })),
  };
});

const mockLogger = {
  child: vi.fn().mockReturnThis(),
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
};

const mockCtx: Ctx = {
  llm: {} as any, // Will be set in beforeEach
  log: mockLogger as unknown as Ctx['log'],
  reportProgress: vi.fn(),
  session: {} as Ctx['session'],
  streamContent: vi.fn(),
  taskQueue: {} as Ctx['taskQueue'],
};

describe('summarizeTool', () => {
  let mockGetLlmResponse: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLlmResponse = vi.fn();
    vi.mocked(getLlmProvider).mockReturnValue({
      getErrorType: vi.fn(),
      getLlmResponse: mockGetLlmResponse,
    } as ILlmProvider);
    mockCtx.llm = getLlmProvider('gemini'); // Set the mocked LLM provider to context
  });

  it('should summarize the text successfully', async () => {
    vi.mocked(getLlmProvider('gemini').getLlmResponse).mockResolvedValue(
      'This is a summary.',
    );
    const result = await summarizeTool.execute(
      { text: 'Long text to summarize.' },
      mockCtx,
    );
    expect(result).toEqual('This is a summary.');
    expect(getLlmProvider('gemini').getLlmResponse).toHaveBeenCalled();
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
    vi.mocked(getLlmProvider('gemini').getLlmResponse).mockResolvedValue('');
    let result = await summarizeTool.execute({ text: 'Some text' }, mockCtx);
    expect(result).toEqual({
      erreur: 'Failed to summarize text: LLM returned empty response.',
    });
    expect(mockLogger.error).toHaveBeenCalledWith(
      'LLM returned empty response for summarization.',
    );

    vi.mocked(getLlmProvider('gemini').getLlmResponse).mockResolvedValue('');
    result = await summarizeTool.execute({ text: 'Some text' }, mockCtx);
    expect(result).toEqual({
      erreur: 'Failed to summarize text: LLM returned empty response.',
    });
    expect(mockLogger.error).toHaveBeenCalledWith(
      'LLM returned empty response for summarization.',
    );
  });
});
