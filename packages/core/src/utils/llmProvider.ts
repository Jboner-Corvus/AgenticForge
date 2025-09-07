import { getConfig } from '../config.ts';
import { getLogger } from '../logger.ts';
import {
  ILlmProvider,
  LLMContent,
  LlmError,
} from '../modules/llm/llm-types.ts';
import { LlmApiKey, LlmKeyManager } from '../modules/llm/LlmKeyManager.ts';
import { LlmKeyErrorType } from '../modules/llm/LlmKeyManager.ts';
import { QwenProvider } from '../modules/llm/qwenProvider.ts';
import { getRedisClientInstance } from '../modules/redis/redisClient.ts';
import { Gpt5Provider } from './gpt5Provider.ts';

class AnthropicProvider implements ILlmProvider {
  public getErrorType(statusCode: number, _errorBody: string): LlmKeyErrorType {
    if (statusCode === 401 || statusCode === 403) {
      return LlmKeyErrorType.PERMANENT;
    } else if (statusCode === 429) {
      // Rate limit exceeded - could be temporary or permanent depending on error message
      if (
        _errorBody.includes('quota') ||
        _errorBody.includes('limit') ||
        _errorBody.includes('exceeded')
      ) {
        // Quota/limit exceeded errors are typically permanent for the billing period
        return LlmKeyErrorType.PERMANENT;
      }
      return LlmKeyErrorType.TEMPORARY;
    } else if (statusCode >= 500) {
      return LlmKeyErrorType.TEMPORARY;
    } else if (
      _errorBody.includes('invalid_api_key') ||
      _errorBody.includes('authentication_error')
    ) {
      return LlmKeyErrorType.PERMANENT;
    }
    return LlmKeyErrorType.TEMPORARY;
  }

  public async getLlmResponse(
    messages: LLMContent[],
    systemPrompt?: string,
    apiKey?: string,
    modelName?: string,
  ): Promise<string> {
    const log = getLogger().child({ module: 'AnthropicProvider' });

    let activeKey: LlmApiKey | null;
    if (apiKey) {
      activeKey = {
        apiKey: apiKey,
        apiModel: modelName || getConfig().LLM_MODEL_NAME,
        apiProvider: 'anthropic',
        errorCount: 0,
        isPermanentlyDisabled: false,
      };
    } else {
      activeKey = await LlmKeyManager.getNextAvailableKey('anthropic');
    }

    if (!activeKey) {
      const errorMessage = 'No Anthropic API key available.';
      log.error(errorMessage);
      throw new LlmError(errorMessage);
    }

    const apiUrl = activeKey.baseUrl || 'https://api.anthropic.com/v1/messages';

    const anthropicMessages = messages.map((msg) => {
      let role: 'assistant' | 'user' = 'user';
      if (msg.role === 'model') {
        role = 'assistant';
      } else if (msg.role === 'tool') {
        // Anthropic does not have a direct 'tool' role in messages API.
        // We'll convert tool outputs to user messages for now.
        // A more sophisticated approach might involve tool use in Anthropic's API.
        return {
          content: `Tool output: ${msg.parts.map((p: { text: string }) => p.text).join('')}`,
          role: 'user',
        };
      }
      return {
        content: msg.parts.map((p: { text: string }) => p.text).join(''),
        role,
      };
    });

    const requestBody: any = {
      max_tokens: 4096, // A reasonable default for Anthropic models
      messages: anthropicMessages,
      model: modelName || getConfig().LLM_MODEL_NAME,
    };

    if (systemPrompt) {
      requestBody.system = systemPrompt;
    }

    const body = JSON.stringify(requestBody);

    try {
      log.info(
        `[LLM CALL] Sending request to model: ${modelName || getConfig().LLM_MODEL_NAME} via ${activeKey.apiProvider}`,
      );
      const response = await fetch(apiUrl, {
        body,
        headers: {
          'anthropic-version': '2023-06-01', // Required Anthropic API version
          'Content-Type': 'application/json',
          'x-api-key': activeKey.apiKey,
        },
        method: 'POST',
      });

      if (!response.ok) {
        const errorBody = await response.text();
        const errorMessage = `Anthropic API request failed with status ${response.status}: ${errorBody}`;
        log.error({ errorBody, status: response.status }, errorMessage);
        const errorType = this.getErrorType(response.status, errorBody);
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType,
        );
        throw new LlmError(errorMessage);
      }

      const data = await response.json();

      const content = data.content?.[0]?.text;
      if (content === undefined || content === null) {
        log.error(
          { response: data },
          'Invalid response structure from Anthropic API',
        );
        const errorType = this.getErrorType(
          response.status,
          JSON.stringify(data),
        );
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType,
        );
        throw new LlmError(
          'Invalid response structure from Anthropic API. The model may have returned an empty response.',
        );
      }

      // Get real token usage from Anthropic API response
      const inputTokens = data.usage?.input_tokens || 0;
      const outputTokens = data.usage?.output_tokens || 0;
      const totalTokens = inputTokens + outputTokens;

      log.info(
        `Token usage - Input: ${inputTokens}, Output: ${outputTokens}, Total: ${totalTokens}`,
      );

      // Store token usage in Redis for tracking
      getRedisClientInstance()
        .incrby('leaderboard:tokensSaved', totalTokens)
        .catch((_error: unknown) => {
          getLogger().error(
            { _error },
            'Failed to increment tokensSaved in Redis',
          );
        });

      // Store detailed token stats for the session
      getRedisClientInstance()
        .hset('session:tokens:latest', {
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          timestamp: Date.now(),
          total_tokens: totalTokens,
        })
        .catch((_error: unknown) => {
          getLogger().error(
            { _error },
            'Failed to store session token stats in Redis',
          );
        });

      await LlmKeyManager.resetKeyStatus(
        activeKey.apiProvider,
        activeKey.apiKey,
      );

      return content.trim();
    } catch (_error) {
      if (_error instanceof LlmError) {
        throw _error;
      }
      log.error({ _error }, 'Failed to get response from LLM');
      if (activeKey) {
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          LlmKeyErrorType.TEMPORARY,
        );
      }
      throw new LlmError('Failed to communicate with the LLM.');
    }
  }
}

class GrokProvider implements ILlmProvider {
  public getErrorType(statusCode: number, _errorBody: string): LlmKeyErrorType {
    if (statusCode === 401 || statusCode === 403) {
      return LlmKeyErrorType.PERMANENT;
    } else if (statusCode === 429) {
      // Rate limit exceeded - could be temporary or permanent depending on error message
      if (
        _errorBody.includes('quota') ||
        _errorBody.includes('limit') ||
        _errorBody.includes('exceeded')
      ) {
        // Quota/limit exceeded errors are typically permanent for the billing period
        return LlmKeyErrorType.PERMANENT;
      }
      return LlmKeyErrorType.TEMPORARY;
    } else if (statusCode >= 500) {
      return LlmKeyErrorType.TEMPORARY;
    } else if (
      _errorBody.includes('invalid_api_key') ||
      _errorBody.includes('Incorrect API key')
    ) {
      return LlmKeyErrorType.PERMANENT;
    }
    return LlmKeyErrorType.TEMPORARY;
  }

