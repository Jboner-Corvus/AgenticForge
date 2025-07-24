// Mock dependencies
vi.mock('@/modules/llm/LlmKeyManager');
vi.mock('@/config', () => ({
  config: {
    LLM_API_KEYS: {},
    LLM_MODEL_NAME: 'gemini-pro',
    LLM_PROVIDER: 'gemini',
  },
}));
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { config } from '@/config';
import { LlmKeyManager } from '@/modules/llm/LlmKeyManager';
import { redis } from '@/modules/redis/redisClient';

import { LLMContent } from '../modules/llm/llm-types.js';
import { getLlmProvider } from './llmProvider';

let mockLlmKeyManager: any;
let mockFetch: any;
let mockRedis: any;

describe('llmProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLlmKeyManager = {
      getNextAvailableKey: vi.fn(),
      markKeyAsPermanentBroken: vi.fn(),
      markKeyAsTemporaryBroken: vi.fn(),
      markKeyAsWorking: vi.fn(),
    };

    mockRedis = {
      incrby: vi.fn(),
    };

    mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Reset config mock for each test
    vi.doMock('../../config', () => ({
      config: {
        LLM_API_KEYS: {},
        LLM_MODEL_NAME: 'gemini-pro',
        LLM_PROVIDER: 'gemini',
      },
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return the correct LLM provider based on config', () => {
    config.LLM_PROVIDER = 'openai';
    const provider = getLlmProvider();
    expect(provider.constructor.name).toBe('OpenAIProvider');

    config.LLM_PROVIDER = 'mistral';
    const provider2 = getLlmProvider();
    expect(provider2.constructor.name).toBe('MistralProvider');

    config.LLM_PROVIDER = 'huggingface';
    const provider3 = getLlmProvider();
    expect(provider3.constructor.name).toBe('HuggingFaceProvider');

    config.LLM_PROVIDER = 'gemini';
    const provider4 = getLlmProvider();
    expect(provider4.constructor.name).toBe('GeminiProvider');
  });

  it('should call redis.incrby with estimated tokens', async () => {
    mockLlmKeyManager.getNextAvailableKey.mockResolvedValue({
      apiKey: 'test-key',
      provider: 'gemini',
    });
    mockFetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          candidates: [{ content: { parts: [{ text: 'response' }] } }],
        }),
      ok: true,
    });

    const provider = getLlmProvider();
    await provider.getLlmResponse([
      { parts: [{ text: 'prompt' }], role: 'user' } as LLMContent,
    ]);

    expect(mockRedis.incrby).toHaveBeenCalledWith(
      'llm:gemini:tokens',
      expect.any(Number),
    );
  });

  it('should handle empty systemPrompt gracefully', async () => {
    mockLlmKeyManager.getNextAvailableKey.mockResolvedValue({
      apiKey: 'test-key',
      provider: 'gemini',
    });
    mockFetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          candidates: [{ content: { parts: [{ text: 'response' }] } }],
        }),
      ok: true,
    });

    const provider = getLlmProvider();
    const messages = [
      { parts: [{ text: 'user message' }], role: 'user' } as LLMContent,
    ];
    const response = await provider.getLlmResponse(messages, ''); // Empty system prompt
    expect(response).toBe('response');
  });

  it('should handle empty messages array gracefully', async () => {
    mockLlmKeyManager.getNextAvailableKey.mockResolvedValue({
      apiKey: 'test-key',
      provider: 'gemini',
    });
    mockFetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          candidates: [{ content: { parts: [{ text: 'response' }] } }],
        }),
      ok: true,
    });

    const provider = getLlmProvider();
    const response = await provider.getLlmResponse([
      { parts: [], role: 'user' } as LLMContent,
    ]); // Empty messages array
    expect(response).toBe('response');
  });

  it('should handle unknown LLM provider from LlmKeyManager', async () => {
    mockLlmKeyManager.getNextAvailableKey.mockResolvedValue({
      apiKey: 'test-key',
      provider: 'unknown',
    });

    const provider = getLlmProvider();
    // Expect it to fallback to GeminiProvider and log a warning
    expect(provider.constructor.name).toBe('GeminiProvider');
    // You might want to spy on logger.warn to confirm the warning is logged
  });

  it('should handle valid LLM API response with empty content', async () => {
    mockLlmKeyManager.getNextAvailableKey.mockResolvedValue({
      apiKey: 'test-key',
      provider: 'gemini',
    });
    mockFetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          candidates: [{ content: { parts: [{ text: '' }] } }],
        }),
      ok: true,
    });

    const provider = getLlmProvider();
    const response = await provider.getLlmResponse([
      { parts: [{ text: 'prompt' }], role: 'user' },
    ]);

    expect(response).toBe('');
  });

  it('should log error and not interrupt main flow if redis.incrby fails', async () => {
    mockLlmKeyManager.getNextAvailableKey.mockResolvedValue({
      apiKey: 'test-key',
      provider: 'gemini',
    });
    mockFetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          candidates: [{ content: { parts: [{ text: 'response' }] } }],
        }),
      ok: true,
    });
    mockRedis.incrby.mockRejectedValue(new Error('Redis increment failed'));

    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const provider = getLlmProvider();
    const response = await provider.getLlmResponse([
      { parts: [{ text: 'prompt' }], role: 'user' },
    ]);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error incrementing token count in Redis:',
      expect.any(Error),
    );
    expect(response).toBe('response'); // Main flow should not be interrupted
    consoleErrorSpy.mockRestore();
  });
});
