import type { Bindings } from 'pino';

import { vi } from 'vitest';

import { config } from '../config';
import logger from '../logger';
import { LlmKeyErrorType, LlmKeyManager } from '../modules/llm/LlmKeyManager';
import { redis } from '../modules/redis/redisClient';
import { llmProvider } from './llmProvider';

// Mock external dependencies
vi.mock('../config', () => ({
  config: {
    LLM_MODEL_NAME: 'gemini-pro',
    LLM_PROVIDER: 'gemini',
  },
}));
vi.mock('../modules/llm/LlmKeyManager', () => ({
  LlmKeyErrorType: {
    PERMANENT: 'PERMANENT',
    TEMPORARY: 'TEMPORARY',
  },
  LlmKeyManager: {
    getNextAvailableKey: vi.fn(),
    markKeyAsBad: vi.fn(),
    resetKeyStatus: vi.fn(),
  },
}));
import { mockRedis } from '../../test/mocks/redisClient.mock';
vi.mock('../logger', () => ({
  __esModule: true,
  default: {
    child: vi.fn(() => ({
      error: vi.fn((_obj: Bindings, _msg: string) => {}), // Explicitly define signature
      info: vi.fn(),
      warn: vi.fn(),
    })),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('llmProvider', () => {
  const mockMessages: { parts: { text: string }[]; role: "model" | "user" }[] = [{ parts: [{ text: 'Hello' }], role: 'user' }];
  const mockSystemPrompt = 'You are a helpful assistant.';
  const mockApiKey = { key: 'test_key', provider: 'gemini' };

  beforeEach(() => {
    vi.clearAllMocks();
    (LlmKeyManager.getNextAvailableKey as any).mockResolvedValue(mockApiKey);
    // (redis.incrby as any).mockResolvedValue(1); // Removed as incrby already returns a promise
  });

  describe('GeminiProvider', () => {
    beforeAll(() => {
      config.LLM_PROVIDER = 'gemini';
      config.LLM_MODEL_NAME = 'gemini-pro';
    });

    it('should return LLM response successfully', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: 'Mocked Gemini Response',
            }],
          },
        }],
      };
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
        ok: true,
      } as Response);

      const response = await llmProvider.getLlmResponse(mockMessages, mockSystemPrompt);
      expect(response).toEqual('Mocked Gemini Response');
      expect(LlmKeyManager.resetKeyStatus).toHaveBeenCalledWith(mockApiKey.provider, mockApiKey.key);
      expect(redis.incrby).toHaveBeenCalled();
    });

    it('should handle API error and mark key as bad', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
      } as Response);

      const response = await llmProvider.getLlmResponse(mockMessages, mockSystemPrompt);
      expect(response).toEqual('{"tool": "error", "parameters": {"message": "Gemini API request failed with status 401: Unauthorized"}}');
      expect(LlmKeyManager.markKeyAsBad).toHaveBeenCalledWith(mockApiKey.provider, mockApiKey.key, LlmKeyErrorType.PERMANENT);
    });

    it('should handle invalid response structure', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        json: () => Promise.resolve({}),
        ok: true,
      } as Response);

      const response = await llmProvider.getLlmResponse(mockMessages, mockSystemPrompt);
      expect(response).toContain('Invalid response structure from Gemini API');
      expect(LlmKeyManager.markKeyAsBad).toHaveBeenCalledWith(mockApiKey.provider, mockApiKey.key, LlmKeyErrorType.TEMPORARY);
    });

    it('should return error if no API key is available', async () => {
      (LlmKeyManager.getNextAvailableKey as any).mockResolvedValue(null);
      const response = await llmProvider.getLlmResponse(mockMessages, mockSystemPrompt);
      expect(response).toEqual('{"tool": "error", "parameters": {"message": "No LLM API key available."}}');
      expect(logger.child({}).error).toHaveBeenCalledWith({}, 'No LLM API key available.');
    });
  });

  describe('MistralProvider', () => {
    beforeAll(() => {
      config.LLM_PROVIDER = 'mistral';
      config.LLM_MODEL_NAME = 'mistral-tiny';
    });

    it('should return LLM response successfully', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Mocked Mistral Response',
          },
        }],
      };
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
        ok: true,
      } as Response);

      const response = await llmProvider.getLlmResponse(mockMessages, mockSystemPrompt);
      expect(response).toEqual('Mocked Mistral Response');
      expect(LlmKeyManager.resetKeyStatus).toHaveBeenCalledWith(mockApiKey.provider, mockApiKey.key);
      expect(redis.incrby).toHaveBeenCalled();
    });
  });

  describe('OpenAIProvider', () => {
    beforeAll(() => {
      config.LLM_PROVIDER = 'openai';
      config.LLM_MODEL_NAME = 'gpt-3.5-turbo';
    });

    it('should return LLM response successfully', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Mocked OpenAI Response',
          },
        }],
      };
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
        ok: true,
      } as Response);

      const response = await llmProvider.getLlmResponse(mockMessages, mockSystemPrompt);
      expect(response).toEqual('Mocked OpenAI Response');
      expect(LlmKeyManager.resetKeyStatus).toHaveBeenCalledWith(mockApiKey.provider, mockApiKey.key);
      expect(redis.incrby).toHaveBeenCalled();
    });
  });

  describe('HuggingFaceProvider', () => {
    beforeAll(() => {
      config.LLM_PROVIDER = 'huggingface';
      config.LLM_MODEL_NAME = 'gpt2'; // Example HF model
    });

    it('should return LLM response successfully', async () => {
      const mockResponse = [{
        generated_text: 'Mocked HuggingFace Response',
      }];
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
        ok: true,
      } as Response);

      const response = await llmProvider.getLlmResponse(mockMessages, mockSystemPrompt);
      expect(response).toEqual('Mocked HuggingFace Response');
      expect(LlmKeyManager.resetKeyStatus).toHaveBeenCalledWith(mockApiKey.provider, mockApiKey.key);
      expect(redis.incrby).toHaveBeenCalled();
    });
  });

  describe('Default Provider', () => {
    beforeAll(() => {
      config.LLM_PROVIDER = 'gemini'; // Set to a valid provider for testing default behavior
    });

    it('should default to GeminiProvider if LLM_PROVIDER is unknown', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: 'Mocked Gemini Response (default)',
            }],
          },
        }],
      };
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
        ok: true,
      } as Response);

      const response = await llmProvider.getLlmResponse(mockMessages, mockSystemPrompt);
      expect(response).toEqual('{"tool": "error", "parameters": {"message": "Gemini API request failed with status 401: Unauthorized"}}');
      expect(logger.warn).toHaveBeenCalledWith(
        `Unknown LLM_PROVIDER: unknown. Defaulting to GeminiProvider.`,
      );
    });
  });
});