import { config } from '../config.js';
import logger from '../logger.js';
import { LLMContent } from '../modules/llm/llm-types.js';
import {
  LlmKeyErrorType,
  LlmKeyManager,
} from '../modules/llm/LlmKeyManager.js';
import { redis } from '../modules/redis/redisClient.js';

interface LLMProvider {
  getLlmResponse(
    messages: LLMContent[],
    systemPrompt?: string,
  ): Promise<string>;
}

class GeminiProvider implements LLMProvider {
  public async getLlmResponse(
    messages: LLMContent[],
    systemPrompt?: string,
  ): Promise<string> {
    const log = logger.child({ module: 'GeminiProvider' });

    const activeKey = await LlmKeyManager.getNextAvailableKey();
    if (!activeKey) {
      const errorMessage = 'No LLM API key available.';
      log.error(errorMessage);
      return `{"tool": "error", "parameters": {"message": "${errorMessage}"}}`;
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${config.LLM_MODEL_NAME}:generateContent?key=${activeKey.key}`;

    if (systemPrompt) {
      messages.unshift({
        parts: [{ text: systemPrompt }],
        role: 'user',
      });
    }

    const requestBody = {
      contents: messages,
    };

    const body = JSON.stringify(requestBody);

    try {
      const response = await fetch(apiUrl, {
        body,
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      if (!response.ok) {
        const errorBody = await response.text();
        const errorMessage = `Gemini API request failed with status ${response.status}: ${errorBody}`;
        log.error({ errorBody, status: response.status }, errorMessage);
        const errorType = this.getErrorType(response.status, errorBody);
        await LlmKeyManager.markKeyAsBad(
          activeKey.provider,
          activeKey.key,
          errorType,
        );
        return `{"tool": "error", "parameters": {"message": "${errorMessage}"}}`;
      }

      const data = await response.json();

      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        log.error(
          { response: data },
          'Invalid response structure from Gemini API',
        );
        const errorType = this.getErrorType(
          response.status,
          JSON.stringify(data),
        );
        await LlmKeyManager.markKeyAsBad(
          activeKey.provider,
          activeKey.key,
          errorType,
        );
        return `{"tool": "error", "parameters": {"message": "Invalid response structure from Gemini API. The model may have returned an empty response."}}`;
      }

      // Placeholder for token counting. In a real scenario, you'd parse the API response
      // for actual token counts or estimate them based on input/output length.
      // For now, we'll just increment by a fixed amount or based on content length.
      const estimatedTokens =
        messages.reduce(
          (sum, msg) =>
            sum +
            msg.parts.reduce(
              (partSum, part) => partSum + (part.text?.length || 0),
              0,
            ),
          0,
        ) + content.length;
      redis
        .incrby('leaderboard:tokensSaved', estimatedTokens)
        .catch((error: unknown) => {
          logger.error({ error }, 'Failed to increment tokensSaved in Redis');
        });

      // If successful, reset error count for this key
      await LlmKeyManager.resetKeyStatus(activeKey.provider, activeKey.key);

      return content.trim();
    } catch (error) {
      log.error({ error }, 'Failed to get response from LLM');
      if (activeKey) {
        // Assume network errors or unhandled exceptions are temporary
        await LlmKeyManager.markKeyAsBad(
          activeKey.provider,
          activeKey.key,
          LlmKeyErrorType.TEMPORARY,
        );
      }
      return `{"tool": "error", "parameters": {"message": "Failed to communicate with the LLM."}}`;
    }
  }

  private getErrorType(statusCode: number, errorBody: string): LlmKeyErrorType {
    if (statusCode === 401 || statusCode === 403) {
      // Unauthorized, Forbidden - likely invalid API key
      return LlmKeyErrorType.PERMANENT;
    } else if (statusCode === 429) {
      // Too Many Requests - rate limit
      return LlmKeyErrorType.TEMPORARY;
    } else if (statusCode >= 500) {
      // Server errors - temporary issues
      return LlmKeyErrorType.TEMPORARY;
    } else if (
      errorBody.includes('API key not valid') ||
      errorBody.includes('invalid_api_key')
    ) {
      return LlmKeyErrorType.PERMANENT;
    }
    // Default to temporary for unknown errors
    return LlmKeyErrorType.TEMPORARY;
  }
}

class HuggingFaceProvider implements LLMProvider {
  public async getLlmResponse(
    messages: LLMContent[],
    systemPrompt?: string,
  ): Promise<string> {
    const log = logger.child({ module: 'HuggingFaceProvider' });

    const activeKey = await LlmKeyManager.getNextAvailableKey();
    if (!activeKey) {
      const errorMessage = 'No LLM API key available.';
      log.error(errorMessage);
      return (
        '{"tool": "error", "parameters": {"message": "' + errorMessage + '"}}'
      );
    }

    const apiUrl = `https://api-inference.huggingface.co/models/${config.LLM_MODEL_NAME}`;

    const hfMessages = messages.map((msg) => ({
      content: msg.parts.map((part) => part.text).join(''),
      role: msg.role === 'user' ? 'user' : 'assistant',
    }));

    if (systemPrompt) {
      hfMessages.unshift({ content: systemPrompt, role: 'system' });
    }

    const requestBody = {
      inputs: hfMessages.map((msg) => msg.content).join('\n'), // HuggingFace often takes a single string input
      parameters: { max_new_tokens: 500 }, // Example parameter
    };

    const body = JSON.stringify(requestBody);

    try {
      const response = await fetch(apiUrl, {
        body,
        headers: {
          Authorization: `Bearer ${activeKey.key}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      if (!response.ok) {
        const errorBody = await response.text();
        const errorMessage = `HuggingFace API request failed with status ${response.status}: ${errorBody}`;
        log.error({ errorBody, status: response.status }, errorMessage);
        const errorType = this.getErrorType(response.status, errorBody);
        await LlmKeyManager.markKeyAsBad(
          activeKey.provider,
          activeKey.key,
          errorType,
        );
        return (
          '{"tool": "error", "parameters": {"message": "' + errorMessage + '"}}'
        );
      }

      const data = await response.json();

      const content = data?.[0]?.generated_text; // Adjust based on actual HF API response structure
      if (!content) {
        log.error(
          { response: data },
          'Invalid response structure from HuggingFace API',
        );
        const errorType = this.getErrorType(
          response.status,
          JSON.stringify(data),
        );
        await LlmKeyManager.markKeyAsBad(
          activeKey.provider,
          activeKey.key,
          errorType,
        );
        return '{"tool": "error", "parameters": {"message": "Invalid response structure from HuggingFace API. The model may have returned an empty response."}}';
      }

      // Placeholder for token counting
      const estimatedTokens =
        messages.reduce(
          (sum, msg) =>
            sum +
            msg.parts.reduce(
              (partSum, part) => partSum + (part.text?.length || 0),
              0,
            ),
          0,
        ) + content.length;
      redis
        .incrby('leaderboard:tokensSaved', estimatedTokens)
        .catch((error: unknown) => {
          logger.error({ error }, 'Failed to increment tokensSaved in Redis');
        });

      await LlmKeyManager.resetKeyStatus(activeKey.provider, activeKey.key);

      return content.trim();
    } catch (error) {
      log.error({ error }, 'Failed to get response from LLM');
      if (activeKey) {
        // Assume network errors or unhandled exceptions are temporary
        await LlmKeyManager.markKeyAsBad(
          activeKey.provider,
          activeKey.key,
          LlmKeyErrorType.TEMPORARY,
        );
      }
      return '{"tool": "error", "parameters": {"message": "Failed to communicate with the LLM."}}';
    }
  }

  private getErrorType(statusCode: number, errorBody: string): LlmKeyErrorType {
    if (statusCode === 401 || statusCode === 403) {
      // Unauthorized, Forbidden - likely invalid API key
      return LlmKeyErrorType.PERMANENT;
    } else if (statusCode === 429) {
      // Too Many Requests - rate limit
      return LlmKeyErrorType.TEMPORARY;
    } else if (statusCode >= 500) {
      // Server errors - temporary issues
      return LlmKeyErrorType.TEMPORARY;
    } else if (
      errorBody.includes('invalid_api_key') ||
      errorBody.includes('Authorization header is invalid')
    ) {
      return LlmKeyErrorType.PERMANENT;
    }
    // Default to temporary for unknown errors
    return LlmKeyErrorType.TEMPORARY;
  }
}

class MistralProvider implements LLMProvider {
  public async getLlmResponse(
    messages: LLMContent[],
    systemPrompt?: string,
  ): Promise<string> {
    const log = logger.child({ module: 'MistralProvider' });

    const activeKey = await LlmKeyManager.getNextAvailableKey();
    if (!activeKey) {
      const errorMessage = 'No LLM API key available.';
      log.error(errorMessage);
      return `{"tool": "error", "parameters": {"message": "${errorMessage}"}}`;
    }

    const apiUrl = 'https://api.mistral.ai/v1/chat/completions';

    const mistralMessages = messages.map((msg) => ({
      content: msg.parts.map((part) => part.text).join(''),
      role: msg.role === 'user' ? 'user' : 'model',
    }));

    if (systemPrompt) {
      mistralMessages.unshift({ content: systemPrompt, role: 'system' });
    }

    const requestBody = {
      messages: mistralMessages,
      model: config.LLM_MODEL_NAME, // Assuming LLM_MODEL_NAME can be a Mistral model
    };

    const body = JSON.stringify(requestBody);

    try {
      const response = await fetch(apiUrl, {
        body,
        headers: {
          Authorization: `Bearer ${activeKey.key}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      if (!response.ok) {
        const errorBody = await response.text();
        const errorMessage = `Mistral API request failed with status ${response.status}: ${errorBody}`;
        log.error({ errorBody, status: response.status }, errorMessage);
        const errorType = this.getErrorType(response.status, errorBody);
        await LlmKeyManager.markKeyAsBad(
          activeKey.provider,
          activeKey.key,
          errorType,
        );
        return `{"tool": "error", "parameters": {"message": "${errorMessage}"}}`;
      }

      const data = await response.json();

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        log.error(
          { response: data },
          'Invalid response structure from Mistral API',
        );
        const errorType = this.getErrorType(
          response.status,
          JSON.stringify(data),
        );
        await LlmKeyManager.markKeyAsBad(
          activeKey.provider,
          activeKey.key,
          errorType,
        );
        return `{"tool": "error", "parameters": {"message": "Invalid response structure from Mistral API. The model may have returned an empty response."}}`;
      }

      // Placeholder for token counting
      const estimatedTokens =
        messages.reduce(
          (sum, msg) =>
            sum +
            msg.parts.reduce(
              (partSum, part) => partSum + (part.text?.length || 0),
              0,
            ),
          0,
        ) + content.length;
      redis
        .incrby('leaderboard:tokensSaved', estimatedTokens)
        .catch((error: unknown) => {
          logger.error({ error }, 'Failed to increment tokensSaved in Redis');
        });

      await LlmKeyManager.resetKeyStatus(activeKey.provider, activeKey.key);

      return content.trim();
    } catch (error) {
      log.error({ error }, 'Failed to get response from LLM');
      if (activeKey) {
        // Assume network errors or unhandled exceptions are temporary
        await LlmKeyManager.markKeyAsBad(
          activeKey.provider,
          activeKey.key,
          LlmKeyErrorType.TEMPORARY,
        );
      }
      return `{"tool": "error", "parameters": {"message": "Failed to communicate with the LLM."}}`;
    }
  }

  private getErrorType(statusCode: number, errorBody: string): LlmKeyErrorType {
    if (statusCode === 401 || statusCode === 403) {
      // Unauthorized, Forbidden - likely invalid API key
      return LlmKeyErrorType.PERMANENT;
    } else if (statusCode === 429) {
      // Too Many Requests - rate limit
      return LlmKeyErrorType.TEMPORARY;
    } else if (statusCode >= 500) {
      // Server errors - temporary issues
      return LlmKeyErrorType.TEMPORARY;
    } else if (
      errorBody.includes('invalid_api_key') ||
      errorBody.includes('Incorrect API key')
    ) {
      return LlmKeyErrorType.PERMANENT;
    }
    // Default to temporary for unknown errors
    return LlmKeyErrorType.TEMPORARY;
  }
}

class OpenAIProvider implements LLMProvider {
  public async getLlmResponse(
    messages: LLMContent[],
    systemPrompt?: string,
  ): Promise<string> {
    const log = logger.child({ module: 'OpenAIProvider' });

    const activeKey = await LlmKeyManager.getNextAvailableKey();
    if (!activeKey) {
      const errorMessage = 'No LLM API key available.';
      log.error(errorMessage);
      return `{"tool": "error", "parameters": {"message": "${errorMessage}"}}`;
    }

    const apiUrl = 'https://api.openai.com/v1/chat/completions';

    const openaiMessages = messages.map((msg) => ({
      content: msg.parts.map((part) => part.text).join(''),
      role: msg.role === 'user' ? 'user' : 'model',
    }));

    if (systemPrompt) {
      openaiMessages.unshift({ content: systemPrompt, role: 'system' });
    }

    const requestBody = {
      messages: openaiMessages,
      model: config.LLM_MODEL_NAME, // Assuming LLM_MODEL_NAME can be an OpenAI model
    };

    const body = JSON.stringify(requestBody);

    try {
      const response = await fetch(apiUrl, {
        body,
        headers: {
          Authorization: `Bearer ${activeKey.key}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      if (!response.ok) {
        const errorBody = await response.text();
        const errorMessage = `OpenAI API request failed with status ${response.status}: ${errorBody}`;
        log.error({ errorBody, status: response.status }, errorMessage);
        const errorType = this.getErrorType(response.status, errorBody);
        await LlmKeyManager.markKeyAsBad(
          activeKey.provider,
          activeKey.key,
          errorType,
        );
        return `{"tool": "error", "parameters": {"message": "${errorMessage}"}}`;
      }

      const data = await response.json();

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        log.error(
          { response: data },
          'Invalid response structure from OpenAI API',
        );
        const errorType = this.getErrorType(
          response.status,
          JSON.stringify(data),
        );
        await LlmKeyManager.markKeyAsBad(
          activeKey.provider,
          activeKey.key,
          errorType,
        );
        return `{"tool": "error", "parameters": {"message": "Invalid response structure from OpenAI API. The model may have returned an empty response."}}`;
      }

      // Placeholder for token counting
      const estimatedTokens =
        messages.reduce(
          (sum, msg) =>
            sum +
            msg.parts.reduce(
              (partSum, part) => partSum + (part.text?.length || 0),
              0,
            ),
          0,
        ) + content.length;
      redis
        .incrby('leaderboard:tokensSaved', estimatedTokens)
        .catch((error: unknown) => {
          logger.error({ error }, 'Failed to increment tokensSaved in Redis');
        });

      await LlmKeyManager.resetKeyStatus(activeKey.provider, activeKey.key);

      return content.trim();
    } catch (error) {
      log.error({ error }, 'Failed to get response from LLM');
      if (activeKey) {
        // Assume network errors or unhandled exceptions are temporary
        await LlmKeyManager.markKeyAsBad(
          activeKey.provider,
          activeKey.key,
          LlmKeyErrorType.TEMPORARY,
        );
      }
      return `{"tool": "error", "parameters": {"message": "Failed to communicate with the LLM."}}`;
    }
  }

  private getErrorType(statusCode: number, errorBody: string): LlmKeyErrorType {
    if (statusCode === 401 || statusCode === 403) {
      // Unauthorized, Forbidden - likely invalid API key
      return LlmKeyErrorType.PERMANENT;
    } else if (statusCode === 429) {
      // Too Many Requests - rate limit
      return LlmKeyErrorType.TEMPORARY;
    } else if (statusCode >= 500) {
      // Server errors - temporary issues
      return LlmKeyErrorType.TEMPORARY;
    } else if (
      errorBody.includes('invalid_api_key') ||
      errorBody.includes('Incorrect API key')
    ) {
      return LlmKeyErrorType.PERMANENT;
    }
    // Default to temporary for unknown errors
    return LlmKeyErrorType.TEMPORARY;
  }
}

export function getLlmProvider(): LLMProvider {
  let currentLlmProvider: LLMProvider;

  switch (config.LLM_PROVIDER) {
    case 'gemini':
      currentLlmProvider = new GeminiProvider();
      break;
    case 'huggingface':
      currentLlmProvider = new HuggingFaceProvider();
      break;
    case 'mistral':
      currentLlmProvider = new MistralProvider();
      break;
    case 'openai':
      currentLlmProvider = new OpenAIProvider();
      break;
    default:
      logger.warn(
        `Unknown LLM_PROVIDER: ${config.LLM_PROVIDER}. Defaulting to GeminiProvider.`,
      );
      currentLlmProvider = new GeminiProvider();
      break;
  }
  return currentLlmProvider;
}