  public async getLlmResponse(
    messages: LLMContent[],
    systemPrompt?: string,
    apiKey?: string,
    modelName?: string, // Add modelName parameter
  ): Promise<string> {
    const log = getLogger().child({ module: 'GrokProvider' });

    let activeKey: LlmApiKey | null;
    if (apiKey) {
      activeKey = {
        apiKey: apiKey,
        apiModel: modelName || getConfig().LLM_MODEL_NAME,
        apiProvider: 'grok',
        errorCount: 0,
        isPermanentlyDisabled: false,
      };
    } else {
      activeKey = await LlmKeyManager.getNextAvailableKey('grok');
    }

    if (!activeKey) {
      const errorMessage = 'No Grok API key available.';
      log.error(errorMessage);
      throw new LlmError(errorMessage);
    }

    const apiUrl =
      activeKey.baseUrl || 'https://api.grok.com/v1/chat/completions'; // Adjust if Grok has a different API endpoint

    const grokMessages = messages.map((msg) => ({
      content: msg.parts.map((part) => part.text).join(''),
      role: msg.role === 'user' ? 'user' : 'assistant',
    }));

    if (systemPrompt) {
      grokMessages.unshift({ content: systemPrompt, role: 'system' });
    }

    const requestBody = {
      messages: grokMessages,
      model: modelName || getConfig().LLM_MODEL_NAME, // Use modelName if provided, else fallback to config
    };

    const body = JSON.stringify(requestBody);

    try {
      log.info(
        `[LLM CALL] Sending request to model: ${modelName || getConfig().LLM_MODEL_NAME} via ${activeKey.apiProvider}`,
      );
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
        const errorMessage = `Grok API request failed with status ${response.status}: ${errorBody}`;
        log.error({ errorBody, status: response.status }, errorMessage);
        const errorType = this.getErrorType(response.status, errorBody);
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
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
          'Invalid response structure from Grok API',
        );
        const errorType = this.getErrorType(
          response.status,
          JSON.stringify(data),
        );
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType,
        );
        throw new LlmError(
          'Invalid response structure from Grok API. The model may have returned an empty response.',
        );
      }

      const estimatedTokens =
        messages.reduce(
          (sum, msg) =>
            sum +
            msg.parts.reduce(
              (partSum: number, part: { text?: string }) =>
                partSum + (part.text?.length || 0),
              0,
            ),
          0,
        ) + content.length;
      getRedisClientInstance()
        .incrby('leaderboard:tokensSaved', estimatedTokens)
        .catch((_error: unknown) => {
          getLogger().error(
            { _error },
            'Failed to increment tokensSaved in Redis',
          );
        });

      await LlmKeyManager.resetKeyStatus(
        activeKey.apiProvider,
        activeKey.apiKey,
      );

      return content.trim();
    } catch (_error) {
      if (_error instanceof LlmError) {
        throw _error;
      }
      log.error({ _error }, 'Failed to get response from LLM');
      if (activeKey) {
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
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
      // Check if it's a quota/limit exceeded error (permanent for billing period)
      if (
        _errorBody.includes('quota') ||
        _errorBody.includes('limit') ||
        _errorBody.includes('exceeded')
      ) {
        return LlmKeyErrorType.PERMANENT;
      }
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
    modelName?: string, // Add modelName parameter
  ): Promise<string> {
    const log = getLogger().child({ module: 'HuggingFaceProvider' });

    let activeKey: LlmApiKey | null;
    if (apiKey) {
      activeKey = {
        apiKey: apiKey,
        apiModel: modelName || getConfig().LLM_MODEL_NAME,
        apiProvider: 'huggingface', // Assuming provider based on the class
        errorCount: 0,
        isPermanentlyDisabled: false,
      };
    } else {
      activeKey = await LlmKeyManager.getNextAvailableKey('huggingface');
    }

    if (!activeKey) {
      const errorMessage = 'No LLM API key available.';
      log.error(errorMessage);
      throw new LlmError(errorMessage);
    }

    const baseUrl = activeKey.baseUrl || 'https://api-inference.huggingface.co';
    const apiUrl = `${baseUrl}/models/${modelName || getConfig().LLM_MODEL_NAME}`;

    const requestBody = {
      inputs: messages
        .map((msg) => msg.parts.map((p: { text: string }) => p.text).join(''))
        .join('\n'),
      parameters: {
        max_new_tokens: 4096, // A reasonable default for HuggingFace models
      },
    };

    const body = JSON.stringify(requestBody);

    try {
      log.info(
        `[LLM CALL] Sending request to model: ${modelName || getConfig().LLM_MODEL_NAME} via ${activeKey.apiProvider}`,
      );
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
          activeKey.apiProvider,
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
          activeKey.apiProvider,
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
              (partSum: number, part: { text?: string }) =>
                partSum + (part.text?.length || 0),
              0,
            ),
          0,
        ) + content.length;
      getRedisClientInstance()
        .incrby('leaderboard:tokensSaved', estimatedTokens)
        .catch((_error: unknown) => {
          getLogger().error(
            { _error },
            'Failed to increment tokensSaved in Redis',
          );
        });

      await LlmKeyManager.resetKeyStatus(
        activeKey.apiProvider,
        activeKey.apiKey,
      );

      return content.trim();
    } catch (_error) {
      if (_error instanceof LlmError) {
        throw _error;
      }
      log.error({ _error }, 'Failed to get response from LLM');
      if (activeKey) {
        // Assume network errors or unhandled exceptions are temporary
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
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
      // Check if it's a quota/limit exceeded error (permanent for billing period)
      if (
        _errorBody.includes('quota') ||
        _errorBody.includes('limit') ||
        _errorBody.includes('exceeded')
      ) {
        return LlmKeyErrorType.PERMANENT;
      }
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
    modelName?: string,
  ): Promise<string> {
    const log = getLogger().child({ module: 'MistralProvider' });

    let activeKey: LlmApiKey | null;
    if (apiKey) {
      activeKey = {
        apiKey: apiKey,
        apiModel: modelName || getConfig().LLM_MODEL_NAME,
        apiProvider: 'mistral', // Assuming provider based on the class
        errorCount: 0,
        isPermanentlyDisabled: false,
      };
    } else {
      activeKey = await LlmKeyManager.getNextAvailableKey('mistral');
    }

    if (!activeKey) {
      const errorMessage = 'No LLM API key available.';
      log.error(errorMessage);
      throw new LlmError(errorMessage);
    }

    const apiUrl =
      activeKey.baseUrl || 'https://api.mistral.ai/v1/chat/completions';

    const mistralMessages = messages.map((msg) => ({
      content: msg.parts.map((part) => part.text).join(''),
      role: msg.role === 'user' ? 'user' : 'model',
    }));

    if (systemPrompt) {
      mistralMessages.unshift({ content: systemPrompt, role: 'system' });
    }

    const requestBody = {
      messages: mistralMessages,
      model: modelName || getConfig().LLM_MODEL_NAME, // Use modelName if provided, else fallback to config
    };

    const body = JSON.stringify(requestBody);

    try {
      // Log 2: Avant chaque appel LLM
      log.info(
        `[LLM CALL] Envoi de la requête au modèle : ${modelName || getConfig().LLM_MODEL_NAME} via ${activeKey.apiProvider}`,
      );
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
          activeKey.apiProvider,
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
          activeKey.apiProvider,
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
              (partSum: number, part: { text?: string }) =>
                partSum + (part.text?.length || 0),
              0,
            ),
          0,
        ) + content.length;
      getRedisClientInstance()
        .incrby('leaderboard:tokensSaved', estimatedTokens)
        .catch((_error: unknown) => {
          getLogger().error(
            { _error },
            'Failed to increment tokensSaved in Redis',
          );
        });

      await LlmKeyManager.resetKeyStatus(
        activeKey.apiProvider,
        activeKey.apiKey,
      );

      return content.trim();
    } catch (_error) {
      if (_error instanceof LlmError) {
        throw _error;
      }
      log.error({ _error }, 'Failed to get response from LLM');
      if (activeKey) {
        // Assume network errors or unhandled exceptions are temporary
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
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
      // Check if it's a quota/limit exceeded error (permanent for billing period)
      if (
        _errorBody.includes('quota') ||
        _errorBody.includes('limit') ||
        _errorBody.includes('exceeded')
      ) {
        return LlmKeyErrorType.PERMANENT;
      }
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
    modelName?: string,
  ): Promise<string> {
    const log = getLogger().child({ module: 'OpenAIProvider' });

    let activeKey: LlmApiKey | null;
    if (apiKey) {
      activeKey = {
        apiKey: apiKey,
        apiModel: modelName || getConfig().LLM_MODEL_NAME,
        apiProvider: 'openai', // Assuming provider based on the class
        errorCount: 0,
        isPermanentlyDisabled: false,
      };
    } else {
      activeKey = await LlmKeyManager.getNextAvailableKey('openai');
    }

    if (!activeKey) {
      const errorMessage = 'No LLM API key available.';
      log.error(errorMessage);
      throw new LlmError(errorMessage);
    }

    const apiUrl =
      activeKey.baseUrl || 'https://api.openai.com/v1/chat/completions';

    const openaiMessages = messages.map((msg) => ({
      content: msg.parts.map((part) => part.text).join(''),
      role: msg.role === 'user' ? 'user' : 'model',
    }));

    if (systemPrompt) {
      openaiMessages.unshift({ content: systemPrompt, role: 'system' });
    }

    const requestBody = {
      messages: openaiMessages,
      model: modelName || getConfig().LLM_MODEL_NAME, // Use modelName if provided, else fallback to config
    };

    const body = JSON.stringify(requestBody);

    try {
      // Log 2: Avant chaque appel LLM
      log.info(
        `[LLM CALL] Envoi de la requête au modèle : ${modelName || getConfig().LLM_MODEL_NAME} via ${activeKey.apiProvider}`,
      );
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
          activeKey.apiProvider,
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
          activeKey.apiProvider,
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
              (partSum: number, part: { text?: string }) =>
                partSum + (part.text?.length || 0),
              0,
            ),
          0,
        ) + content.length;
      getRedisClientInstance()
        .incrby('leaderboard:tokensSaved', estimatedTokens)
        .catch((_error: unknown) => {
          getLogger().error(
            { _error },
            'Failed to increment tokensSaved in Redis',
          );
        });

      await LlmKeyManager.resetKeyStatus(
        activeKey.apiProvider,
        activeKey.apiKey,
      );

      return content.trim();
    } catch (_error) {
      if (_error instanceof LlmError) {
        throw _error;
      }
      log.error({ _error }, 'Failed to get response from LLM');
      if (activeKey) {
        // Assume network errors or unhandled exceptions are temporary
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          LlmKeyErrorType.TEMPORARY,
        );
      }
      throw new LlmError('Failed to communicate with the LLM.');
    }
  }
}

