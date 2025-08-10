import { config } from '../../config.js';
import { getLogger } from '../../logger.js';
import { ILlmProvider } from '../../types.js';
import { LlmError } from '../../utils/LlmError.js';
import { getRedisClientInstance } from '../redis/redisClient.js';
import { LLMContent } from './llm-types.js';
import { LlmApiKey, LlmKeyErrorType, LlmKeyManager } from './LlmKeyManager.js';

export class QwenProvider implements ILlmProvider {
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
    modelName?: string,
  ): Promise<string> {
    const log = getLogger().child({ module: 'QwenProvider' });

    let activeKey: LlmApiKey | null = null;
    if (apiKey) {
      activeKey = {
        apiKey: apiKey,
        apiModel: modelName || config.LLM_MODEL_NAME,
        apiProvider: 'qwen',
        errorCount: 0,
        isPermanentlyDisabled: false,
      };
    } else {
      activeKey = await LlmKeyManager.getNextAvailableKey('qwen');
    }

    if (!activeKey) {
      const errorMessage = 'No Qwen API key available.';
      log.error(errorMessage);
      throw new LlmError(errorMessage);
    }

    // Qwen API endpoint
    const apiUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

    // Format messages for Qwen
    const qwenMessages = messages.map((msg) => ({
      content: msg.parts.map((part) => part.text).join(''),
      role: msg.role === 'user' ? 'user' : 'assistant',
    }));

    if (systemPrompt) {
      qwenMessages.unshift({ content: systemPrompt, role: 'system' });
    }

    const requestBody = {
      model: modelName || activeKey.apiModel || 'qwen-plus', // Default to qwen-plus if no model specified
      input: {
        messages: qwenMessages,
      },
      parameters: {
        incremental_output: false,
        result_format: 'message',
      },
    };

    const body = JSON.stringify(requestBody);

    try {
      // Add a delay before making the LLM request
      await new Promise((resolve) =>
        setTimeout(resolve, config.LLM_REQUEST_DELAY_MS),
      );

      log.info(
        `[LLM CALL] Sending request to model: ${
          activeKey!.apiModel
        } via ${activeKey!.apiProvider}`,
      );
      const response = await fetch(apiUrl, {
        body,
        headers: {
          Authorization: `Bearer ${activeKey!.apiKey}`,
          'Content-Type': 'application/json',
          'X-DashScope-SSE': 'disable',
        },
        method: 'POST',
      });

      if (!response.ok) {
        const errorBody = await response.text();
        const errorMessage = `Qwen API request failed with status ${response.status}: ${errorBody}`;
        log.error({ errorBody, status: response.status }, errorMessage);
        const errorType = this.getErrorType(response.status, errorBody);
        await LlmKeyManager.markKeyAsBad(
          activeKey!.apiProvider,
          activeKey!.apiKey,
          errorType,
        );
        throw new LlmError(errorMessage);
      }

      const data = await response.json();

      const content = data.output?.choices?.[0]?.message?.content;
      if (content === undefined || content === null) {
        log.error(
          { response: data },
          'Invalid response structure from Qwen API',
        );
        const errorType = this.getErrorType(
          response.status,
          JSON.stringify(data),
        );
        await LlmKeyManager.markKeyAsBad(
          activeKey!.apiProvider,
          activeKey!.apiKey,
          errorType,
        );
        throw new LlmError(
          'Invalid response structure from Qwen API. The model may have returned an empty response.',
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
        .catch((error: unknown) => {
          getLogger().error(
            { error },
            'Failed to increment tokensSaved in Redis',
          );
        });

      await LlmKeyManager.resetKeyStatus(
        activeKey!.apiProvider,
        activeKey!.apiKey,
      );

      return content.trim();
    } catch (error) {
      if (error instanceof LlmError) {
        throw error;
      }
      log.error({ error }, 'Failed to get response from LLM');
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