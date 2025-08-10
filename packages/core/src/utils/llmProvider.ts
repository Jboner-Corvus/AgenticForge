import { getConfig } from '../config.js';
import { getLogger } from '../logger.js';
import { ILlmProvider, LLMContent, LlmError } from '../modules/llm/llm-types.js';
import { LlmApiKey, LlmKeyManager } from '../modules/llm/LlmKeyManager.js';
import { LlmKeyErrorType } from '../modules/llm/LlmKeyManager.js';
import { QwenProvider } from '../modules/llm/qwenProvider.js';
import { getRedisClientInstance } from '../modules/redis/redisClient.js';
import { Gpt5Provider } from './gpt5Provider.js';

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
      return { content: msg.parts.map((p: { text: string }) => p.text).join(''), role };
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

      const estimatedTokens =
        messages.reduce(
          (sum, msg) =>
            sum +
            msg.parts.reduce(
              (partSum: number, part: { text?: string }) => partSum + (part.text?.length || 0),
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

class GeminiProvider implements ILlmProvider {
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

    const baseUrl =
      activeKey.baseUrl || 'https://generativelanguage.googleapis.com/v1';
    const apiUrl = `${baseUrl}/models/${modelName || getConfig().LLM_MODEL_NAME}:generateContent?key=${activeKey.apiKey}`;

    const geminiMessages = messages.map((msg) => {
      let role = msg.role;
      let parts = msg.parts;

      if (role === 'tool') {
        // Gemini API does not directly support 'tool' role in 'contents'.
        // Convert tool outputs to user messages.
        role = 'user';
        parts = [{ text: `Tool output: ${parts.map((p: { text: string }) => p.text).join('')}` }];
      }

      return { parts, role };
    });

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

    try {
      // Log 2: Avant chaque appel LLM
      log.info(
        `[LLM CALL] Envoi de la requête au modèle : ${modelName || getConfig().LLM_MODEL_NAME} via ${activeKey.apiProvider}`,
      );
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
          activeKey.apiProvider,
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
          activeKey.apiProvider,
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
              (partSum: number, part: { text?: string }) => partSum + (part.text?.length || 0),
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

      // If successful, reset error count for this key
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
              (partSum: number, part: { text?: string }) => partSum + (part.text?.length || 0),
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
              (partSum: number, part: { text?: string }) => partSum + (part.text?.length || 0),
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
              (partSum: number, part: { text?: string }) => partSum + (part.text?.length || 0),
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
              (partSum: number, part: { text?: string }) => partSum + (part.text?.length || 0),
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
    const log = getLogger().child({ module: 'OpenRouterProvider' });

    let activeKey: LlmApiKey | null;
    if (apiKey) {
      activeKey = {
        apiKey: apiKey,
        apiModel: modelName || getConfig().LLM_MODEL_NAME,
        apiProvider: 'openrouter', // Assuming provider based on the class
        errorCount: 0,
        isPermanentlyDisabled: false,
      };
    } else {
      activeKey = await LlmKeyManager.getNextAvailableKey('openrouter');
    }

    if (!activeKey) {
      const errorMessage = 'No LLM API key available.';
      log.error(errorMessage);
      throw new LlmError(errorMessage);
    }

    const apiUrl =
      activeKey.baseUrl || 'https://openrouter.ai/api/v1/chat/completions';

    const openRouterMessages = messages.map((msg) => ({
      content: msg.parts.map((part) => part.text).join(''),
      role: msg.role === 'user' ? 'user' : 'model',
    }));

    if (systemPrompt) {
      openRouterMessages.unshift({ content: systemPrompt, role: 'system' });
    }

    const requestBody = {
      messages: openRouterMessages,
      model: modelName || getConfig().LLM_MODEL_NAME, // Use modelName if provided, else fallback to config
    };

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

      const content = data.choices?.[0]?.message?.content;
      if (content === undefined || content === null) {
        log.error(
          { response: data },
          'Invalid response structure from OpenRouter API',
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
          'Invalid response structure from OpenRouter API. The model may have returned an empty response.',
        );
      }

      // Placeholder for token counting
      const estimatedTokens =
        messages.reduce(
          (sum, msg) =>
            sum +
            msg.parts.reduce(
              (partSum: number, part: { text?: string }) => partSum + (part.text?.length || 0),
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

export function getLlmProvider(providerName: string, modelName?: string): ILlmProvider {
  let currentLlmProvider: ILlmProvider;

  // Check if it's a GPT-5 model
  if (providerName === 'openai' && modelName && modelName.startsWith('gpt-5')) {
    return new Gpt5Provider();
  }

  switch (providerName) {
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
    case 'qwen':
        currentLlmProvider = new QwenProvider();
        break;
    default:
      getLogger().warn(
        `Unknown LLM provider requested: ${providerName}. Defaulting to GeminiProvider.`,
      );
      currentLlmProvider = new GeminiProvider();
      break;
  }
  return currentLlmProvider;
}