class OpenRouterProvider implements ILlmProvider {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAYS = [2000, 4000, 8000]; // Exponential backoff

  public getErrorType(statusCode: number, _errorBody: string): LlmKeyErrorType {
    if (statusCode === 401 || statusCode === 403) {
      // Unauthorized, Forbidden - likely invalid API key
      return LlmKeyErrorType.PERMANENT;
    } else if (statusCode === 429) {
      // Too Many Requests - rate limit
      // Check if it's a quota/limit exceeded error (permanent for billing period)
      if (
        _errorBody.includes('quota') ||
        _errorBody.includes('limit') ||
        _errorBody.includes('exceeded')
      ) {
        return LlmKeyErrorType.PERMANENT;
      }
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
    modelName?: string,
  ): Promise<string> {
    return this.getLlmResponseWithRetry(
      messages,
      systemPrompt,
      apiKey,
      modelName,
      0,
    );
  }

  private async getLlmResponseWithRetry(
    messages: LLMContent[],
    systemPrompt?: string,
    apiKey?: string,
    modelName?: string,
    retryCount: number = 0,
  ): Promise<string> {
    const log = getLogger().child({ module: 'OpenRouterProvider' });

    let activeKey: LlmApiKey | null;
    if (apiKey) {
      activeKey = {
        apiKey: apiKey,
        apiModel: modelName || getConfig().LLM_MODEL_NAME,
        apiProvider: 'openrouter-sky', // Use specific OpenRouter provider name
        errorCount: 0,
        isPermanentlyDisabled: false,
      };
    } else {
      // For dusk models, prefer openrouter-dusk provider
      if (modelName && (modelName.includes('sonoma-dusk-alpha') || modelName.includes('dusk'))) {
        activeKey = await LlmKeyManager.getNextAvailableKey('openrouter-dusk');
        if (!activeKey) {
          activeKey = await LlmKeyManager.getNextAvailableKey('openrouter-sky');
        }
      } else {
        // For other models, try openrouter-sky first, then openrouter-dusk as fallback
        activeKey = await LlmKeyManager.getNextAvailableKey('openrouter-sky');
        if (!activeKey) {
          activeKey = await LlmKeyManager.getNextAvailableKey('openrouter-dusk');
        }
      }
    }

    if (!activeKey) {
      const errorMessage = 'No LLM API key available.';
      log.error(errorMessage);
      throw new LlmError(errorMessage);
    }

    const apiUrl =
      activeKey.baseUrl || 'https://openrouter.ai/api/v1/chat/completions';

    // Determine the correct model name based on provider
    let finalModelName = modelName;
    if (
      !finalModelName ||
      finalModelName.startsWith('gemini-') ||
      finalModelName.startsWith('gpt-')
    ) {
      if (activeKey.apiProvider === 'openrouter-sky') {
        finalModelName =
          getConfig().LLM_MODEL_NAME_OPENROUTER_SKY ||
          'openrouter/sonoma-sky-alpha';
      } else if (activeKey.apiProvider === 'openrouter-dusk') {
        finalModelName =
          getConfig().LLM_MODEL_NAME_OPENROUTER_DUSK ||
          'openrouter/sonoma-dusk-alpha';
      } else {
        finalModelName = getConfig().LLM_MODEL_NAME;
      }
    }

    // CRITICAL FIX: Simplify request for Sonoma models to prevent empty responses
    let useSimplifiedRequest = false;
    if (finalModelName && (finalModelName.includes('sonoma') || finalModelName.includes('dusk'))) {
      useSimplifiedRequest = true;
      log.info('🎯 Using simplified request format for Sonoma/Dusk model to prevent empty responses');
    }

    // Process messages - use simplified format for Sonoma models
    let openRouterMessages: Array<{content: string, role: string}>;

    if (useSimplifiedRequest) {
      // CRITICAL FIX: For Sonoma models, use only user messages (no system message)
      // This matches the curl format that works
      openRouterMessages = messages
        .filter((msg) => msg.role === 'user') // Only user messages
        .map((msg) => ({
          content: msg.parts.map((part) => part.text).join(''),
          role: 'user',
        }));

      // If no user messages found, create a simple one
      if (openRouterMessages.length === 0) {
        openRouterMessages = [{
          content: 'Hello, can you help me?',
          role: 'user'
        }];
      }

      log.info(`🎯 Using simplified message format for Sonoma model: ${openRouterMessages.length} user messages only`);
    } else {
      // Standard message processing for other models
      openRouterMessages = messages.map((msg) => ({
        content: msg.parts.map((part) => part.text).join(''),
        role: msg.role === 'user' ? 'user' : 'assistant',
      }));

      if (systemPrompt) {
        openRouterMessages.unshift({ content: systemPrompt, role: 'system' });
      }
    }



    // Adjust parameters based on model
    let temperature = 0.7;
    let maxTokens = 4096;
    let topP = 0.9;

    if (finalModelName && (finalModelName.includes('sonoma-dusk-alpha') || finalModelName.includes('dusk'))) {
      // Dusk models need different parameters
      temperature = 0.3; // Lower temperature for more consistent responses
      maxTokens = 2048; // Shorter responses to avoid issues
      topP = 0.7; // More focused sampling
    }

    // Create request body - use simplified format for Sonoma models
    let requestBody: any;
    if (useSimplifiedRequest) {
      // CRITICAL FIX: Minimal request format for Sonoma models (like curl works)
      requestBody = {
        messages: openRouterMessages,
        model: finalModelName
      };
      log.info('🎯 Using minimal request body for Sonoma model (no extra parameters)');
    } else {
      // Standard request format for other models
      requestBody = {
        messages: openRouterMessages,
        model: finalModelName,
        temperature: temperature,
        max_tokens: maxTokens,
        top_p: topP,
        frequency_penalty: 0.1,
        presence_penalty: 0.1,
      };
    }

    const body = JSON.stringify(requestBody);

    try {
      // Add a delay before making the LLM request to avoid rate limiting
      await new Promise((resolve) =>
        setTimeout(resolve, getConfig().LLM_REQUEST_DELAY_MS),
      );

      // Log 2: Avant chaque appel LLM
      log.info(
        `[LLM CALL] Envoi de la requête au modèle : ${modelName || getConfig().LLM_MODEL_NAME} via ${activeKey.apiProvider}`,
      );

      // Debug: Log request details
      const debugInfo = {
        model: finalModelName,
        messageCount: openRouterMessages.length,
        systemPromptLength: systemPrompt?.length || 0,
        requestBodySize: body.length,
        retryCount,
        provider: activeKey.apiProvider,
        temperature,
        maxTokens,
        topP
      };

      if (finalModelName && (finalModelName.includes('sonoma-dusk-alpha') || finalModelName.includes('dusk'))) {
        log.info(debugInfo, '🔍 Dusk Model - Request details');
      } else {
        log.debug(debugInfo, 'OpenRouter request details');
      }
      // Use simplified headers for Sonoma models to match curl behavior
      const headers: Record<string, string> = {
        Authorization: `Bearer ${activeKey.apiKey}`,
        'Content-Type': 'application/json',
      };

      if (!useSimplifiedRequest) {
        // Add extra headers only for non-Sonoma models
        headers['HTTP-Referer'] = 'http://localhost:3001';
        headers['X-Title'] = 'AgenticForge';
      } else {
        log.info('🎯 Using minimal headers for Sonoma model (no extra headers)');
      }

      const response = await fetch(apiUrl, {
        body,
        headers,
        method: 'POST',
      });

      if (!response.ok) {
        const errorBody = await response.text();
        const errorMessage = `OpenRouter API request failed with status ${response.status}: ${errorBody}`;
        log.error({ errorBody, status: response.status }, errorMessage);
        const errorType = this.getErrorType(response.status, errorBody);
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType,
        );
        throw new LlmError(errorMessage);
      }

      const data = await response.json();

      // Debug: Log full response structure
      log.debug({
        responseStatus: response.status,
        responseHeaders: Object.fromEntries(response.headers.entries()),
        dataKeys: Object.keys(data),
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length,
        firstChoice: data.choices?.[0],
        usage: data.usage,
        retryCount
      }, 'OpenRouter response analysis');

      const content = data.choices?.[0]?.message?.content;
      if (content === undefined || content === null || content.trim() === '') {
        log.warn(
          {
            response: data,
            content,
            contentType: typeof content,
            contentLength: content?.length,
            retryCount
          },
          'OpenRouter API returned empty content',
        );

        // Check if we should retry for empty responses
        if (retryCount < OpenRouterProvider.MAX_RETRIES) {
          // For Dusk models, use much shorter delays to fail fast and fallback quickly
          const isDuskModel = finalModelName && (finalModelName.includes('sonoma') || finalModelName.includes('dusk'));
          const delay = isDuskModel
            ? Math.min(500, OpenRouterProvider.RETRY_DELAYS[retryCount] || 500) // Max 500ms for Dusk
            : OpenRouterProvider.RETRY_DELAYS[Math.min(retryCount, OpenRouterProvider.RETRY_DELAYS.length - 1)];

          log.info(
            `Retrying OpenRouter API call in ${delay}ms due to empty content (attempt ${retryCount + 1}/${OpenRouterProvider.MAX_RETRIES})${isDuskModel ? ' [DUSK FAST FAIL]' : ''}`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          return this.getLlmResponseWithRetry(
            messages,
            systemPrompt,
            apiKey,
            modelName,
            retryCount + 1,
          );
        }

        // For Dusk models, prioritize Gemini fallback over trying other OpenRouter models
        const isDuskModel = finalModelName && (finalModelName.includes('sonoma') || finalModelName.includes('dusk'));

        if (isDuskModel) {
          log.warn('Dusk model failed, prioritizing Gemini fallback over other OpenRouter models');
        } else {
          // If all retries exhausted, try switching to the other OpenRouter model
          if (activeKey.apiProvider === 'openrouter-sky' && !apiKey) {
            log.warn('OpenRouter Sky failed, trying OpenRouter Dusk as fallback');
            const fallbackKey = await LlmKeyManager.getNextAvailableKey('openrouter-dusk');
            if (fallbackKey) {
              log.info('Switching to OpenRouter Dusk for this request');
              return this.getLlmResponseWithRetry(
                messages,
                systemPrompt,
                apiKey,
                'openrouter/sonoma-dusk-alpha', // Force dusk model
                0, // Reset retry count for new model
              );
            }
          } else if (activeKey.apiProvider === 'openrouter-dusk' && !apiKey) {
            log.warn('OpenRouter Dusk failed, trying OpenRouter Sky as fallback');
            const fallbackKey = await LlmKeyManager.getNextAvailableKey('openrouter-sky');
            if (fallbackKey) {
              log.info('Switching to OpenRouter Sky for this request');
              return this.getLlmResponseWithRetry(
                messages,
                systemPrompt,
                apiKey,
                'openrouter/sonoma-sky-alpha', // Force sky model
                0, // Reset retry count for new model
              );
            }
          }
        }

        // If all retries and fallbacks exhausted, mark key as bad and throw error
        log.error(
          { response: data },
          'Invalid response structure from OpenRouter API - empty content after all retries and fallbacks',
        );
        const errorType = this.getErrorType(
          response.status,
          JSON.stringify(data),
        );
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType,
        );
        // Final fallback: Try Gemini if OpenRouter completely fails
        if (!apiKey) {
          log.warn('All OpenRouter models failed, attempting fallback to Gemini');
          try {
            const geminiProvider = new GeminiProvider();
            return await geminiProvider.getLlmResponse(messages, systemPrompt);
          } catch (geminiError) {
            log.error({ geminiError }, 'Gemini fallback also failed');
          }
        }

        throw new LlmError(
          'Invalid response structure from OpenRouter API. All models and fallbacks returned empty responses after multiple attempts.',
        );
      }

      // Placeholder for token counting
      const estimatedTokens =
        messages.reduce(
          (sum, msg) =>
            sum +
            msg.parts.reduce(
              (partSum: number, part: { text?: string }) =>
                partSum + (part.text?.length || 0),
              0,
            ),
          0,
        ) + content.length;
      getRedisClientInstance()
        .incrby('leaderboard:tokensSaved', estimatedTokens)
        .catch((_error: unknown) => {
          getLogger().error(
            { _error },
            'Failed to increment tokensSaved in Redis',
          );
        });

      await LlmKeyManager.resetKeyStatus(
        activeKey.apiProvider,
        activeKey.apiKey,
      );

      return content.trim();
    } catch (_error) {
      if (_error instanceof LlmError) {
        throw _error;
      }

      const error = _error instanceof Error ? _error : new Error(String(_error));
      log.error({ error, retryCount }, 'Failed to get response from OpenRouter API');

      // Enhanced error classification for retry logic
      const isRetryableError =
        error.message.includes('network') ||
        error.message.includes('timeout') ||
        error.message.includes('503') ||
        error.message.includes('502') ||
        error.message.includes('504') ||
        error.message.includes('rate limit') ||
        error.message.includes('temporarily unavailable') ||
        error.message.includes('fetch failed');

      // Retry for retryable errors
      if (isRetryableError && retryCount < OpenRouterProvider.MAX_RETRIES) {
        const delay = OpenRouterProvider.RETRY_DELAYS[
          Math.min(retryCount, OpenRouterProvider.RETRY_DELAYS.length - 1)
        ];
        log.warn(
          `Retryable error detected. Retrying in ${delay}ms (attempt ${retryCount + 1}/${OpenRouterProvider.MAX_RETRIES})`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.getLlmResponseWithRetry(
          messages,
          systemPrompt,
          apiKey,
          modelName,
          retryCount + 1,
        );
      }

      // If not retryable or max retries reached, handle the error
      if (activeKey) {
        let errorType: LlmKeyErrorType = 'temporary';
        if (
          error.message.includes('authentication') ||
          error.message.includes('unauthorized') ||
          error.message.includes('invalid api key')
        ) {
          errorType = 'permanent';
        }
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType,
        );
      }
      throw new LlmError(`Failed to communicate with OpenRouter API after ${retryCount + 1} attempts: ${error.message}`);
    }
  }
}

