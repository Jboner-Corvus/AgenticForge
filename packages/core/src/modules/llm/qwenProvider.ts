import { config } from '../../config.ts';
import { getLogger } from '../../logger.ts';
import { ILlmProvider } from '../../types.ts';
import { LlmError } from '../../utils/LlmError.ts';
import { getRedisClientInstance } from '../redis/redisClient.ts';
import { LLMContent } from './llm-types.ts';
import { LlmApiKey, LlmKeyErrorType, LlmKeyManager } from './LlmKeyManager.ts';

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
      _errorBody.includes('Incorrect API key') ||
      _errorBody.includes('invalid access token') ||
      _errorBody.includes('token expired')
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

    // Qwen Portal API endpoint (hardcoded as requested)
    const QWEN_API_BASE_URL = 'https://portal.qwen.ai/v1';
    const apiUrls = [
      activeKey.baseUrl ? `${activeKey.baseUrl}/chat/completions` : null,
      `${QWEN_API_BASE_URL}/chat/completions`, // Hardcoded endpoint as requested
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
      'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      'https://qwen.aliyuncs.com/v1/chat/completions',
    ].filter(Boolean) as string[];

    // Format messages for Qwen Portal API (OpenAI-compatible)
    const qwenMessages = messages.map((msg) => ({
      content: msg.parts.map((part) => part.text).join(''),
      role: msg.role === 'user' ? 'user' : 'assistant',
    }));

    if (systemPrompt) {
      qwenMessages.unshift({ content: systemPrompt, role: 'system' });
    }

    const requestBody = {
      max_tokens: 2000,
      messages: qwenMessages,
      model: modelName || activeKey.apiModel || 'qwen3-coder-plus',
    };

    const body = JSON.stringify(requestBody);

    // Improved retry logic with exponential backoff and endpoint fallback
    let lastError: Error | null = null;
    const MAX_RETRIES = 5; // Reduced from 8 for better performance
    const INITIAL_DELAY_MS = 1000;
    const MAX_DELAY_MS = 10000;

    // Try each API endpoint
    for (const apiUrl of apiUrls) {
      log.info(`Trying Qwen API endpoint: ${apiUrl}`);

      // Reset retry count for each endpoint
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          // Add exponential backoff delay (except for first attempt)
          if (attempt > 0) {
            const delayMs = Math.min(
              INITIAL_DELAY_MS * Math.pow(2, attempt - 1),
              MAX_DELAY_MS,
            );
            log.info(
              `Adding delay of ${delayMs}ms before Qwen API call (attempt ${attempt + 1}/${MAX_RETRIES})`,
            );
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }

          log.info(
            `[LLM CALL] Sending request to model: ${
              activeKey!.apiModel
            } via ${activeKey!.apiProvider} at ${apiUrl} (attempt ${attempt + 1}/${MAX_RETRIES})`,
          );

          // Use AbortSignal with shorter timeout for better responsiveness
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

          const response = await fetch(apiUrl, {
            body,
            headers: {
              Authorization: `Bearer ${activeKey!.apiKey}`,
              'Content-Type': 'application/json',
            },
            method: 'POST',
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorBody = await response.text();
            const errorMessage = `Qwen API request failed with status ${response.status}: ${errorBody}`;
            log.error({ errorBody, status: response.status }, errorMessage);

            // Check if it's a permanent error
            const errorType = this.getErrorType(response.status, errorBody);
            if (errorType === LlmKeyErrorType.PERMANENT) {
              // For permanent errors, mark key as bad and try next endpoint
              await LlmKeyManager.markKeyAsBad(
                activeKey!.apiProvider,
                activeKey!.apiKey,
                errorType,
              );
              throw new LlmError(errorMessage);
            } else if (attempt < MAX_RETRIES - 1) {
              // For temporary errors, retry
              lastError = new LlmError(errorMessage);
              log.warn(
                `Temporary error encountered. Retrying... (attempt ${attempt + 1}/${MAX_RETRIES})`,
              );
              continue;
            } else {
              // Last attempt, mark key as bad
              await LlmKeyManager.markKeyAsBad(
                activeKey!.apiProvider,
                activeKey!.apiKey,
                errorType,
              );
              throw new LlmError(errorMessage);
            }
          }

          const data = await response.json();

          const content = data.choices?.[0]?.message?.content;
          if (content === undefined || content === null) {
            log.error(
              { response: data },
              'Invalid response structure from Qwen API',
            );
            const errorType = this.getErrorType(
              response.status,
              JSON.stringify(data),
            );
            // Check if it's a temporary error
            if (attempt < MAX_RETRIES - 1) {
              lastError = new LlmError(
                'Invalid response structure from Qwen API. The model may have returned an empty response.',
              );
              log.warn(
                `Temporary error encountered. Retrying... (attempt ${attempt + 1}/${MAX_RETRIES})`,
              );
              continue;
            } else {
              await LlmKeyManager.markKeyAsBad(
                activeKey!.apiProvider,
                activeKey!.apiKey,
                errorType,
              );
              throw new LlmError(
                'Invalid response structure from Qwen API. The model may have returned an empty response.',
              );
            }
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
            // If it's an LLM error and not the last attempt, continue
            if (attempt < MAX_RETRIES - 1) {
              lastError = error;
              log.warn(
                `LLM error encountered. Retrying... (attempt ${attempt + 1}/${MAX_RETRIES})`,
              );
              continue;
            } else {
              // Last attempt, propagate the error
              throw error;
            }
          }

          log.error({ error }, 'Failed to get response from LLM');
          lastError = error instanceof Error ? error : new Error(String(error));

          // If not the last attempt, continue
          if (attempt < MAX_RETRIES - 1) {
            log.warn(
              `Network error encountered. Retrying... (attempt ${attempt + 1}/${MAX_RETRIES})`,
            );
            continue;
          }
        }
      }

      // If we get here, all retries for this endpoint failed
      log.warn(`All retries failed for endpoint: ${apiUrl}`);
    }

    // If we get here, all endpoints failed
    if (lastError) {
      if (activeKey) {
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          LlmKeyErrorType.TEMPORARY,
        );
      }
      throw new LlmError(
        `Failed to communicate with the LLM after trying all endpoints. Last error: ${lastError.message}`,
      );
    }

    // Default case (should not happen)
    throw new LlmError('Failed to communicate with the LLM.');
  }
}
