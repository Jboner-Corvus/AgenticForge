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
    let authToken: string;

    if (apiKey) {
      activeKey = {
        apiKey: apiKey,
        apiModel: modelName || getConfig().LLM_MODEL_NAME,
        apiProvider: 'zai',
        errorCount: 0,
        isPermanentlyDisabled: false,
      };
      authToken = apiKey;
    } else {
      activeKey = await LlmKeyManager.getNextAvailableKey('zai');
      authToken = getConfig().ANTHROPIC_AUTH_TOKEN || activeKey?.apiKey || '';
    }

    if (!activeKey && !authToken) {
      const errorMessage = 'No z.ai API key available.';
      log.error(errorMessage);
      throw new LlmError(errorMessage);
    }

    // Ensure we have a valid activeKey for API calls
    if (!activeKey && authToken) {
      activeKey = {
        apiKey: authToken,
        apiModel: modelName || getConfig().LLM_MODEL_NAME,
        apiProvider: 'zai',
        errorCount: 0,
        isPermanentlyDisabled: false,
      };
    }

    // Override the activeKey apiKey if we have environment auth token
    if (authToken && activeKey) {
      activeKey.apiKey = authToken;
    }

    // Use z.ai Anthropic-compatible endpoint for proxy
    const baseUrl = getConfig().ANTHROPIC_BASE_URL || 'https://api.z.ai/api/anthropic';
    const apiUrl = `${baseUrl}/v1/messages`;

    // Format messages for Claude API (Anthropic-compatible)
    const claudeMessages = messages.map((msg) => ({
      content: msg.parts.map((part) => part.text).join(''),
      role: msg.role === 'user' ? 'user' : 'assistant',
    }));

    // Anthropic Claude API format for Z.ai proxy
    const requestBody: any = {
      model: modelName || activeKey?.apiModel || 'claude-3-sonnet-20240229',
      messages: claudeMessages,
      max_tokens: 4000,
      temperature: 0.6,
    };

    // Add system prompt separately (Anthropic-style format)
    if (systemPrompt) {
      requestBody.system = systemPrompt;
    }

    const body = JSON.stringify(requestBody);

    try {
      log.info(
        `[LLM CALL] Sending request to model: ${activeKey?.apiModel} via ${activeKey?.apiProvider}`,
      );
      log.info(`[LLM CALL] Request URL: ${apiUrl}`);
      log.info(`[LLM CALL] Request body: ${body.substring(0, 200)}...`);

      // Set timeout for the API call - increased to 120 seconds for complex requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout

      const response = await fetch(apiUrl, {
        body,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': activeKey?.apiKey || '',
          'anthropic-version': '2023-06-01',
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

      // Handle Z.ai API response (OpenAI-style format)
      log.info({ response: data }, 'Z.ai API response structure');

      let content: string | undefined;

      // Handle Claude API response structure (Anthropic format)
      if (data.content && Array.isArray(data.content) && data.content.length > 0) {
        content = data.content[0]?.text;
      }
      // Handle OpenAI-style response structure (fallback)
      else if (data.choices && Array.isArray(data.choices) && data.choices.length > 0) {
        content = data.choices[0]?.message?.content;
      }
      // Handle direct text response
      else if (typeof data.text === 'string') {
        content = data.text;
      }
      // Handle error response
      else if (data.error && data.error.message) {
        log.error(
          { response: data },
          'Z.ai API returned error response',
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
          `Z.ai API error: ${data.error.message}`,
        );
      }
      // Handle empty array response (old issue)
      else if (Array.isArray(data) && data.length === 0) {
        log.error(
          { response: data },
          'Z.ai API returned empty array - endpoint may have changed',
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
          'Z.ai API returned empty response. The endpoint format may have changed.',
        );
      }

      if (content === undefined || content === null || content === '') {
        log.error(
          { response: data },
          'Could not extract content from Z.ai API response',
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
          `Unable to extract content from Z.ai API response. Response structure: ${JSON.stringify(data)}`,
        );
      }

      // Get token usage from OpenAI-style response
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