// Fallback provider tracking for automatic switching on persistent failures
class ProviderFallbackManager {
  private static failureCounts: Map<string, number> = new Map();
  private static readonly FALLBACK_PROVIDERS = [
    'openai',
    'anthropic',
    'openrouter',
    'mistral',
    'grok',
  ];
  private static readonly MAX_FAILURES_BEFORE_FALLBACK = 5;

  static getFallbackProvider(
    originalProvider: string,
    _modelName?: string,
  ): string {
    // Try fallback providers in order of preference
    for (const fallbackProvider of this.FALLBACK_PROVIDERS) {
      if (fallbackProvider !== originalProvider) {
        // Check if the fallback provider has available keys
        try {
          // This is a simple check - in a real implementation you'd check key availability
          getLogger().info(
            `Attempting to fallback from ${originalProvider} to ${fallbackProvider}`,
          );
          return fallbackProvider;
        } catch (error) {
          getLogger().warn(
            `Fallback provider ${fallbackProvider} not available: ${error}`,
          );
        }
      }
    }

    // If no fallback available, return original provider
    getLogger().warn(
      `No suitable fallback provider found for ${originalProvider}`,
    );
    return originalProvider;
  }

  static getMaxFailuresBeforeFallback(): number {
    return this.MAX_FAILURES_BEFORE_FALLBACK;
  }

