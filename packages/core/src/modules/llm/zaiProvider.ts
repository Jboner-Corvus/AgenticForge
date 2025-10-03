import { getConfig } from '../../config.ts';
import { getLogger } from '../../logger.ts';
import { ILlmProvider, LLMContent } from './llm-types.ts';
import { LlmError } from './llm-types.ts';
import { LlmApiKey, LlmKeyErrorType, LlmKeyManager } from './LlmKeyManager.ts';
import { getRedisClientInstance } from '../redis/redisClient.ts';

export class ZaiProvider implements ILlmProvider {
  public getErrorType(statusCode: number, errorBody: string): LlmKeyErrorType {
    if (statusCode === 401 || statusCode === 403) {
      return LlmKeyErrorType.PERMANENT;
    } else if (statusCode === 429) {
      return LlmKeyErrorType.TEMPORARY;
    } else if (statusCode >= 500) {
      return LlmKeyErrorType.TEMPORARY;
    } else if (
      errorBody.includes('invalid_api_key') ||
      errorBody.includes('Incorrect API key')
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
    const log = getLogger().child({ module: 'ZaiProvider' });

    let activeKey: LlmApiKey | null;
    if (apiKey) {
      activeKey = {
        apiKey: apiKey,
        apiModel: modelName || getConfig().LLM_MODEL_NAME,
        apiProvider: 'zai',
        errorCount: 0,
        isPermanentlyDisabled: false,
      };
    } else {
      activeKey = await LlmKeyManager.getNextAvailableKey('zai');
    }

    if (!activeKey) {
      const errorMessage = 'No z.ai API key available.';
      log.error(errorMessage);
      throw new LlmError(errorMessage);
    }

    // Use z.ai API endpoint (corrected URL with chat completions)
    const apiUrl = activeKey.baseUrl || 'https://api.z.ai/api/coding/paas/v4/chat/completions';

    // Format messages for z.ai API (OpenAI-compatible)
    const zaiMessages = messages.map((msg) => ({
      content: msg.parts.map((part) => part.text).join(''),
      role: msg.role === 'user' ? 'user' : 'assistant',
    }));

    // Add system prompt if provided
    if (systemPrompt) {
      zaiMessages.unshift({ content: systemPrompt, role: 'system' });
    }

    const requestBody = {
      model: modelName || activeKey.apiModel || 'glm-4.6',
      messages: zaiMessages,
    };

    const body = JSON.stringify(requestBody);

    try {
      log.info(
        `[LLM CALL] Sending request to model: ${activeKey.apiModel} via ${activeKey.apiProvider}`,
      );

      // Set timeout for the API call - increased to 120 seconds for complex requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout

      const response = await fetch(apiUrl, {
        body,
        headers: {
          Authorization: `Bearer ${activeKey.apiKey}`,
          'Content-Type': 'application/json',
          'Accept-Language': 'en-US,en',
        },
        method: 'POST',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        const errorMessage = `z.ai API request failed with status ${response.status}: ${errorBody}`;
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
          'Invalid response structure from z.ai API',
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
          'Invalid response structure from z.ai API. The model may have returned an empty response.',
        );
      }

      // Get real token usage from z.ai API response if available
      const inputTokens = data.usage?.prompt_tokens || 0;
      const outputTokens = data.usage?.completion_tokens || 0;
      const totalTokens = inputTokens + outputTokens;

      log.info(
        `Token usage - Input: ${inputTokens}, Output: ${outputTokens}, Total: ${totalTokens}`,
      );

      // Store token usage in Redis for tracking
      await getRedisClientInstance()
        .incrby('leaderboard:tokensSaved', totalTokens)
        .catch((_error: unknown) => {
          getLogger().error(
            { _error },
            'Failed to increment tokensSaved in Redis',
          );
        });

      // Store detailed token stats for the session
      await getRedisClientInstance()
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
    } catch (error) {
      if (error instanceof LlmError) {
        throw error;
      }
      
      const typedError = error as Error;
      log.error({ error: typedError }, 'Failed to get response from z.ai API');
      
      if (activeKey) {
        // For network errors or timeouts, mark as temporary; for other errors, check the error message
        let errorType = LlmKeyErrorType.TEMPORARY;
        if (typedError.message.includes('AbortError') || typedError.name === 'AbortError') {
          log.warn('z.ai API request timed out');
        }
        
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType,
        );
      }
      
      throw new LlmError('Failed to communicate with the z.ai API.');
    }
  }
}