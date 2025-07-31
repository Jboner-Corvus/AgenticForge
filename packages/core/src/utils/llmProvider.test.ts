import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { config } from '../config';
import { LlmKeyManager } from '../modules/llm/LlmKeyManager';
import { getLlmProvider } from './llmProvider';

vi.mock('../config', async (importOriginal) => {
  const original = await importOriginal<typeof import('../config')>();
  return {
    ...original,
    config: {
      ...original.config,
      LLM_API_KEYS: {},
    },
  };
});

vi.mock('../modules/llm/LlmKeyManager', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../modules/llm/LlmKeyManager')>();
  return {
    ...actual,
    LlmKeyErrorType: actual.LlmKeyErrorType,
    LlmKeyManager: {
      getNextAvailableKey: vi.fn(),
      markKeyAsBad: vi.fn().mockResolvedValue(undefined),
      resetKeyStatus: vi.fn().mockResolvedValue(undefined),
    },
  };
});

vi.mock('../modules/redis/redisClient.js', () => ({
  redisClient: {
    incrby: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('llmProvider', () => {
  let mockFetch: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockFetch = vi.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({
          candidates: [{ content: { parts: [{ text: 'default response' }] } }],
        }),
      ok: true,
    });
    global.fetch = mockFetch;

    vi.mocked(LlmKeyManager.getNextAvailableKey).mockResolvedValue({
      apiKey: 'test-key',
      provider: 'gemini',
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return the correct LLM provider based on the provided name', () => {
    let provider = getLlmProvider('openai');
    expect(provider.constructor.name).toBe('OpenAIProvider');

    provider = getLlmProvider('mistral');
    expect(provider.constructor.name).toBe('MistralProvider');

    provider = getLlmProvider('huggingface');
    expect(provider.constructor.name).toBe('HuggingFaceProvider');

    provider = getLlmProvider('gemini');
    expect(provider.constructor.name).toBe('GeminiProvider');
  });

  it('should throw LlmError if fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    const provider = getLlmProvider(config.LLM_PROVIDER);
    await expect(
      provider.getLlmResponse([
        {
          parts: [{ text: 'prompt' }],
          role: 'user',
        },
      ]),
    ).rejects.toThrow('Failed to communicate with the LLM.');
  });
});