  static recordFailure(providerName: string): void {
    const currentCount = this.failureCounts.get(providerName) || 0;
    this.failureCounts.set(providerName, currentCount + 1);
    getLogger().debug(
      `Provider ${providerName} failure count: ${currentCount + 1}`,
    );
  }

  static recordSuccess(providerName: string): void {
    // Reset failure count on successful call
    if (this.failureCounts.has(providerName)) {
      this.failureCounts.set(providerName, 0);
      getLogger().debug(
        `Reset failure count for provider ${providerName} after successful call`,
      );
    }
  }

  static shouldFallback(providerName: string): boolean {
    const failureCount = this.failureCounts.get(providerName) || 0;
    return failureCount >= this.MAX_FAILURES_BEFORE_FALLBACK;
  }
}

export class GeminiProvider implements ILlmProvider {
  // Invalid response patterns
  private static readonly INVALID_RESPONSE_PATTERNS = [
    'currently unable to process your request',
    'quota.*exceeded',
    'free-tier quota',
    'Please try again once the quota has reset',
    "I can't provide",
    'I cannot assist',
    "I'm unable to help",
    'I apologize, but I cannot',
    "I don't have the ability",
    'As an AI language model',
    "I'm just an AI",
    "I'm an AI assistant",
    "I can't do that",
    "I'm not able to",
    "I don't have access to",
    'I cannot generate',
    'I cannot create',
    'ERROR:',
    'FAILED:',
    '503 Service Temporarily Unavailable',
    '502 Bad Gateway',
    '500 Internal Server Error',
    'Connection timeout',
    'Request timeout',
  ];
  // Add rate limiting tracking
  private static lastRequestTime: number = 0;
  private static lastResetTime: number = Date.now();
  private static readonly MAX_RETRIES = 5; // Augmenté pour plus de robustesse
  private static requestCount: number = 0;

