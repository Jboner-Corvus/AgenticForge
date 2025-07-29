import { config } from '../config.js';
import logger from '../logger.js';
import { LLMContent } from '../modules/llm/llm-types.js';
import {
  LlmApiKey,
  LlmKeyErrorType,
  LlmKeyManager,
} from '../modules/llm/LlmKeyManager.js';
import { redis } from '../modules/redis/redisClient.js';
import { ILlmProvider } from '../types.js';
import { LlmError } from './LlmError.js';

class GeminiProvider implements ILlmProvider {
  public getErrorType(statusCode: number, _errorBody: string): LlmKeyErrorType {
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
      _errorBody.includes('invalid_api_key') ||
      _errorBody.includes('Incorrect API key')
    ) {
      return LlmKeyErrorType.PERMANENT;
    }
    // Default to temporary for unknown errors
    return LlmKeyErrorType.TEMPORARY;
  }

  public async getLlmResponse(
    messages: LLMContent[],
    systemPrompt?: string,
    apiKey?: string,
  ): Promise<string> {
    const log = logger.child({ module: 'GeminiProvider' });

    let activeKey: LlmApiKey | null;
    if (apiKey) {
      activeKey = {
        apiKey,
        errorCount: 0,
        isPermanentlyDisabled: false,
        provider: 'gemini', // Assuming provider based on the class
      };
    } else {
      activeKey = await LlmKeyManager.getNextAvailableKey('gemini');
    }

    if (!activeKey) {
      const errorMessage = 'No LLM API key available.';
      log.error(errorMessage);
      throw new LlmError(errorMessage);
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${config.LLM_MODEL_NAME}:generateContent?key=${activeKey.apiKey}`;

    const geminiMessages = messages.map((msg) => {
      let role = msg.role;
      let parts = msg.parts;

      if (role === 'tool') {
        // Gemini API does not directly support 'tool' role in 'contents'.
        // Convert tool outputs to user messages.
        role = 'user';
        parts = [{ text: `Tool output: ${parts.map(p => p.text).join('')}` }];
      }

      return { role, parts };
    });

    if (systemPrompt) {
      // Prepend system prompt to the first user message, as Gemini API does not have a dedicated system role.
      const firstUserMessage = geminiMessages.find(msg => msg.role === 'user');
      if (firstUserMessage) {
        firstUserMessage.parts.unshift({ text: systemPrompt + '\n' });
      } else {
        // If there are no user messages, create one with the system prompt
        geminiMessages.unshift({
          parts: [{ text: systemPrompt }],
          role: 'user',
        });
      }
    }

    const requestBody = {
      contents: geminiMessages,
    };

    const body = JSON.stringify(requestBody);

    try {
      // Log 2: Avant chaque appel LLM
      log.info(`[LLM CALL] Envoi de la requête au modèle : ${config.LLM_MODEL_NAME} via ${activeKey.provider}`);
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
          activeKey.apiKey,
          errorType,
        );
        throw new LlmError(errorMessage);
      }

      const data = await response.json();

      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (content === undefined || content === null) {
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
          activeKey.apiKey,
          errorType,
        );
        throw new LlmError(
          'Invalid response structure from Gemini API. The model may have returned an empty response.',
        );
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
        .catch((_error: unknown) => {
          logger.error({ _error }, 'Failed to increment tokensSaved in Redis');
        });

      // If successful, reset error count for this key
      await LlmKeyManager.resetKeyStatus(activeKey.provider, activeKey.apiKey);

      return content.trim();
    } catch (_error) {
      if (_error instanceof LlmError) {
        throw _error;
      }
      log.error({ _error }, 'Failed to get response from LLM');
      if (activeKey) {
        // Assume network errors or unhandled exceptions are temporary
        await LlmKeyManager.markKeyAsBad(
          activeKey.provider,
          activeKey.apiKey,
          LlmKeyErrorType.TEMPORARY,
        );
      }
      throw new LlmError('Failed to communicate with the LLM.');
    }
  }
}

class HuggingFaceProvider implements ILlmProvider {
  public getErrorType(statusCode: number, _errorBody: string): LlmKeyErrorType {
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
      _errorBody.includes('invalid_api_key') ||
      _errorBody.includes('Authorization header is invalid')
    ) {
      return LlmKeyErrorType.PERMANENT;
    }
    // Default to temporary for unknown errors
    return LlmKeyErrorType.TEMPORARY;
  }

  public async getLlmResponse(
    messages: LLMContent[],
    systemPrompt?: string,
    apiKey?: string,
  ): Promise<string> {
    const log = logger.child({ module: 'HuggingFaceProvider' });

    let activeKey: LlmApiKey | null;
    if (apiKey) {
      activeKey = {
        apiKey,
        errorCount: 0,
        isPermanentlyDisabled: false,
        provider: 'huggingface', // Assuming provider based on the class
      };
    } else {
      activeKey = await LlmKeyManager.getNextAvailableKey('huggingface');
    }

    if (!activeKey) {
      const errorMessage = 'No LLM API key available.';
      log.error(errorMessage);
      throw new LlmError(errorMessage);
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
      // Log 2: Avant chaque appel LLM
      log.info(`[LLM CALL] Envoi de la requête au modèle : ${config.LLM_MODEL_NAME} via ${activeKey.provider}`);
      const response = await fetch(apiUrl, {
        body,
        headers: {
          Authorization: `Bearer ${activeKey.apiKey}`,
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
          activeKey.apiKey,
          errorType,
        );
        throw new LlmError(errorMessage);
      }

      const data = await response.json();

      const content = data?.[0]?.generated_text; // Adjust based on actual HF API response structure
      if (content === undefined || content === null) {
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
          activeKey.apiKey,
          errorType,
        );
        throw new LlmError(
          'Invalid response structure from HuggingFace API. The model may have returned an empty response.',
        );
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
        .catch((_error: unknown) => {
          logger.error({ _error }, 'Failed to increment tokensSaved in Redis');
        });

      await LlmKeyManager.resetKeyStatus(activeKey.provider, activeKey.apiKey);

      return content.trim();
    } catch (_error) {
      if (_error instanceof LlmError) {
        throw _error;
      }
      log.error({ _error }, 'Failed to get response from LLM');
      if (activeKey) {
        // Assume network errors or unhandled exceptions are temporary
        await LlmKeyManager.markKeyAsBad(
          activeKey.provider,
          activeKey.apiKey,
          LlmKeyErrorType.TEMPORARY,
        );
      }
      throw new LlmError('Failed to communicate with the LLM.');
    }
  }
}

class MistralProvider implements ILlmProvider {
  public getErrorType(statusCode: number, _errorBody: string): LlmKeyErrorType {
    if (statusCode === 401 || statusCode === 403) {
      // Unauthorized, Forbidden - likely invalid API key
      return LlmKeyErrorType.PERMANENT;
    } else if (statusCode === 429) {
      // Too Many Requests - rate limit
      return LlmKeyErrorType.TEMPORARY;
    } else if (statusCode >= 500) {
      // Server errors - temporary issues
      return LlmKeyErrorType.TEMPORARY;
    }
    // Default to temporary for unknown errors
    return LlmKeyErrorType.TEMPORARY;
  }

  public async getLlmResponse(
    messages: LLMContent[],
    systemPrompt?: string,
    apiKey?: string,
  ): Promise<string> {
    const log = logger.child({ module: 'MistralProvider' });

    let activeKey: LlmApiKey | null;
    if (apiKey) {
      activeKey = {
        apiKey,
        errorCount: 0,
        isPermanentlyDisabled: false,
        provider: 'mistral', // Assuming provider based on the class
      };
    } else {
      activeKey = await LlmKeyManager.getNextAvailableKey('mistral');
    }

    if (!activeKey) {
      const errorMessage = 'No LLM API key available.';
      log.error(errorMessage);
      throw new LlmError(errorMessage);
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
      // Log 2: Avant chaque appel LLM
      log.info(`[LLM CALL] Envoi de la requête au modèle : ${config.LLM_MODEL_NAME} via ${activeKey.provider}`);
      const response = await fetch(apiUrl, {
        body,
        headers: {
          Authorization: `Bearer ${activeKey.apiKey}`,
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
          activeKey.apiKey,
          errorType,
        );
        throw new LlmError(errorMessage);
      }

      const data = await response.json();

      const content = data.choices?.[0]?.message?.content;
      if (content === undefined || content === null) {
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
          activeKey.apiKey,
          errorType,
        );
        throw new LlmError(
          'Invalid response structure from Mistral API. The model may have returned an empty response.',
        );
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
        .catch((_error: unknown) => {
          logger.error({ _error }, 'Failed to increment tokensSaved in Redis');
        });

      await LlmKeyManager.resetKeyStatus(activeKey.provider, activeKey.apiKey);

      return content.trim();
    } catch (_error) {
      if (_error instanceof LlmError) {
        throw _error;
      }
      log.error({ _error }, 'Failed to get response from LLM');
      if (activeKey) {
        // Assume network errors or unhandled exceptions are temporary
        await LlmKeyManager.markKeyAsBad(
          activeKey.provider,
          activeKey.apiKey,
          LlmKeyErrorType.TEMPORARY,
        );
      }
      throw new LlmError('Failed to communicate with the LLM.');
    }
  }
}

class OpenAIProvider implements ILlmProvider {
  public getErrorType(statusCode: number, _errorBody: string): LlmKeyErrorType {
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
      _errorBody.includes('invalid_api_key') ||
      _errorBody.includes('Incorrect API key')
    ) {
      return LlmKeyErrorType.PERMANENT;
    }
    // Default to temporary for unknown errors
    return LlmKeyErrorType.TEMPORARY;
  }

  public async getLlmResponse(
    messages: LLMContent[],
    systemPrompt?: string,
    apiKey?: string,
  ): Promise<string> {
    const log = logger.child({ module: 'OpenAIProvider' });

    let activeKey: LlmApiKey | null;
    if (apiKey) {
      activeKey = {
        apiKey,
        errorCount: 0,
        isPermanentlyDisabled: false,
        provider: 'openai', // Assuming provider based on the class
      };
    } else {
      activeKey = await LlmKeyManager.getNextAvailableKey('openai');
    }

    if (!activeKey) {
      const errorMessage = 'No LLM API key available.';
      log.error(errorMessage);
      throw new LlmError(errorMessage);
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
      // Log 2: Avant chaque appel LLM
      log.info(`[LLM CALL] Envoi de la requête au modèle : ${config.LLM_MODEL_NAME} via ${activeKey.provider}`);
      const response = await fetch(apiUrl, {
        body,
        headers: {
          Authorization: `Bearer ${activeKey.apiKey}`,
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
          activeKey.apiKey,
          errorType,
        );
        throw new LlmError(errorMessage);
      }

      const data = await response.json();

      const content = data.choices?.[0]?.message?.content;
      if (content === undefined || content === null) {
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
          activeKey.apiKey,
          errorType,
        );
        throw new LlmError(
          'Invalid response structure from OpenAI API. The model may have returned an empty response.',
        );
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
        .catch((_error: unknown) => {
          logger.error({ _error }, 'Failed to increment tokensSaved in Redis');
        });

      await LlmKeyManager.resetKeyStatus(activeKey.provider, activeKey.apiKey);

      return content.trim();
    } catch (_error) {
      if (_error instanceof LlmError) {
        throw _error;
      }
      log.error({ _error }, 'Failed to get response from LLM');
      if (activeKey) {
        // Assume network errors or unhandled exceptions are temporary
        await LlmKeyManager.markKeyAsBad(
          activeKey.provider,
          activeKey.apiKey,
          LlmKeyErrorType.TEMPORARY,
        );
      }
      throw new LlmError('Failed to communicate with the LLM.');
    }
  }
}

export function getLlmProvider(providerName: string): ILlmProvider {
  let currentLlmProvider: ILlmProvider;

  switch (providerName) {
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
        `Unknown LLM provider requested: ${providerName}. Defaulting to GeminiProvider.`,
      );
      currentLlmProvider = new GeminiProvider();
      break;
  }
  return currentLlmProvider;
}
