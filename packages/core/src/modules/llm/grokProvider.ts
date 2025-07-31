import { config } from '../../config.js';
import { getLogger } from '../../logger.js';
import { ILlmProvider } from '../../types.js';
import { LlmError } from '../../utils/LlmError.js';
import { getRedisClientInstance } from '../redis/redisClient.js';
import { LLMContent } from './llm-types.js';
import { LlmApiKey, LlmKeyErrorType, LlmKeyManager } from './LlmKeyManager.js';

export class GrokProvider implements ILlmProvider {
  public getErrorType(statusCode: number, _errorBody: string): LlmKeyErrorType {
    if (statusCode === 401 || statusCode === 403) {
      return LlmKeyErrorType.PERMANENT;
    } else if (statusCode === 429) {
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
        errorCount: 0,
        isPermanentlyDisabled: false,
        key: apiKey,
        modelName: modelName || config.LLM_MODEL_NAME,
        provider: 'grok',
      };
    } else {
      activeKey = await LlmKeyManager.getNextAvailableKey('grok');
    }

    if (!activeKey) {
      const errorMessage = 'No Grok API key available.';
      log.error(errorMessage);
      throw new LlmError(errorMessage);
    }

    const apiUrl = 'https://api.grok.com/v1/chat/completions'; // Adjust if Grok has a different API endpoint

    const grokMessages = messages.map((msg) => ({
      content: msg.parts.map((part) => part.text).join(''),
      role: msg.role === 'user' ? 'user' : 'assistant',
    }));

    if (systemPrompt) {
      grokMessages.unshift({ content: systemPrompt, role: 'system' });
    }

    const requestBody = {
      messages: grokMessages,
      model: modelName || config.LLM_MODEL_NAME, // Use modelName if provided, else fallback to config
    };

    const body = JSON.stringify(requestBody);

    try {
      // Add a delay before making the LLM request
      await new Promise(resolve => setTimeout(resolve, config.LLM_REQUEST_DELAY_MS));

      log.info(
        `[LLM CALL] Sending request to model: ${
          modelName || config.LLM_MODEL_NAME
        } via ${activeKey.provider}`,
      );
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
        const errorMessage = `Grok API request failed with status ${response.status}: ${errorBody}`;
        log.error({ errorBody, status: response.status }, errorMessage);
        const errorType = this.getErrorType(response.status, errorBody);
        await LlmKeyManager.markKeyAsBad(
          activeKey.provider,
          activeKey.key,
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
          activeKey.provider,
          activeKey.key,
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
              (partSum, part) => partSum + (part.text?.length || 0),
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

      await LlmKeyManager.resetKeyStatus(activeKey.provider, activeKey.key);

      return content.trim();
    } catch (_error) {
      if (_error instanceof LlmError) {
        throw _error;
      }
      log.error({ _error }, 'Failed to get response from LLM');
      if (activeKey) {
        await LlmKeyManager.markKeyAsBad(
          activeKey.provider,
          activeKey.key,
          LlmKeyErrorType.TEMPORARY,
        );
      }
      throw new LlmError('Failed to communicate with the LLM.');
    }
  }
}
