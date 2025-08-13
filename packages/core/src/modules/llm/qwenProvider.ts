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

    // Qwen Portal API endpoint
    const apiUrl = activeKey.baseUrl ? `${activeKey.baseUrl}/chat/completions` : 'https://portal.qwen.ai/v1/chat/completions';

    // Format messages for Qwen Portal API (OpenAI-compatible)
    const qwenMessages = messages.map((msg) => ({
      content: msg.parts.map((part) => part.text).join(''),
      role: msg.role === 'user' ? 'user' : 'assistant',
    }));

    if (systemPrompt) {
      qwenMessages.unshift({ content: systemPrompt, role: 'system' });
    }

    const requestBody = {
      model: modelName || activeKey.apiModel || 'qwen3-coder-plus',
      messages: qwenMessages,
      max_tokens: 2000,
    };

    const body = JSON.stringify(requestBody);

    // Implémentation d'une logique de retry avec délais progressifs pour les erreurs temporaires
    let lastError: Error | null = null;
    const MAX_RETRIES = 8;
    const INITIAL_RETRIES_WITHOUT_DELAY = 4;
    
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        // Add a delay before making the LLM request (sauf pour les premières tentatives)
        if (attempt > 0) {
          // Pas de délai pour les 4 premières tentatives, puis délai progressif
          if (attempt >= INITIAL_RETRIES_WITHOUT_DELAY) {
            // Calcul du délai : 2 secondes de base + 1 seconde supplémentaire par tentative au-delà de 4
            const delayMs = 2000 + (attempt - INITIAL_RETRIES_WITHOUT_DELAY) * 1000;
            log.info(`Adding delay of ${delayMs}ms before Qwen API call (attempt ${attempt + 1})`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
        } else {
          // Délai standard pour la première tentative
          await new Promise((resolve) =>
            setTimeout(resolve, config.LLM_REQUEST_DELAY_MS),
          );
        }

        log.info(
          `[LLM CALL] Sending request to model: ${
            activeKey!.apiModel
          } via ${activeKey!.apiProvider} (attempt ${attempt + 1}/${MAX_RETRIES})`,
        );
        const response = await fetch(apiUrl, {
          body,
          headers: {
            Authorization: `Bearer ${activeKey!.apiKey}`,
            'Content-Type': 'application/json',
          },
          method: 'POST',
          signal: AbortSignal.timeout(40000), // 40 second timeout
        });

        if (!response.ok) {
          const errorBody = await response.text();
          const errorMessage = `Qwen API request failed with status ${response.status}: ${errorBody}`;
          log.error({ errorBody, status: response.status }, errorMessage);
          
          // Vérifier si c'est une erreur temporaire (502, 504, etc.)
          const errorType = this.getErrorType(response.status, errorBody);
          if (errorType === LlmKeyErrorType.TEMPORARY && attempt < MAX_RETRIES - 1) {
            // Pour les erreurs temporaires, on réessaie jusqu'au max de tentatives
            lastError = new LlmError(errorMessage);
            log.warn(`Temporary error encountered. Retrying... (attempt ${attempt + 1}/${MAX_RETRIES})`);
            continue; // Réessayer
          } else {
            // Pour les erreurs permanentes ou si on a atteint le max de tentatives, on marque la clé comme mauvaise
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
          // Vérifier si c'est une erreur temporaire
          if (errorType === LlmKeyErrorType.TEMPORARY && attempt < MAX_RETRIES - 1) {
            lastError = new LlmError(
              'Invalid response structure from Qwen API. The model may have returned an empty response.',
            );
            log.warn(`Temporary error encountered. Retrying... (attempt ${attempt + 1}/${MAX_RETRIES})`);
            continue; // Réessayer
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
          // Si c'est une erreur LLM et que ce n'est pas la dernière tentative, on continue
          if (attempt < MAX_RETRIES - 1) {
            lastError = error;
            log.warn(`LLM error encountered. Retrying... (attempt ${attempt + 1}/${MAX_RETRIES})`);
            continue;
          } else {
            // Dernière tentative, on propage l'erreur
            throw error;
          }
        }
        
        log.error({ error }, 'Failed to get response from LLM');
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Si ce n'est pas la dernière tentative, on continue
        if (attempt < MAX_RETRIES - 1) {
          log.warn(`Network error encountered. Retrying... (attempt ${attempt + 1}/${MAX_RETRIES})`);
          continue;
        }
      }
    }
    
    // Si on arrive ici, c'est que toutes les tentatives ont échoué
    if (lastError) {
      if (activeKey) {
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          LlmKeyErrorType.TEMPORARY,
        );
      }
      throw new LlmError(`Failed to communicate with the LLM after ${MAX_RETRIES} attempts. Last error: ${lastError.message}`);
    }
    
    // Cas par défaut (ne devrait pas arriver)
    throw new LlmError('Failed to communicate with the LLM.');
  }
}