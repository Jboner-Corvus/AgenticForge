import { getLogger } from '../../logger.js';
import { getRedisClientInstance } from '../redis/redisClient.js';

export enum LlmKeyErrorType {
  PERMANENT = 'permanent',
  TEMPORARY = 'temporary',
}

export interface LlmApiKey {
  apiKey: string;
  apiModel: string;
  apiProvider: string;
  errorCount: number;
  isDisabledUntil?: number;
  isPermanentlyDisabled?: boolean;
  lastUsed?: number;
}

const LLM_API_KEYS_REDIS_KEY = 'llmApiKeys';
const MAX_TEMPORARY_ERROR_COUNT = 3; // Max consecutive temporary errors before disabling key temporarily
const TEMPORARY_DISABLE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export class LlmKeyManager {
  public static async addKey(
    apiProvider: string,
    apiKey: string,
    apiModel: string,
  ): Promise<void> {
    const keys = await this.getKeys();
    keys.push({ apiKey, apiModel, apiProvider, errorCount: 0 });
    await this.saveKeys(keys);
    getLogger().info({ apiKey, apiModel, apiProvider }, 'LLM API key added.');
  }

  public static async getKeysForApi(): Promise<LlmApiKey[]> {
    return await this.getKeys();
  }

  public static async getNextAvailableKey(
    providerName?: string,
    modelName?: string,
  ): Promise<LlmApiKey | null> {
    const keys = await this.getKeys();
    const now = Date.now();

    // Filter out temporarily and permanently disabled keys and sort by lastUsed (oldest first)
    const availableKeys = keys
      .filter(
        (key) =>
          (!providerName || key.apiProvider === providerName) && // Filter by providerName
          (!modelName || key.apiModel === modelName) && // Filter by modelName
          !key.isPermanentlyDisabled &&
          (!key.isDisabledUntil || key.isDisabledUntil <= now),
      )
      .sort((a, b) => (a.lastUsed || 0) - (b.lastUsed || 0));

    if (availableKeys.length === 0) {
      getLogger().warn('No available LLM API keys.');
      return null;
    }

    const nextKey = availableKeys[0];
    // Update lastUsed timestamp for the selected key
    nextKey.lastUsed = now;
    await this.saveKeys(keys); // Save all keys to persist lastUsed update

    getLogger().debug(
      { provider: nextKey.apiProvider },
      'Returning next available LLM API key.',
    );
    return nextKey;
  }

  public static async hasAvailableKeys(providerName: string): Promise<boolean> {
    const keys = await this.getKeys();
    const now = Date.now();

    const availableKeysForProvider = keys.filter(
      (key) =>
        key.apiProvider === providerName &&
        !key.isPermanentlyDisabled &&
        (!key.isDisabledUntil || key.isDisabledUntil <= now),
    );
    return availableKeysForProvider.length > 0;
  }

  public static async markKeyAsBad(
    provider: string,
    key: string,
    errorType: LlmKeyErrorType,
  ): Promise<void> {
    const keys = await this.getKeys();
    const keyIndex = keys.findIndex(
      (k) => k.apiProvider === provider && k.apiKey === key,
    );

    if (keyIndex !== -1) {
      const badKey = keys[keyIndex];

      if (errorType === LlmKeyErrorType.PERMANENT) {
        badKey.isPermanentlyDisabled = true;
        badKey.errorCount = 0; // Reset error count for permanent disable
        badKey.isDisabledUntil = undefined; // Clear temporary disable
        getLogger().error(
          { provider: badKey.apiProvider },
          'LLM API key permanently disabled.',
        );
      } else {
        // LlmKeyErrorType.TEMPORARY
        badKey.errorCount = (badKey.errorCount || 0) + 1;
        badKey.lastUsed = Date.now(); // Mark as recently used to push it to the end of the queue

        if (badKey.errorCount >= MAX_TEMPORARY_ERROR_COUNT) {
          badKey.isDisabledUntil = Date.now() + TEMPORARY_DISABLE_DURATION_MS;
          badKey.errorCount = 0; // Reset error count after temporary disabling
          getLogger().warn(
            { provider: badKey.apiProvider },
            `LLM API key temporarily disabled for ${
              TEMPORARY_DISABLE_DURATION_MS / 1000
            } seconds due to multiple temporary errors.`,
          );
        } else {
          getLogger().warn(
            { errorCount: badKey.errorCount, provider: badKey.apiProvider },
            'LLM API key temporary error count incremented.',
          );
        }
      }
      await this.saveKeys(keys);
    }
  }

  public static async removeKey(index: number): Promise<void> {
    const keys = await this.getKeys();
    if (index < 0 || index >= keys.length) {
      throw new Error('Index out of bounds');
    }
    const removedKey = keys.splice(index, 1);
    await this.saveKeys(keys);
    getLogger().info(
      { provider: removedKey[0].apiProvider },
      'LLM API key removed.',
    );
  }

  public static async resetKeyStatus(
    provider: string,
    key: string,
  ): Promise<void> {
    const keys = await this.getKeys();
    const keyIndex = keys.findIndex(
      (k) => k.apiProvider === provider && k.apiKey === key,
    );

    if (keyIndex !== -1) {
      const goodKey = keys[keyIndex];
      goodKey.errorCount = 0;
      goodKey.isDisabledUntil = undefined;
      goodKey.isPermanentlyDisabled = false; // Clear permanent disable flag
      getLogger().info(
        { provider: goodKey.apiProvider },
        'LLM API key status reset.',
      );
      await this.saveKeys(keys);
    }
  }

  private static async getKeys(): Promise<LlmApiKey[]> {
    const keysJson = await getRedisClientInstance().lrange(
      LLM_API_KEYS_REDIS_KEY,
      0,
      -1,
    );
    return keysJson.map((key: string) => JSON.parse(key));
  }

  private static async saveKeys(keys: LlmApiKey[]): Promise<void> {
    await getRedisClientInstance().del(LLM_API_KEYS_REDIS_KEY);
    if (keys.length > 0) {
      await getRedisClientInstance().rpush(
        LLM_API_KEYS_REDIS_KEY,
        ...keys.map((key) => JSON.stringify(key)),
      );
    }
  }
}
