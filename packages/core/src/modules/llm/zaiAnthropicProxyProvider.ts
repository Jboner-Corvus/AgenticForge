import { getConfig } from '../../config.ts';
import { getLogger } from '../../logger.ts';
import { ILlmProvider, LLMContent } from './llm-types.ts';
import { LlmError } from './llm-types.ts';
import { LlmApiKey, LlmKeyErrorType, LlmKeyManager } from './LlmKeyManager.ts';
import { getRedisClientInstance } from '../redis/redisClient.ts';

export class ZaiAnthropicProxyProvider implements ILlmProvider {
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
    const log = getLogger().child({ module: 'ZaiAnthropicProxyProvider' });

    let activeKey: LlmApiKey | null;
    let authToken: string;

    if (apiKey) {
      activeKey = {
        apiKey: apiKey,
        apiModel: modelName || getConfig().LLM_MODEL_NAME,
        apiProvider: 'zai-anthropic-proxy',
        errorCount: 0,
        isPermanentlyDisabled: false,
      };
      authToken = apiKey;
    } else {
      activeKey = await LlmKeyManager.getNextAvailableKey('zai');
      authToken = getConfig().ANTHROPIC_AUTH_TOKEN || activeKey?.apiKey || '';
    }

    if (!activeKey && !authToken) {
      const errorMessage = 'No Z.ai Anthropic proxy API key available.';
      log.error(errorMessage);
      throw new LlmError(errorMessage);
    }

    // Ensure we have a valid activeKey for API calls
    if (!activeKey && authToken) {
      activeKey = {
        apiKey: authToken,
        apiModel: modelName || getConfig().LLM_MODEL_NAME,
        apiProvider: 'zai-anthropic-proxy',
        errorCount: 0,
        isPermanentlyDisabled: false,
      };
    }

    // Override the activeKey apiKey if we have environment auth token
    if (authToken && activeKey) {
      activeKey.apiKey = authToken;
    }

    // Use Z.ai Anthropic proxy endpoint
    const apiUrl = `${getConfig().ANTHROPIC_BASE_URL || 'https://api.z.ai/api/anthropic'}/v1/messages`;

    // Format messages for Claude API (Anthropic format)
    const claudeMessages = messages.map((msg) => ({
      content: msg.parts.map((part) => part.text).join(''),
      role: msg.role === 'user' ? 'user' : 'assistant',
    }));

    // Build Anthropic-style request
    const requestBody: any = {
      model: modelName || activeKey?.apiModel || 'claude-3-5-sonnet-20241022',
      messages: claudeMessages,
      max_tokens: 4000,
      temperature: 0.6,
    };

    // Add system prompt if provided
    if (systemPrompt) {
      requestBody.system = systemPrompt;
    }

    const body = JSON.stringify(requestBody);

    try {
      log.info(
        `[ZAI PROXY] Sending request to model: ${activeKey?.apiModel} via ${activeKey?.apiProvider}`,
      );
      log.info(`[ZAI PROXY] Request URL: ${apiUrl}`);
      log.info(`[ZAI PROXY] Request body: ${body.substring(0, 200)}...`);

      // Set timeout for the API call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      };
      
      if (activeKey?.apiKey) {
        headers['x-api-key'] = activeKey.apiKey;
      }
      
      const response = await fetch(apiUrl, {
        body,
        headers,
        method: 'POST',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        const errorMessage = `Z.ai Anthropic proxy API request failed with status ${response.status}: ${errorBody}`;
        log.error({ errorBody, status: response.status }, errorMessage);

        const errorType = this.getErrorType(response.status, errorBody);
        if (activeKey) {
          await LlmKeyManager.markKeyAsBad(
            activeKey.apiProvider,
            activeKey.apiKey,
            errorType,
          );
        }
        throw new LlmError(errorMessage);
      }

      const data = await response.json();

      // Handle Z.ai proxy response (Anthropic-style format)
      log.info({ response: data }, 'Z.ai Anthropic proxy response structure');

      let content: string | undefined;

      // Handle Anthropic-style response structure
      if (data.content && Array.isArray(data.content) && data.content.length > 0) {
        content = data.content[0]?.text;
      }
      // Handle error response
      else if (data.error && data.error.message) {
        log.error(
          { response: data },
          'Z.ai Anthropic proxy returned error response',
        );
        const errorType = this.getErrorType(
          response.status,
          JSON.stringify(data),
        );
        if (activeKey) {
          await LlmKeyManager.markKeyAsBad(
            activeKey.apiProvider,
            activeKey.apiKey,
            errorType,
          );
        }
        throw new LlmError(
          `Z.ai Anthropic proxy error: ${data.error.message}`,
        );
      }

      if (content === undefined || content === null || content === '') {
        log.error(
          { response: data },
          'Could not extract content from Z.ai Anthropic proxy response',
        );
        const errorType = this.getErrorType(
          response.status,
          JSON.stringify(data),
        );
        if (activeKey) {
          await LlmKeyManager.markKeyAsBad(
            activeKey.apiProvider,
            activeKey.apiKey,
            errorType,
          );
        }
        throw new LlmError(
          `Unable to extract content from Z.ai Anthropic proxy response. Response structure: ${JSON.stringify(data)}`,
        );
      }

      // Get token usage from Anthropic-style response
      const inputTokens = data.usage?.input_tokens || 0;
      const outputTokens = data.usage?.output_tokens || 0;
      const totalTokens = inputTokens + outputTokens;

      log.info(
        `[ZAI PROXY] Token usage - Input: ${inputTokens}, Output: ${outputTokens}, Total: ${totalTokens}`,
      );
      log.info(
        `[ZAI PROXY] Actual model used: ${data.model || 'unknown'}`,
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
          provider: 'zai-anthropic-proxy',
          actual_model: data.model || 'unknown',
        })
        .catch((_error: unknown) => {
          getLogger().error(
            { _error },
            'Failed to store session token stats in Redis',
          );
        });

      if (activeKey) {
        await LlmKeyManager.resetKeyStatus(
          activeKey.apiProvider,
          activeKey.apiKey,
        );
      }

      return content.trim();
    } catch (error) {
      if (error instanceof LlmError) {
        throw error;
      }

      const typedError = error as Error;
      log.error({ error: typedError }, 'Failed to get response from Z.ai Anthropic proxy API');

      if (activeKey) {
        let errorType = LlmKeyErrorType.TEMPORARY;
        if (typedError.message.includes('AbortError') || typedError.name === 'AbortError') {
          log.warn('Z.ai Anthropic proxy API request timed out');
        }

        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType,
        );
      }

      throw new LlmError('Failed to communicate with the Z.ai Anthropic proxy API.');
    }
  }
}