import { getConfig } from '../config.ts';
import { getLogger } from '../logger.ts';
import {
  LLMContent,
  LlmError,
  LlmKeyErrorType,
} from '../modules/llm/llm-types.ts';
import { LlmApiKey, LlmKeyManager } from '../modules/llm/LlmKeyManager.ts';
import { getRedisClientInstance } from '../modules/redis/redisClient.ts';

export interface Gpt5ReasoningOptions {
  effort: 'high' | 'low' | 'medium' | 'minimal';
}

export interface Gpt5RequestOptions {
  reasoning?: Gpt5ReasoningOptions;
  text?: Gpt5TextOptions;
}

export interface Gpt5TextOptions {
  verbosity: 'high' | 'low' | 'medium';
}

export class Gpt5Provider {
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
    gpt5Options?: Gpt5RequestOptions,
  ): Promise<string> {
    const log = getLogger().child({ module: 'Gpt5Provider' });

    let activeKey: LlmApiKey | null;
    if (apiKey) {
      activeKey = {
        apiKey: apiKey,
        apiModel: modelName || getConfig().LLM_MODEL_NAME,
        apiProvider: 'openai', // GPT-5 is an OpenAI model
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

    const apiUrl = activeKey.baseUrl || 'https://api.openai.com/v1/responses'; // New endpoint for GPT-5

    // Convert messages to the format expected by GPT-5
    const gpt5Messages = messages.map((msg) => ({
      content: msg.parts.map((part: { text: string }) => part.text).join(''),
      role: msg.role === 'user' ? 'user' : 'assistant',
    }));

    // Prepare the input content
    const inputContent = gpt5Messages.map((m) => m.content).join('\n');

    const requestBody: any = {
      input: inputContent,
      model: modelName || getConfig().LLM_MODEL_NAME,
    };

    // Add GPT-5 specific options if provided
    if (gpt5Options?.reasoning) {
      requestBody.reasoning = gpt5Options.reasoning;
    }

    if (gpt5Options?.text) {
      requestBody.text = gpt5Options.text;
    }

    // Add system prompt if provided
    if (systemPrompt) {
      requestBody.system_prompt = systemPrompt;
    }

    const body = JSON.stringify(requestBody);

    try {
      // Log before each LLM call
      log.info(
        `[LLM CALL] Envoi de la requête au modèle GPT-5 : ${modelName || getConfig().LLM_MODEL_NAME} via ${activeKey.apiProvider}`,
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
        const errorMessage = `GPT-5 API request failed with status ${response.status}: ${errorBody}`;
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

      // Extract content from the response
      const content = data.choices?.[0]?.message?.content || data.output;
      if (content === undefined || content === null) {
        log.error(
          { response: data },
          'Invalid response structure from GPT-5 API',
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
          'Invalid response structure from GPT-5 API. The model may have returned an empty response.',
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
      log.error({ _error }, 'Failed to get response from GPT-5');
      if (activeKey) {
        // Assume network errors or unhandled exceptions are temporary
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          LlmKeyErrorType.TEMPORARY,
        );
      }
      throw new LlmError('Failed to communicate with GPT-5.');
    }
  }
}