  private static readonly RETRY_DELAYS = [2000, 4000, 8000, 15000, 30000]; // Exponential backoff plus long

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
    modelName?: string,
  ): Promise<string> {
    return this.getLlmResponseWithRetry(
      messages,
      systemPrompt,
      apiKey,
      modelName,
      0,
    );
  }

  private async getLlmResponseWithRetry(
    messages: LLMContent[],
    systemPrompt?: string,
    apiKey?: string,
    modelName?: string,
    retryCount: number = 0,
  ): Promise<string> {
    const log = getLogger().child({ module: 'GeminiProvider' });

    let activeKey: LlmApiKey | null;
    if (apiKey) {
      activeKey = {
        apiKey: apiKey,
        apiModel: modelName || getConfig().LLM_MODEL_NAME,
        apiProvider: 'gemini', // Assuming provider based on the class
        errorCount: 0,
        isPermanentlyDisabled: false,
      };
    } else {
      activeKey = await LlmKeyManager.getNextAvailableKey('gemini');
    }

    if (!activeKey) {
      const errorMessage = 'No LLM API key available.';
      log.error(errorMessage);
      throw new LlmError(errorMessage);
    }

    // Implement improved rate limiting
    const now = Date.now();
    const timeSinceLastReset = now - GeminiProvider.lastResetTime;

    // Reset counter every minute
    if (timeSinceLastReset > 60000) {
      GeminiProvider.requestCount = 0;
      GeminiProvider.lastResetTime = now;
      log.debug('Rate limit counter reset');
    }

    // More reasonable rate limiting - max 30 requests per minute
    const MAX_REQUESTS_PER_MINUTE = 30;
    if (GeminiProvider.requestCount >= MAX_REQUESTS_PER_MINUTE) {
      const waitTime = 60000 - timeSinceLastReset;
      log.warn(
        `Rate limit exceeded (${GeminiProvider.requestCount}/${MAX_REQUESTS_PER_MINUTE}). Waiting ${waitTime}ms`,
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      // Reset after waiting
      GeminiProvider.requestCount = 0;
      GeminiProvider.lastResetTime = Date.now();
    }

    // Add delay if we're making requests too quickly
    const timeSinceLastRequest = now - GeminiProvider.lastRequestTime;
    const minDelay = getConfig().LLM_REQUEST_DELAY_MS || 1000; // Reduced to 1 second for better responsiveness
    if (timeSinceLastRequest < minDelay) {
      const delay = minDelay - timeSinceLastRequest;
      log.info(`Rate limiting: Adding ${delay}ms delay before Gemini API call`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    // Increment request counter
    GeminiProvider.requestCount++;
    GeminiProvider.lastRequestTime = Date.now();

    // Log request rate with warning if approaching limit
    const rateStatus =
      GeminiProvider.requestCount >= MAX_REQUESTS_PER_MINUTE * 0.8
        ? '⚠️ HIGH'
        : '✅ OK';
    log.info(
      `Gemini API request #${GeminiProvider.requestCount}/${MAX_REQUESTS_PER_MINUTE} in current minute ${rateStatus}`,
    );

    const baseUrl =
      activeKey.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';

    // Map OpenRouter model names to Gemini model names when falling back
    let geminiModelName = modelName || getConfig().LLM_MODEL_NAME;
    if (geminiModelName && geminiModelName.includes('openrouter/')) {
      // Map OpenRouter models to equivalent Gemini models
      if (geminiModelName.includes('dusk') || geminiModelName.includes('pro')) {
        geminiModelName = 'gemini-2.5-pro';
      } else if (geminiModelName.includes('sky') || geminiModelName.includes('flash')) {
        geminiModelName = 'gemini-2.5-flash';
      } else {
        // Default fallback
        geminiModelName = 'gemini-2.5-flash';
      }
      log.info(`Mapped OpenRouter model ${modelName} to Gemini model ${geminiModelName} for fallback`);
    }

    const apiUrl = `${baseUrl}/models/${geminiModelName}:generateContent`;

    log.info(
      {
        apiUrl,
        baseUrl,
        hasBaseUrl: !!activeKey.baseUrl,
        keyProvider: activeKey.apiProvider,
        modelName: modelName || getConfig().LLM_MODEL_NAME,
      },
      '🔗 Gemini API URL construction',
    );

    // Optimize messages for all providers - limit history to prevent memory issues and timeouts
    const maxMessages = getConfig().GEMINI_MAX_HISTORY_LENGTH || 30; // Increased for better context
    const maxMessageLength = 8000; // Increased message length limit
    const maxTotalLength = 50000; // Increased total request size limit
    let currentTotalLength = 0;

    const geminiMessages = messages
      .slice(-maxMessages)
      .map((msg) => {
        // Tronquer les messages trop longs
        const messageText = msg.parts
          .map((p: { text: string }) => p.text)
          .join('');
        const truncatedText =
          messageText.length > maxMessageLength
            ? messageText.substring(0, maxMessageLength) + '...[truncated]'
            : messageText;

        // Check if adding this message would exceed total limit
        if (currentTotalLength + truncatedText.length > maxTotalLength) {
          // Skip this message if it would exceed the limit
          return null;
        }

        currentTotalLength += truncatedText.length;

        let role = msg.role;
        let parts = [{ text: truncatedText }];

        if (role === 'tool') {
          // Gemini API does not directly support 'tool' role in 'contents'.
          // Convert tool outputs to user messages.
          role = 'user';
          parts = [
            {
              text: `Tool output: ${truncatedText}`,
            },
          ];
        }

        return { parts, role };
      })
      .filter((msg) => msg !== null); // Remove null messages

    if (systemPrompt) {
      // Prepend system prompt to the first user message, as Gemini API does not have a dedicated system role.
      const firstUserMessage = geminiMessages.find(
        (msg) => msg.role === 'user',
      );
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

    log.info(
      {
        bodySize: body.length,
        maxMessageLength,
        maxMessages,
        maxTotalLength,
        messageCount: geminiMessages.length,
        totalCharacters: currentTotalLength,
      },
      '📊 Gemini request size analysis',
    );

    try {
      // Log with retry information
      const retryInfo =
        retryCount > 0
          ? ` (retry ${retryCount}/${GeminiProvider.MAX_RETRIES})`
          : '';
      log.info(
        `[LLM CALL] Envoi de la requête au modèle : ${geminiModelName} via ${activeKey.apiProvider}${retryInfo}`,
      );

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutMs = getConfig().GEMINI_REQUEST_TIMEOUT_MS || 45000; // Timeout plus long par défaut
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      log.info(`Setting timeout to ${timeoutMs}ms for Gemini API call`);

      const response = await fetch(apiUrl, {
        body,
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': activeKey.apiKey,
        },
        method: 'POST',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        const errorMessage = `Gemini API request failed with status ${response.status}: ${errorBody}`;
        log.error({ errorBody, status: response.status }, errorMessage);
        const errorType = this.getErrorType(response.status, errorBody);
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType,
        );
        throw new LlmError(errorMessage);
      }

      const data = await response.json();
      log.debug(
        {
          headers: Object.fromEntries(response.headers.entries()),
          response: data,
          status: response.status,
          statusText: response.statusText,
        },
        'Raw Gemini API response',
      );

      // Handle different response structures
      let content: string | undefined;

      // Log the structure of the response for debugging
      log.debug(
        {
          candidates: data.candidates,
          candidatesType: typeof data.candidates,
          hasCandidates: !!data.candidates,
          hasPromptFeedback: !!data.promptFeedback,
          keys: Object.keys(data || {}),
        },
        'Response structure analysis',
      );

      // Check if we have candidates array with at least one element
      if (
        data.candidates &&
        Array.isArray(data.candidates) &&
        data.candidates.length > 0
      ) {
        const firstCandidate = data.candidates[0];
        log.debug({ firstCandidate }, 'First candidate structure');

        // Check if the first candidate has content with parts
        if (
          firstCandidate.content?.parts &&
          Array.isArray(firstCandidate.content.parts) &&
          firstCandidate.content.parts.length > 0
        ) {
          // Extract all text parts and join them
          content = firstCandidate.content.parts
            .map((part: { text?: string }) => part.text || '')
            .filter((text: string) => text.trim().length > 0) // Filter out empty parts
            .join('');
          log.debug('Extracted content from candidates[0].content.parts');

          // If content is still empty after filtering, this might be an empty response
          if (!content || content.trim().length === 0) {
            log.warn(
              'All content parts were empty, treating as empty response',
            );
            content = undefined; // Will trigger retry logic below
          }
        }
        // Handle UNEXPECTED_TOOL_CALL finish reason with content
        else if (
          firstCandidate.finishReason === 'UNEXPECTED_TOOL_CALL' &&
          firstCandidate.content?.parts?.[0]?.text
        ) {
          content = firstCandidate.content.parts[0].text;
          log.warn(
            'UNEXPECTED_TOOL_CALL finish reason encountered, but content is available',
          );
        }
        // Handle UNEXPECTED_TOOL_CALL without content
        else if (firstCandidate.finishReason === 'UNEXPECTED_TOOL_CALL') {
          log.warn(
            'UNEXPECTED_TOOL_CALL finish reason encountered without content. This may indicate the model attempted to make tool calls directly.',
          );
          content =
            'The model attempted to make tool calls directly, which is not supported in this context. Please try rephrasing your request or using available tools explicitly.';
        }
        // Handle other finish reasons with no content
        else {
          log.warn(
            `Candidate has no valid content. Finish reason: ${firstCandidate.finishReason || 'undefined'}`,
          );
          // Try to extract alternative content if available
          if (
            firstCandidate.content &&
            typeof firstCandidate.content === 'object'
          ) {
            const altContent = JSON.stringify(firstCandidate.content);
            if (altContent.length > 10) {
              content = `Model response (raw): ${altContent}`;
              log.info('Using alternative content extraction');
            } else {
              content = undefined; // Will trigger retry logic
            }
          } else {
            content = undefined; // Will trigger retry logic
          }
        }
      }
      // Handle case where candidates array exists but is empty
      else if (
        data.candidates &&
        Array.isArray(data.candidates) &&
        data.candidates.length === 0
      ) {
        log.warn('Gemini API returned empty candidates array');
        content = undefined; // Will trigger retry logic
      }
      // Handle cases where there are no candidates but we have a promptFeedback field
      else if (data.promptFeedback) {
        log.warn(
          'Gemini API returned promptFeedback instead of candidates. This may indicate content safety issues.',
        );
        content =
          'The request was blocked due to safety concerns. Please try rephrasing your request with different content.';
      }
      // Handle cases where there are no candidates and no promptFeedback
      else {
        log.warn('Gemini API returned response without candidates field.');
        // Try to extract any possible content from the response
        if (data.candidates) {
          log.debug(
            { candidates: data.candidates },
            'Candidates field exists but is not an array or is empty',
          );
        }

        // Enhanced retry logic for empty responses from stable Gemini API
        const maxRetries = getConfig().LLM_MAX_RETRIES || 5;
        if (retryCount < maxRetries) {
          const baseRetryDelay = getConfig().LLM_RETRY_DELAY_BASE_MS || 2000;
          log.warn(
            `Gemini returned empty response, retrying (${retryCount + 1}/${maxRetries})`,
          );

          // Add exponential backoff with jitter to avoid thundering herd
          const jitter = Math.random() * 1000; // Add up to 1 second of random jitter
          const exponentialDelay =
            baseRetryDelay * Math.pow(2, retryCount) + jitter;

          log.info(
            `Retrying Gemini API call in ${Math.round(exponentialDelay)}ms with exponential backoff`,
          );
          await new Promise((resolve) => setTimeout(resolve, exponentialDelay));
          return this.getLlmResponseWithRetry(
            messages,
            systemPrompt,
            apiKey,
            modelName,
            retryCount + 1,
          );
        }

        // If all retries exhausted, try to provide a fallback response
        if (data && typeof data === 'object') {
          // Try to extract any meaningful content from the response
          const responseStr = JSON.stringify(data);
          if (responseStr.length > 50) {
            content = `Model response (fallback): ${responseStr.substring(0, 500)}...`;
            log.info('Using fallback content extraction from empty response');
          } else {
            content =
              'The model did not return a valid response after multiple attempts. Please try again or rephrase your request.';
          }
        } else {
          content =
            'The model did not return a valid response after multiple attempts. Please try again or rephrase your request.';
        }
      }

      if (
        content === undefined ||
        content === null ||
        (content && content.trim() === '')
      ) {
        log.error(
          { response: data },
          'Invalid response structure from Gemini API - empty or undefined content',
        );

        // Enhanced retry logic for empty responses
        const maxRetries = getConfig().LLM_MAX_RETRIES || 5;
        if (retryCount < maxRetries) {
          const baseRetryDelay = getConfig().LLM_RETRY_DELAY_BASE_MS || 2000;
          log.warn(
            `Gemini returned invalid/empty content, retrying (${retryCount + 1}/${maxRetries})`,
          );

          // Add exponential backoff with jitter
          const jitter = Math.random() * 1000;
          const exponentialDelay =
            baseRetryDelay * Math.pow(2, retryCount) + jitter;

          log.info(
            `Retrying Gemini API call in ${Math.round(exponentialDelay)}ms due to empty content`,
          );
          await new Promise((resolve) => setTimeout(resolve, exponentialDelay));
          return this.getLlmResponseWithRetry(
            messages,
            systemPrompt,
            apiKey,
            modelName,
            retryCount + 1,
          );
        }

        // If all retries exhausted, mark key as bad and throw error
        const errorType = this.getErrorType(
          response.status,
          JSON.stringify(data),
        );
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType,
        );
        throw new LlmError(
          'Invalid response structure from Gemini API after multiple retries. The model consistently returned empty responses.',
        );
      }

      // Enhanced validation of content quality with better parsing
      let processedContent = content;

      // Try to extract JSON from mixed text+JSON responses
      if (content.includes('```json')) {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            const parsedJson = JSON.parse(jsonMatch[1].trim());
            if (parsedJson.command) {
              processedContent = JSON.stringify(parsedJson);
              log.info('Successfully extracted JSON from mixed response');
            }
          } catch (parseError) {
            log.warn(
              { parseError },
              'Failed to parse extracted JSON, using original content',
            );
          }
        }
      }

      if (this.isInvalidResponse(processedContent)) {
        log.error(
          { content: processedContent },
          'Gemini API returned invalid/error content',
        );
        const errorType = processedContent.includes('quota')
          ? LlmKeyErrorType.TEMPORARY
          : LlmKeyErrorType.TEMPORARY;
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType,
        );
        throw new LlmError(
          `Gemini API returned invalid response: ${processedContent.substring(0, 200)}...`,
        );
      }

      content = processedContent;

      // More accurate token counting for Gemini
      const estimatedTokens =
        messages.reduce(
          (sum, msg) =>
            sum +
            msg.parts.reduce(
              (partSum: number, part: { text?: string }) =>
                partSum + (part.text?.length || 0),
              0,
            ),
          0,
        ) + content.length;
      getRedisClientInstance()
        .incrby('leaderboard:tokensSaved', estimatedTokens)
        .catch((_error: unknown) => {
          getLogger().error(
            { _error },
            'Failed to increment tokensSaved in Redis',
          );
        });

      // If successful, reset error count for this key and record success for fallback manager
      await LlmKeyManager.resetKeyStatus(
        activeKey.apiProvider,
        activeKey.apiKey,
      );

      // Record success for fallback manager
      ProviderFallbackManager.recordSuccess(activeKey.apiProvider);

      return content.trim();
    } catch (_error) {
      if (_error instanceof LlmError) {
        throw _error;
      }

      const error =
        _error instanceof Error ? _error : new Error(String(_error));
      log.error({ error, retryCount }, 'Failed to get response from LLM');

      // Enhanced error classification with more comprehensive detection
      const isTimeoutError =
        error.message.includes('AbortError') ||
        error.message.includes('timeout') ||
        error.message.includes('TIMEOUT') ||
        error.name === 'AbortError' ||
        error.message.includes('Request timeout') ||
        error.message.includes('Connection timed out') ||
        error.message.includes('Request timed out') ||
        error.message.includes('ETIMEDOUT');

      const isNetworkError =
        error.message.includes('network') ||
        error.message.includes('ECONNRESET') ||
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('ENOTFOUND') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('fetch failed') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError') ||
        error.message.includes('connection') ||
        error.message.includes('socket hang up') ||
        error.message.includes('DNS') ||
        error.message.includes('SSL') ||
        error.message.includes('certificate');

      const isRetryableApiError =
        error.message.includes('503') ||
        error.message.includes('502') ||
        error.message.includes('504') ||
        error.message.includes('rate limit') ||
        error.message.includes('temporarily unavailable') ||
        error.message.includes('Internal server error') ||
        error.message.includes('Service Unavailable') ||
        error.message.includes('Bad Gateway') ||
        error.message.includes('Gateway Timeout') ||
        error.message.includes('Too Many Requests') ||
        error.message.includes('Server Error') ||
        error.message.includes('Temporary failure');

      const isInvalidResponseError =
        error.message.includes('invalid response') ||
        error.message.includes('parsing failed') ||
        error.message.includes('JSON') ||
        error.message.includes('malformed') ||
        error.message.includes('Unexpected token') ||
        error.message.includes('SyntaxError');

      const isQuotaError =
        error.message.includes('quota') ||
        error.message.includes('limit exceeded') ||
        error.message.includes('billing') ||
        error.message.includes('insufficient funds') ||
        error.message.includes('payment required');

      const isAuthError =
        error.message.includes('unauthorized') ||
        error.message.includes('authentication') ||
        error.message.includes('invalid api key') ||
        error.message.includes('forbidden') ||
        error.message.includes('403') ||
        error.message.includes('401');

      // Enhanced retry logic with better backoff strategy
      const shouldRetry =
        (isTimeoutError || isNetworkError || isRetryableApiError) &&
        retryCount < GeminiProvider.MAX_RETRIES;
      const shouldNotRetry =
        isInvalidResponseError || isQuotaError || isAuthError;

      if (shouldRetry && !shouldNotRetry) {
        // Use exponential backoff with jitter for better distribution
        const baseDelay =
          GeminiProvider.RETRY_DELAYS[
            Math.min(retryCount, GeminiProvider.RETRY_DELAYS.length - 1)
          ];
        const jitter = Math.random() * 1000; // Add up to 1 second of random jitter
        const delay = baseDelay + jitter;

        let errorType = 'unknown';
        if (isTimeoutError) errorType = 'timeout';
        else if (isNetworkError) errorType = 'network';
        else if (isRetryableApiError) errorType = 'API';

        log.warn(
          `${errorType} error detected. Retrying in ${Math.round(delay)}ms (attempt ${retryCount + 1}/${GeminiProvider.MAX_RETRIES})`,
        );
        log.debug(
          {
            error: error.message,
            errorType,
            maxRetries: GeminiProvider.MAX_RETRIES,
            retryCount: retryCount + 1,
          },
          'Retry details',
        );

        // Add progressive delay increase for persistent failures
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.getLlmResponseWithRetry(
          messages,
          systemPrompt,
          apiKey,
          modelName,
          retryCount + 1,
        );
      }

      // Handle different error types appropriately
      if (isInvalidResponseError) {
        log.warn(
          'Invalid response error detected - not retrying as this is likely a permanent issue',
        );
        if (activeKey) {
          ProviderFallbackManager.recordFailure(activeKey.apiProvider);
        }
      } else if (isQuotaError) {
        log.error(
          'Quota/billing error detected - marking key as permanently disabled',
        );
        if (activeKey) {
          await LlmKeyManager.markKeyAsBad(
            activeKey.apiProvider,
            activeKey.apiKey,
            LlmKeyErrorType.PERMANENT,
          );
          ProviderFallbackManager.recordFailure(activeKey.apiProvider);
        }
      } else if (isAuthError) {
        log.error(
          'Authentication error detected - marking key as permanently disabled',
        );
        if (activeKey) {
          await LlmKeyManager.markKeyAsBad(
            activeKey.apiProvider,
            activeKey.apiKey,
            LlmKeyErrorType.PERMANENT,
          );
          ProviderFallbackManager.recordFailure(activeKey.apiProvider);
        }
      } else if (retryCount >= GeminiProvider.MAX_RETRIES) {
        log.error(
          `Maximum retry attempts (${GeminiProvider.MAX_RETRIES}) exceeded. Recording failure for fallback consideration.`,
        );
        if (activeKey) {
          ProviderFallbackManager.recordFailure(activeKey.apiProvider);
        }
      } else {
        // Record failure for other retryable errors
        if (activeKey) {
          ProviderFallbackManager.recordFailure(activeKey.apiProvider);
        }
      }

      if (activeKey) {
        // Smarter key management based on error type
        let errorType: LlmKeyErrorType = LlmKeyErrorType.TEMPORARY;
        if (isInvalidResponseError) {
          errorType = LlmKeyErrorType.PERMANENT; // Don't retry invalid responses
        } else if (
          error.message.includes('quota') ||
          error.message.includes('billing')
        ) {
          errorType = LlmKeyErrorType.PERMANENT; // Quota/billing issues are permanent
        } else if (
          error.message.includes('authentication') ||
          error.message.includes('unauthorized')
        ) {
          errorType = LlmKeyErrorType.PERMANENT; // Auth issues are permanent
        }

        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType,
        );
      }

      // Provide more helpful error messages
      let errorMessage = `Failed to communicate with the LLM after ${retryCount + 1} attempts`;
      if (isInvalidResponseError) {
        errorMessage += ': Invalid response format from API';
      } else if (isNetworkError) {
        errorMessage += ': Network connectivity issue';
      } else {
        errorMessage += `: ${error.message}`;
      }

      throw new LlmError(errorMessage);
    }
  }

  private isInvalidResponse(content: string): boolean {
    // Check if content is too short to be meaningful
    if (content.trim().length < 10) {
      return true;
    }

    // Check against known invalid patterns
    const lowerContent = content.toLowerCase();
    return GeminiProvider.INVALID_RESPONSE_PATTERNS.some((pattern) => {
      const regex = new RegExp(pattern, 'i');
      return regex.test(lowerContent);
    });
  }
}

export function getLlmProvider(
  providerName: string,
  modelName?: string,
): ILlmProvider {
  let currentLlmProvider: ILlmProvider;
  let actualProviderName = providerName;

  // Check if it's a GPT-5 model
  if (providerName === 'openai' && modelName && modelName.startsWith('gpt-5')) {
    return new Gpt5Provider();
  }

  // Check if we should fallback from the requested provider
  if (ProviderFallbackManager.shouldFallback(providerName)) {
    const fallbackProvider = ProviderFallbackManager.getFallbackProvider(
      providerName,
      modelName,
    );
    if (fallbackProvider !== providerName) {
      getLogger().warn(
        `Provider ${providerName} has failed ${ProviderFallbackManager.getMaxFailuresBeforeFallback()} times. Falling back to ${fallbackProvider}.`,
      );
      actualProviderName = fallbackProvider;
    }
  }

  // Handle custom Gemini provider names (gemini-flash-1, gemini-pro-1, etc.)
  let resolvedProviderName = actualProviderName;
  let resolvedModelName = modelName;

  if (
    actualProviderName.startsWith('gemini-flash-') ||
    actualProviderName.startsWith('gemini-pro-')
  ) {
    resolvedProviderName = 'gemini';
    // Extract the model type from the provider name
    if (actualProviderName.includes('flash')) {
      resolvedModelName = 'gemini-2.5-flash';
    } else if (actualProviderName.includes('pro')) {
      resolvedModelName = 'gemini-2.5-pro';
    }
    getLogger().info(
      `Resolved custom provider ${actualProviderName} to ${resolvedProviderName} with model ${resolvedModelName}`,
    );
  }

  switch (resolvedProviderName) {
    case 'anthropic':
      currentLlmProvider = new AnthropicProvider();
      break;
    case 'gemini':
      currentLlmProvider = new GeminiProvider();
      break;
    case 'grok':
      currentLlmProvider = new GrokProvider();
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
    case 'openrouter':
      currentLlmProvider = new OpenRouterProvider();
      break;
    case 'openrouter-dusk':
      currentLlmProvider = new OpenRouterProvider();
      break;
    case 'openrouter-sky':
      currentLlmProvider = new OpenRouterProvider();
      break;
    case 'qwen':
      currentLlmProvider = new QwenProvider();
      break;
    default:
      getLogger().warn(
        `Unknown LLM provider requested: ${resolvedProviderName}. Defaulting to GeminiProvider.`,
      );
      currentLlmProvider = new GeminiProvider();
      break;
  }

  // Log the provider being used
  if (actualProviderName !== providerName) {
    getLogger().info(
      `Using fallback provider: ${actualProviderName} (requested: ${providerName})`,
    );
  }

  return currentLlmProvider;
}

// Export the fallback manager for external use if needed
export { ProviderFallbackManager };
