import { config } from '../../config.ts'; // Import config to access environment variables
import { getLogger } from '../../logger.ts';
import { getRedisClientInstance } from '../redis/redisClient.ts';
// Import LLM module for testing keys (assumed to exist)
// import { LlmModule } from '../llm/llmModule.ts'; // We'll use a minimal test instead

export type LlmKeyErrorType = 'permanent' | 'temporary';

export const LlmKeyErrorType = {
  PERMANENT: 'permanent' as const,
  TEMPORARY: 'temporary' as const,
};

export interface LlmApiKey {
  apiKey: string;
  apiModel: string;
  apiProvider: string;
  baseUrl?: string;
  errorCount: number;
  isDisabledUntil?: number;
  isPermanentlyDisabled?: boolean;
  lastUsed?: number;
  priority?: number; // Add priority field
  lastError?: string; // Add lastError field
  temporaryDisabledUntil?: number; // Add temporaryDisabledUntil field for backward compatibility
}

// Constants for the master key from environment
// Using a specific env var allows overriding the default LLM_API_KEY if needed
const MASTER_LLM_API_KEY_ENV_VAR = 'MASTER_LLM_API_KEY';
const DEFAULT_MASTER_KEY_PROVIDER = 'gemini'; // Align with .env LLM_PROVIDER=gemini
const DEFAULT_MASTER_KEY_MODEL = 'gemini-2.5-pro'; // Align with .env LLM_MODEL_NAME=gemini-2.5-pro

const LLM_API_KEYS_REDIS_KEY = 'llmApiKeys';
const LLM_API_KEYS_HIERARCHY_REDIS_KEY = 'llmApiKeysHierarchy'; // New key for hierarchy
const MAX_TEMPORARY_ERROR_COUNT = 5; // More reasonable threshold for temporary errors
const TEMPORARY_DISABLE_DURATION_MS = 30 * 1000; // Réduire la durée de désactivation à 30 secondes

export class LlmKeyManager {
  private static apiKeys: Map<string, LlmApiKey[]> = new Map();
  private static lastUsedIndex: Map<string, number> = new Map();

  // Helper method to populate the apiKeys map from Redis data
  private static populateApiKeysMap(keys: LlmApiKey[]): void {
    // Clear the existing map
    this.apiKeys.clear();

    // Group keys by provider
    keys.forEach((key) => {
      if (!this.apiKeys.has(key.apiProvider)) {
        this.apiKeys.set(key.apiProvider, []);
      }
      this.apiKeys.get(key.apiProvider)!.push(key);
    });
  }

  /**
   * Synchronize with LLM Router when keys are modified
   */
  private static async syncWithRouter(): Promise<void> {
    try {
      const { llmRouterService } = await import('./LlmRouterService.js');
      await llmRouterService.syncWithKeyManager();
    } catch (error) {
      // Router service might not be available during initialization
      getLogger().debug('Router sync skipped during key management operation');
    }
  }

  public static async addKey(
    apiProvider: string,
    apiKey: string,
    apiModel: string,
    baseUrl?: string,
  ): Promise<void> {
    const keys = await this.getKeys();

    // 🚨 DUPLICATE CHECKING
    // Check if key already exists (same provider + key + model)
    const existingKeyIndex = keys.findIndex(
      (k) =>
        k.apiProvider === apiProvider &&
        k.apiKey === apiKey &&
        k.apiModel === apiModel &&
        (k.baseUrl || '') === (baseUrl || ''),
    );

    if (existingKeyIndex !== -1) {
      getLogger().warn(
        {
          apiKey: apiKey.substring(0, 10) + '...',
          apiModel,
          apiProvider,
          baseUrl,
        },
        'LLM API key already exists - updating existing entry instead of creating duplicate.',
      );

      // Update existing key instead of creating duplicate
      const existingKey = keys[existingKeyIndex];
      existingKey.baseUrl = baseUrl;
      // Reset error counters if key is re-added
      existingKey.errorCount = 0;
      existingKey.isPermanentlyDisabled = false;
      existingKey.isDisabledUntil = undefined;

      await this.saveKeys(keys);
      // Update the apiKeys map
      this.populateApiKeysMap(keys);
      getLogger().info(
        {
          apiKey: apiKey.substring(0, 10) + '...',
          apiModel,
          apiProvider,
          baseUrl,
        },
        'LLM API key updated (duplicate avoided).',
      );
      return;
    }

    // If no duplicate, add new key
    keys.push({ apiKey, apiModel, apiProvider, baseUrl, errorCount: 0 });
    await this.saveKeys(keys);
    // Update the apiKeys map
    this.populateApiKeysMap(keys);

    // Increment the apiKeysAdded stat in Redis
    try {
      const redisClient = getRedisClientInstance();
      await redisClient.incr('leaderboard:apiKeysAdded');
    } catch (error) {
      getLogger().error(
        {
          apiKey: apiKey.substring(0, 10) + '...',
          apiModel,
          apiProvider,
          baseUrl,
          error,
        },
        'Failed to increment apiKeysAdded in Redis',
      );
    }

    getLogger().info(
      {
        apiKey: apiKey.substring(0, 10) + '...',
        apiModel,
        apiProvider,
        baseUrl,
      },
      'LLM API key added.',
    );
  }

  /**
   * Supprime automatiquement les doublons des clés LLM existantes.
   * Cette méthode doit être appelée au démarrage du serveur.
   */
  public static async deduplicateKeys(): Promise<{
    duplicatesRemoved: number;
    originalCount: number;
    uniqueCount: number;
  }> {
    const keys = await this.getKeys();
    const originalCount = keys.length;

    if (originalCount === 0) {
      return { duplicatesRemoved: 0, originalCount: 0, uniqueCount: 0 };
    }

    // Utiliser un Map pour garder seulement la première occurrence de chaque clé unique
    const uniqueKeysMap = new Map<string, LlmApiKey>();
    const seenKeys = new Set<string>();

    for (const key of keys) {
      // Créer un identifiant unique basé sur provider + clé + modèle + baseUrl
      const keyIdentifier = `${key.apiProvider}|${key.apiKey}|${key.apiModel}|${key.baseUrl || ''}`;

      if (!seenKeys.has(keyIdentifier)) {
        seenKeys.add(keyIdentifier);
        uniqueKeysMap.set(keyIdentifier, key);
        getLogger().debug(
          {
            keyPrefix: key.apiKey.substring(0, 10) + '...',
            model: key.apiModel,
            provider: key.apiProvider,
          },
          'Clé LLM unique conservée',
        );
      } else {
        getLogger().warn(
          {
            keyPrefix: key.apiKey.substring(0, 10) + '...',
            model: key.apiModel,
            provider: key.apiProvider,
          },
          'Doublon de clé LLM supprimé',
        );
      }
    }

    const uniqueKeys = Array.from(uniqueKeysMap.values());
    const uniqueCount = uniqueKeys.length;
    const duplicatesRemoved = originalCount - uniqueCount;

    // Sauvegarder seulement si des doublons ont été trouvés
    if (duplicatesRemoved > 0) {
      await this.saveKeys(uniqueKeys);
      getLogger().info(
        {
          duplicatesRemoved,
          originalCount,
          uniqueCount,
        },
        '🧹 Dédoublonnage automatique des clés LLM terminé',
      );
    } else {
      getLogger().debug('Aucun doublon de clé LLM trouvé');
    }

    return { duplicatesRemoved, originalCount, uniqueCount };
  }

  // New methods for key hierarchy management
  public static async getKeyHierarchy(): Promise<{ [key: string]: number }> {
    try {
      const hierarchyJson = await getRedisClientInstance().get(
        LLM_API_KEYS_HIERARCHY_REDIS_KEY,
      );
      return hierarchyJson ? JSON.parse(hierarchyJson) : {};
    } catch (error) {
      getLogger().error({ error }, 'Failed to get key hierarchy from Redis');
      return {};
    }
  }

  public static async getKeysForApi(): Promise<LlmApiKey[]> {
    return await this.getKeys();
  }

  /**
   * Gets the next available API key for a provider.
   * @param provider The LLM provider.
   * @returns A promise that resolves to the next available API key, or null if none are available.
   */
  public static async getNextAvailableKey(
    provider: string,
  ): Promise<LlmApiKey | null> {
    const log = getLogger().child({ module: 'LlmKeyManager' });

    // Helper function to display user-friendly provider name in logs
    const getDisplayProvider = (prov: string) => prov === 'openrouter-sky' ? 'openrouter' : prov;

    try {
      // First, ensure we have the latest keys from Redis with fallback
      const keys = await this.getKeysWithFallback(provider);
      this.populateApiKeysMap(keys);

      const providerKeys = this.apiKeys.get(provider) || [];

      if (providerKeys.length === 0) {
        log.warn(`No API keys configured for provider: ${getDisplayProvider(provider)}`);
        // Try fallback to environment variable
        return this.getEnvironmentFallbackKey(provider);
      }
    } catch (error) {
      log.error(
        { error, provider },
        'Error getting keys from Redis, trying fallback',
      );
      return this.getEnvironmentFallbackKey(provider);
    }

    // Auto-cleanup if all keys are failing
    const providerKeys = this.apiKeys.get(provider) || [];
    const workingKeys = providerKeys.filter((key) => {
      if (key.isPermanentlyDisabled) return false;
      if (key.temporaryDisabledUntil && Date.now() < key.temporaryDisabledUntil)
        return false;
      return key.errorCount < MAX_TEMPORARY_ERROR_COUNT;
    });

    // If no working keys, try cleanup and retry once
    if (workingKeys.length === 0 && providerKeys.length > 0) {
      log.warn({ provider: getDisplayProvider(provider) }, 'No working keys found, attempting cleanup');
      const cleanupResult = await this.cleanupFailedKeys(provider);

      if (cleanupResult.cleaned > 0) {
        // Refresh keys after cleanup
        const refreshedKeys = await this.getKeys();
        this.populateApiKeysMap(refreshedKeys);
        const refreshedProviderKeys = this.apiKeys.get(provider) || [];

        const newWorkingKeys = refreshedProviderKeys.filter((key) => {
          if (key.isPermanentlyDisabled) return false;
          if (
            key.temporaryDisabledUntil &&
            Date.now() < key.temporaryDisabledUntil
          )
            return false;
          return key.errorCount < MAX_TEMPORARY_ERROR_COUNT;
        });

        if (newWorkingKeys.length > 0) {
          log.info(
            { provider: getDisplayProvider(provider), cleanedCount: cleanupResult.cleaned },
            'Keys recovered after cleanup',
          );
          // Continue with the cleaned keys - simple round-robin selection
          const selectedIndex = this.lastUsedIndex?.get(provider) ?? -1;
          const nextIndex = (selectedIndex + 1) % newWorkingKeys.length;
          this.lastUsedIndex?.set(provider, nextIndex);
          const selectedKey = newWorkingKeys[nextIndex];
          log.info(
            `Selected API key ${selectedKey.apiKey.substring(0, 8)}... for provider ${provider}`,
          );
          return selectedKey;
        }
      }

      // Still no working keys, try environment fallback
      log.warn(
        { provider: getDisplayProvider(provider) },
        'No working keys after cleanup, using environment fallback',
      );
      return this.getEnvironmentFallbackKey(provider);
    }

    // Use the working keys we calculated above, or filter normally if we have working keys
    let availableKeys = workingKeys;

    if (availableKeys.length === 0) {
      // Filter out permanently disabled keys and temporarily disabled keys
      availableKeys = providerKeys.filter((key) => {
        // If permanently disabled, exclude
        if (key.isPermanentlyDisabled) {
          return false;
        }

        // If temporarily disabled, check if the disable period has expired
        if (key.isDisabledUntil && Date.now() < key.isDisabledUntil) {
          log.debug(
            `Key ${key.apiKey.substring(0, 8)}... is temporarily disabled until ${new Date(key.isDisabledUntil).toISOString()}`,
          );
          return false;
        }

        // Check for temporary disable based on temporaryDisabledUntil
        if (
          key.temporaryDisabledUntil &&
          Date.now() < key.temporaryDisabledUntil
        ) {
          log.debug(
            `Key ${key.apiKey.substring(0, 8)}... is temporarily disabled until ${new Date(key.temporaryDisabledUntil).toISOString()}`,
          );
          return false;
        }

        // Key is available
        return true;
      });
    }

    if (availableKeys.length === 0) {
      log.warn(`No available API keys for provider: ${provider}`);
      // Check if any keys are temporarily disabled and will be available soon
      const soonestAvailable = providerKeys
        .filter((key) => key.isDisabledUntil && !key.isPermanentlyDisabled)
        .sort((a, b) => (a.isDisabledUntil || 0) - (b.isDisabledUntil || 0))[0];

      if (soonestAvailable) {
        const timeUntilAvailable =
          (soonestAvailable.isDisabledUntil || 0) - Date.now();
        log.info(
          `Next key will be available in ${Math.ceil(timeUntilAvailable / 1000)} seconds`,
        );
      }

      return null;
    }

    // Simple round-robin selection
    const selectedIndex = this.lastUsedIndex?.get(provider) ?? -1;
    const nextIndex = (selectedIndex + 1) % availableKeys.length;
    this.lastUsedIndex?.set(provider, nextIndex);

    const selectedKey = availableKeys[nextIndex];
    log.info(
      `Selected API key ${selectedKey.apiKey.substring(0, 8)}... for provider ${getDisplayProvider(provider)}`,
    );

    return selectedKey;
  }

  public static async hasAvailableKeys(providerName: string): Promise<boolean> {
    try {
      const keys = await this.getKeysWithFallback(providerName);
      const now = Date.now();

      const availableKeysForProvider = keys.filter(
        (key) =>
          key.apiProvider === providerName &&
          !key.isPermanentlyDisabled &&
          (!key.isDisabledUntil || key.isDisabledUntil <= now) &&
          (!key.temporaryDisabledUntil || key.temporaryDisabledUntil <= now),
      );

      // If no keys in Redis, try environment fallback
      if (availableKeysForProvider.length === 0) {
        const envKey = this.getEnvironmentFallbackKey(providerName);
        return envKey !== null;
      }

      return availableKeysForProvider.length > 0;
    } catch (error) {
      // Fallback to environment key if Redis fails
      const envKey = this.getEnvironmentFallbackKey(providerName);
      return envKey !== null;
    }
  }

  /**
   * Cleans up and resets failed keys that might be recoverable
   */
  public static async cleanupFailedKeys(provider?: string): Promise<{
    cleaned: number;
    total: number;
  }> {
    const log = getLogger().child({ module: 'LlmKeyManager' });

    try {
      const keys = await this.getKeys();
      let cleanedCount = 0;
      const currentTime = Date.now();

      const cleanedKeys = keys.map((key) => {
        // Clean keys for specific provider or all providers
        if (provider && key.apiProvider !== provider) {
          return key;
        }

        // Reset temporarily disabled keys after cooldown period
        if (
          key.temporaryDisabledUntil &&
          currentTime > key.temporaryDisabledUntil
        ) {
          log.info(
            {
              provider: key.apiProvider,
              keyPreview: key.apiKey.substring(0, 12) + '...',
            },
            'Re-enabling temporarily disabled key',
          );
          cleanedCount++;
          return {
            ...key,
            errorCount: 0,
            temporaryDisabledUntil: undefined,
            lastError: undefined,
            isPermanentlyDisabled: false,
          };
        }

        // Reset keys with high error count but not permanently disabled
        if (
          key.errorCount >= MAX_TEMPORARY_ERROR_COUNT &&
          !key.isPermanentlyDisabled
        ) {
          // Only reset if it's been a while since last error
          const lastUsed = key.lastUsed || 0;
          const timeSinceLastUse = currentTime - lastUsed;

          if (timeSinceLastUse > TEMPORARY_DISABLE_DURATION_MS * 2) {
            log.info(
              {
                provider: key.apiProvider,
                keyPreview: key.apiKey.substring(0, 12) + '...',
                oldErrorCount: key.errorCount,
              },
              'Resetting high-error-count key after cooldown',
            );
            cleanedCount++;
            return {
              ...key,
              errorCount: 0,
              temporaryDisabledUntil: undefined,
              lastError: undefined,
            };
          }
        }

        return key;
      });

      if (cleanedCount > 0) {
        await this.saveKeys(cleanedKeys);
        log.info(
          { cleanedCount, total: keys.length },
          'Cleaned up failed keys',
        );
      }

      return { cleaned: cleanedCount, total: keys.length };
    } catch (error) {
      log.error({ error, provider }, 'Failed to cleanup keys');
      return { cleaned: 0, total: 0 };
    }
  }

  /**
   * Marks an API key as bad based on the error type.
   * @param provider The LLM provider.
   * @param apiKey The API key to mark.
   * @param errorType The type of error encountered.
   */
  public static async markKeyAsBad(
    provider: string,
    apiKey: string,
    errorType: LlmKeyErrorType,
  ): Promise<void> {
    const log = getLogger().child({ module: 'LlmKeyManager' });

    // First, ensure we have the latest keys from Redis
    const keys = await this.getKeys();
    this.populateApiKeysMap(keys);

    const keysForProvider = this.apiKeys.get(provider) || [];
    const keyObj = keysForProvider.find((k) => k.apiKey === apiKey);

    if (!keyObj) {
      log.warn(
        `Attempted to mark non-existent key as bad: ${apiKey} for provider ${provider}`,
      );
      return;
    }

    keyObj.errorCount++;
    log.info(
      `Key ${apiKey.substring(0, 8)}... error count incremented to ${keyObj.errorCount}`,
    );

    // For permanent errors, disable permanently
    if (errorType === LlmKeyErrorType.PERMANENT) {
      log.warn(
        `Permanently disabling key ${apiKey.substring(0, 8)}... due to permanent error`,
      );
      keyObj.isPermanentlyDisabled = true;
    }
    // For temporary errors (including quota exceeded), implement exponential backoff
    else {
      // For quota exceeded errors, use a longer backoff time
      let backoffTime: number;
      if (
        keyObj.lastError?.includes('quota') ||
        keyObj.lastError?.includes('limit') ||
        keyObj.lastError?.includes('exceeded')
      ) {
        log.warn(
          `Quota exceeded for key ${apiKey.substring(0, 8)}..., temporarily disabling for 2 minutes`,
        );
        backoffTime = 2 * 60 * 1000; // 2 minutes for quota errors
      } else {
        backoffTime = Math.min(1000 * Math.pow(2, keyObj.errorCount), 60000); // Max 1 minute for other temporary errors
      }
      keyObj.isDisabledUntil = Date.now() + backoffTime;
      log.info(
        `Temporarily disabling key ${apiKey.substring(0, 8)}... for ${backoffTime}ms due to temporary error`,
      );
    }

    // Update the last error
    keyObj.lastError = `Error count: ${keyObj.errorCount}, Type: ${errorType}`;

    // Save the updated keys and repopulate the map
    await this.saveKeys(keys);
    this.populateApiKeysMap(keys);
  }

  public static async removeKey(index: number): Promise<void> {
    const keys = await this.getKeys();
    if (index < 0 || index >= keys.length) {
      throw new Error('Index out of bounds');
    }
    const removedKey = keys.splice(index, 1);
    await this.saveKeys(keys);
    // Update the apiKeys map
    this.populateApiKeysMap(keys);
    getLogger().info(
      { provider: removedKey[0].apiProvider },
      'LLM API key removed.',
    );
  }

  public static async resetKeyStatus(
    provider: string,
    key: string,
  ): Promise<void> {
    // First, ensure we have the latest keys from Redis
    const keys = await this.getKeys();
    this.populateApiKeysMap(keys);

    const keysForProvider = this.apiKeys.get(provider) || [];
    const keyIndex = keysForProvider.findIndex((k) => k.apiKey === key);

    if (keyIndex !== -1) {
      const goodKey = keysForProvider[keyIndex];
      goodKey.errorCount = 0;
      goodKey.isDisabledUntil = undefined;
      goodKey.isPermanentlyDisabled = false; // Clear permanent disable flag
      goodKey.lastUsed = Date.now(); // Update last used time
      getLogger().info(
        { apiKey: key.substring(0, 10) + '...', provider: goodKey.apiProvider },
        'LLM API key status reset.',
      );
      await this.saveKeys(keys);
      // Update the apiKeys map
      this.populateApiKeysMap(keys);
    }
  }

  public static async saveKeys(keys: LlmApiKey[]): Promise<void> {
    await getRedisClientInstance().del(LLM_API_KEYS_REDIS_KEY);
    if (keys.length > 0) {
      await getRedisClientInstance().rpush(
        LLM_API_KEYS_REDIS_KEY,
        ...keys.map((key) => JSON.stringify(key)),
      );
    }
  }

  public static async setKeyHierarchy(hierarchy: {
    [key: string]: number;
  }): Promise<void> {
    try {
      await getRedisClientInstance().set(
        LLM_API_KEYS_HIERARCHY_REDIS_KEY,
        JSON.stringify(hierarchy),
      );
      getLogger().info('Key hierarchy saved to Redis');
    } catch (error) {
      getLogger().error({ error }, 'Failed to save key hierarchy to Redis');
    }
  }

  /**
   * Synchronise la clé API maîtresse définie dans les variables d'environnement.
   * Cette clé est ajoutée ou mise à jour en tête de la liste pour assurer sa priorité.
   * Elle sert de solution de secours automatique si aucune autre clé n'est disponible.
   *
   * @returns Un objet indiquant si la clé a été ajoutée, mise à jour ou ignorée.
   */
  public static async syncEnvMasterKey(): Promise<{
    action: 'added' | 'error' | 'ignored' | 'updated';
    message: string;
  }> {
    const logger = getLogger();

    // 1. Récupérer la clé depuis les variables d'environnement
    // Priorité: MASTER_LLM_API_KEY > LLM_API_KEY
    let masterApiKey = process.env[MASTER_LLM_API_KEY_ENV_VAR];
    if (!masterApiKey) {
      masterApiKey = config.LLM_API_KEY; // Assuming config.LLM_API_KEY reads from LLM_API_KEY env var
    }

    if (!masterApiKey || masterApiKey.trim() === '') {
      const msg = `Aucune clé API maîtresse trouvée dans '${MASTER_LLM_API_KEY_ENV_VAR}' ou 'LLM_API_KEY'. La synchronisation est ignorée.`;
      logger.info(msg);
      return { action: 'ignored', message: msg };
    }

    // 2. Définir les propriétés par défaut pour la clé maîtresse
    const masterKeyData: LlmApiKey = {
      apiKey: masterApiKey.trim(),
      apiModel: DEFAULT_MASTER_KEY_MODEL,
      apiProvider: DEFAULT_MASTER_KEY_PROVIDER,
      errorCount: 0,
      // Note: lastUsed is intentionally left undefined or will be updated to make it 'recent'
    };

    try {
      // 3. Récupérer la liste actuelle des clés
      const existingKeys = await this.getKeys();
      const originalKeyCount = existingKeys.length;

      // 4. Vérifier si la clé maîtresse existe déjà
      const masterKeyIndex = existingKeys.findIndex(
        (k) =>
          k.apiProvider === masterKeyData.apiProvider &&
          k.apiKey === masterKeyData.apiKey &&
          k.apiModel === masterKeyData.apiModel,
      );

      if (masterKeyIndex !== -1) {
        // 4a. La clé existe - la mettre à jour et la déplacer en tête
        const existingMasterKey = existingKeys[masterKeyIndex];

        // Mettre à jour les champs pertinents
        existingMasterKey.lastUsed = Date.now(); // Marquer comme récemment utilisée

        // Réinitialiser les erreurs si la clé était désactivée, pour lui donner une nouvelle chance
        // Cela permet de réutiliser la clé maîtresse si elle avait été temporairement désactivée
        if (
          existingMasterKey.isPermanentlyDisabled ||
          (existingMasterKey.isDisabledUntil &&
            existingMasterKey.isDisabledUntil > Date.now())
        ) {
          logger.info(
            {
              apiKeyPrefix: existingMasterKey.apiKey.substring(0, 5) + '...',
              provider: existingMasterKey.apiProvider,
            },
            'La clé maîtresse était désactivée, réinitialisation de son statut.',
          );
          existingMasterKey.errorCount = 0;
          existingMasterKey.isDisabledUntil = undefined;
          existingMasterKey.isPermanentlyDisabled = false;
        }

        // Retirer la clé de son ancienne position
        const [updatedMasterKey] = existingKeys.splice(masterKeyIndex, 1);

        // Ajouter la clé mise à jour en tête de liste
        existingKeys.unshift(updatedMasterKey);

        await this.saveKeys(existingKeys);
        // Update the apiKeys map
        this.populateApiKeysMap(existingKeys);
        const msg = `Clé maîtresse déjà présente. Statut mis à jour et placée en tête de liste.`;
        logger.info(
          {
            apiKeyPrefix: masterKeyData.apiKey.substring(0, 5) + '...',
            provider: masterKeyData.apiProvider,
          },
          msg,
        );
        return { action: 'updated', message: msg };
      } else {
        // 4b. La clé n'existe pas - l'ajouter en tête de liste
        // S'assurer qu'elle est active
        masterKeyData.isPermanentlyDisabled = false;
        masterKeyData.isDisabledUntil = undefined;
        masterKeyData.lastUsed = Date.now(); // Marquer comme récemment utilisée

        existingKeys.unshift(masterKeyData);
        await this.saveKeys(existingKeys);
        // Update the apiKeys map
        this.populateApiKeysMap(existingKeys);

        const msg = `Nouvelle clé maîtresse ajoutée en tête de liste.`;
        logger.info(
          {
            apiKeyPrefix: masterKeyData.apiKey.substring(0, 5) + '...',
            provider: masterKeyData.apiProvider,
          },
          msg,
        );
        return { action: 'added', message: msg };
      }
    } catch (error) {
      const errorMsg = `Erreur lors de la synchronisation de la clé maîtresse: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorMsg);
      return { action: 'error', message: errorMsg };
    }
  }

  /**
   * Teste de manière non-intrusive toutes les clés pour vérifier leur disponibilité.
   * Cette méthode est destinée à être utilisée pour une rotation proactive future.
   * Actuellement, elle s'exécute en mode "dry-run" pour la journalisation uniquement.
   *
   * @param dryRun - Si true (par défaut), ne modifie pas l'état des clés, se contente de logger.
   * @returns Un rapport sur l'état des tests.
   */
  public static async testAllKeys(dryRun: boolean = true): Promise<{
    activeKeys: number;
    failedTests: number;
    report: string;
    successfulTests: number;
    testedKeys: number;
    totalKeys: number;
  }> {
    const logger = getLogger();
    const reportLines: string[] = [];
    let successfulTests = 0;
    let failedTests = 0;
    let testedKeys = 0;

    try {
      const keys = await this.getKeys();
      const activeKeys = keys.filter(
        (k) =>
          !k.isPermanentlyDisabled &&
          (!k.isDisabledUntil || k.isDisabledUntil <= Date.now()),
      ).length;

      reportLines.push(
        `🔍 Rapport de test de toutes les clés (dryRun: ${dryRun})`,
      );
      reportLines.push(`   - Clés totales: ${keys.length}`);
      reportLines.push(`   - Clés actives: ${activeKeys}`);

      // Itérer sur une copie pour éviter les modifications pendant l'itération
      const keysToTest = [...keys];

      for (const key of keysToTest) {
        // Sauter les clés désactivées de manière permanente
        if (key.isPermanentlyDisabled) {
          reportLines.push(
            `⏭️ Clé sautée (désactivée de manière permanente): ${key.apiProvider} (${key.apiKey.substring(0, 5)}...)`,
          );
          continue;
        }

        // Sauter les clés désactivées temporairement
        if (key.isDisabledUntil && key.isDisabledUntil > Date.now()) {
          const timeLeftSec = Math.ceil(
            (key.isDisabledUntil - Date.now()) / 1000,
          );
          reportLines.push(
            `⏭️ Clé sautée (désactivée temporairement, ${timeLeftSec}s restantes): ${key.apiProvider} (${key.apiKey.substring(0, 5)}...)`,
          );
          continue;
        }

        testedKeys++;
        reportLines.push(
          `🧪 Test de la clé: ${key.apiProvider} - ${key.apiModel} (${key.apiKey.substring(0, 5)}...)`,
        );

        try {
          // --- SIMULATION DE TEST ---
          // Dans une implémentation future, cela appellerait un endpoint "léger" de l'API du fournisseur.
          // Par exemple, pour OpenAI: GET /v1/models (ou un HEAD), pour Google: un appel simple.
          // Pour l'instant, simulons un test rapide.

          // Exemple très basique de simulation
          const isAvailable = await this.simulateKeyTest(key);

          if (isAvailable) {
            successfulTests++;
            reportLines.push(`   ✅ Test réussi pour ${key.apiProvider}`);

            // En mode non-dry-run, on pourrait réinitialiser le errorCount
            // ou effectuer d'autres actions de maintenance légères.
            if (!dryRun) {
              // Placeholder pour une logique future
              // Par exemple: remettre errorCount à 0 si elle était > 0 mais < MAX_TEMPORARY_ERROR_COUNT
              // Cela permettrait de "réhabiliter" une clé qui a eu quelques erreurs temporaires
              // mais qui est de nouveau fonctionnelle.
              // if (key.errorCount > 0 && key.errorCount < MAX_TEMPORARY_ERROR_COUNT) {
              //    logger.info(`🔄 Réinitialisation du compteur d'erreurs pour ${key.apiProvider} (${key.apiKey.substring(0, 5)}...) car test réussi.`);
              //    await this.resetKeyStatus(key.apiProvider, key.apiKey);
              // }
            }
          } else {
            failedTests++;
            reportLines.push(`   ❌ Test échoué pour ${key.apiProvider}`);

            // En mode non-dry-run, on pourrait marquer la clé comme temporairement mauvaise
            // si ce n'est pas déjà le cas. Cela éviterait de l'utiliser immédiatement
            // dans les prochaines requêtes.
            if (!dryRun) {
              // Placeholder pour une logique future
              // await this.markKeyAsBad(key.apiProvider, key.apiKey, LlmKeyErrorType.TEMPORARY);
            }
          }
        } catch (testError: any) {
          failedTests++;
          reportLines.push(
            `   ❌ Erreur lors du test de ${key.apiProvider}: ${testError.message}`,
          );
          logger.warn(
            { err: testError, provider: key.apiProvider },
            'Erreur non critique lors du test de la clé',
          );

          // Même logique que pour un échec "normal"
          if (!dryRun) {
            // Placeholder
            // await this.markKeyAsBad(key.apiProvider, key.apiKey, LlmKeyErrorType.TEMPORARY);
          }
        }
      }

      const finalReport = reportLines.join('\n');
      logger.info(finalReport); // Logger le rapport complet

      return {
        activeKeys,
        failedTests,
        report: finalReport,
        successfulTests,
        testedKeys,
        totalKeys: keys.length,
      };
    } catch (error: any) {
      const errorMsg = `Erreur fatale lors du test de toutes les clés: ${error.message}`;
      logger.error({ err: error }, errorMsg);
      return {
        activeKeys: 0,
        failedTests: 0,
        report: errorMsg,
        successfulTests: 0,
        testedKeys: 0,
        totalKeys: 0,
      };
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

  /**
   * Gets keys with robust fallback mechanisms
   */
  private static async getKeysWithFallback(
    provider: string,
  ): Promise<LlmApiKey[]> {
    const log = getLogger().child({ module: 'LlmKeyManager' });

    try {
      // Try Redis first
      const keys = await this.getKeys();

      // If Redis is empty, try to sync from environment
      if (keys.length === 0) {
        log.warn('Redis is empty, trying to sync from environment variables');
        await this.ensureMasterKeySync();
        return await this.getKeys();
      }

      return keys;
    } catch (redisError) {
      log.error(
        { redisError, provider },
        'Redis failed, using environment fallback',
      );

      // If Redis completely fails, create temporary key from env
      const envKey = this.createEnvironmentKey(provider);
      return envKey ? [envKey] : [];
    }
  }

  /**
   * Creates a temporary key from environment variables
   */
  private static createEnvironmentKey(provider: string): LlmApiKey | null {
    let apiKey: string | undefined;
    let modelName: string | undefined;
    let actualProvider = provider;

    // Handle custom Gemini provider names (gemini-flash-1, gemini-pro-1, etc.)
    if (
      provider.startsWith('gemini-flash-') ||
      provider.startsWith('gemini-pro-')
    ) {
      actualProvider = 'gemini';
      // Extract the key number from the provider name
      const keyNumber = provider.match(/(\d+)$/)?.[1];
      if (keyNumber) {
        // Map to the corresponding environment variable based on flash/pro type
        let envVarName: string;
        if (provider.includes('flash')) {
          envVarName = `LLM_API_KEY_GEMINI_FLASH_${keyNumber}`;
          modelName = 'gemini-2.5-flash';
        } else if (provider.includes('pro')) {
          envVarName = `LLM_API_KEY_GEMINI_PRO_${keyNumber}`;
          modelName = 'gemini-2.5-pro';
        } else {
          // Fallback for unknown type
          envVarName = `LLM_API_KEY_GEMINI_FLASH_${keyNumber}`;
          modelName = 'gemini-2.5-flash';
        }
        apiKey = process.env[envVarName];

        // Debug logging
        getLogger().info(
          {
            provider,
            keyNumber,
            envVarName,
            hasKey: !!apiKey,
            keyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'none',
          },
          '🔍 Custom Gemini provider mapping',
        );

        // If no key found for this specific provider, try fallback to main key
        if (!apiKey) {
          getLogger().warn(
            {
              provider,
              envVarName,
              fallbackTo: 'LLM_API_KEY',
            },
            'No specific key found for custom provider, trying main LLM_API_KEY',
          );
          apiKey = config.LLM_API_KEY;
        }
      } else {
        // If no key number found, fallback to main key
        getLogger().warn(
          {
            provider,
            issue: 'No key number found in provider name',
          },
          'Invalid custom Gemini provider name format, using main key',
        );
        apiKey = config.LLM_API_KEY;
        modelName = provider.includes('flash')
          ? 'gemini-2.5-flash'
          : 'gemini-2.5-pro';
      }
    }

    // Handle custom OpenRouter provider names (openrouter-sky, openrouter-dusk)
    if (provider === 'openrouter-sky' || provider === 'openrouter-dusk') {
      actualProvider = provider; // Keep the specific provider name instead of generic 'openrouter'
      // Map to the corresponding environment variable based on sky/dusk type
      let envVarName: string;
      if (provider === 'openrouter-sky') {
        envVarName = 'LLM_API_KEY_OPENROUTER_SKY';
        modelName = 'openrouter/sonoma-sky-alpha';
      } else if (provider === 'openrouter-dusk') {
        envVarName = 'LLM_API_KEY_OPENROUTER_DUSK';
        modelName = 'openrouter/sonoma-dusk-alpha';
      } else {
        // Fallback
        envVarName = 'LLM_API_KEY_OPENROUTER_SKY';
        modelName = 'openrouter/sonoma-sky-alpha';
      }
      apiKey = process.env[envVarName];

      // Debug logging
      getLogger().info(
        {
          provider,
          envVarName,
          hasKey: !!apiKey,
          keyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'none',
        },
        '🔍 Custom OpenRouter provider mapping',
      );

      // If no key found for this specific provider, try fallback to main key
      if (!apiKey) {
        getLogger().warn(
          {
            provider,
            envVarName,
            fallbackTo: 'LLM_API_KEY',
          },
          'No specific key found for custom OpenRouter provider, trying main LLM_API_KEY',
        );
        apiKey = config.LLM_API_KEY;
      }
    }

    // If we didn't get a key from custom mapping, try standard provider keys
    if (!apiKey) {
      // Try specific provider keys first, then fallback to generic LLM_API_KEY only if provider matches
      switch (actualProvider.toLowerCase()) {
        case 'gemini':
          apiKey =
            process.env.GEMINI_API_KEY ||
            (config.LLM_PROVIDER === 'gemini' ? config.LLM_API_KEY : undefined);
          modelName = modelName || config.LLM_MODEL_NAME || 'gemini-2.5-flash';
          break;
        case 'openai':
          apiKey =
            process.env.OPENAI_API_KEY ||
            (config.LLM_PROVIDER === 'openai' ? config.LLM_API_KEY : undefined);
          modelName = modelName || 'gpt-4';
          break;
        case 'qwen':
          apiKey =
            process.env.QWEN_API_KEY ||
            (config.LLM_PROVIDER === 'qwen' ? config.LLM_API_KEY : undefined);
          modelName = modelName || 'qwen-plus';
          break;
        default:
          // Only use generic LLM_API_KEY if the provider matches the configured provider
          if (config.LLM_PROVIDER === actualProvider) {
            apiKey = config.LLM_API_KEY;
            modelName = config.LLM_MODEL_NAME;
          }
      }
    }

    if (!apiKey) {
      return null;
    }

    const keyInfo = {
      apiKey: apiKey,
      apiModel: modelName || 'default',
      apiProvider: actualProvider,
      errorCount: 0,
      isPermanentlyDisabled: false,
      lastUsed: Date.now(),
    };

    getLogger().info(
      {
        provider: actualProvider,
        model: keyInfo.apiModel,
        hasKey: !!apiKey,
        keySource: apiKey
          ? apiKey === config.LLM_API_KEY
            ? 'main'
            : 'custom'
          : 'none',
        keyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'none',
      },
      '🔑 Created environment key for provider',
    );

    return keyInfo;
  }

  /**
   * Fallback method for getting environment key
   */
  private static getEnvironmentFallbackKey(provider: string): LlmApiKey | null {
    const log = getLogger().child({ module: 'LlmKeyManager' });

    const envKey = this.createEnvironmentKey(provider);
    if (envKey) {
      log.info(
        { provider, hasKey: !!envKey.apiKey },
        'Using environment fallback key',
      );
      return envKey;
    }

    log.warn({ provider }, 'No environment fallback key available');
    return null;
  }

  /**
   * Ensures master key is synced from environment to Redis
   */
  private static async ensureMasterKeySync(): Promise<void> {
    const log = getLogger().child({ module: 'LlmKeyManager' });

    if (config.LLM_API_KEY && config.LLM_PROVIDER && config.LLM_MODEL_NAME) {
      log.info(
        {
          provider: config.LLM_PROVIDER,
          model: config.LLM_MODEL_NAME,
          hasKey: !!config.LLM_API_KEY,
        },
        'Syncing master key from environment to Redis',
      );

      await this.addKey(
        config.LLM_PROVIDER,
        config.LLM_API_KEY,
        config.LLM_MODEL_NAME,
      );

      log.info('Master key synced successfully');
    } else {
      log.warn(
        {
          hasApiKey: !!config.LLM_API_KEY,
          hasProvider: !!config.LLM_PROVIDER,
          hasModel: !!config.LLM_MODEL_NAME,
        },
        'Cannot sync master key - missing configuration',
      );
    }

    // Sync OpenRouter keys with specific provider names
    const openRouterKeys = [
      {
        provider: 'openrouter-sky',
        model: 'openrouter/sonoma-sky-alpha',
        envVar: 'LLM_API_KEY_OPENROUTER_SKY',
      },
      {
        provider: 'openrouter-dusk',
        model: 'openrouter/sonoma-dusk-alpha',
        envVar: 'LLM_API_KEY_OPENROUTER_DUSK',
      },
    ];

    for (const keyConfig of openRouterKeys) {
      const apiKey = process.env[keyConfig.envVar];
      if (apiKey) {
        try {
          await this.addKey(
            keyConfig.provider, // Use specific provider name
            apiKey,
            keyConfig.model,
          );
          log.info(
            `OpenRouter API key for ${keyConfig.provider} (${keyConfig.model}) added to KeyManager.`,
          );
        } catch (error) {
          log.warn(
            { error, provider: keyConfig.provider },
            `Failed to add OpenRouter API key for ${keyConfig.provider}`,
          );
        }
      } else {
        log.debug(
          `OpenRouter API key for ${keyConfig.provider} not found in environment (${keyConfig.envVar})`,
        );
      }
    }
  }

  private static async getKeysWithHierarchy(): Promise<LlmApiKey[]> {
    const keys = await this.getKeys();
    const hierarchy = await this.getKeyHierarchy();

    // Add priority to each key based on hierarchy
    return keys.map((key) => {
      const keyIdentifier = `${key.apiProvider}|${key.apiKey}|${key.apiModel}|${key.baseUrl || ''}`;
      return {
        ...key,
        priority: hierarchy[keyIdentifier],
      };
    });
  }

  /**
   * Simule un test rapide de disponibilité d'une clé.
   * Dans une implémentation future, cela ferait un vrai appel à l'API du fournisseur.
   * @returns Une promesse résolue avec `true` si la clé est considérée comme disponible.
   */
  private static async simulateKeyTest(key: LlmApiKey): Promise<boolean> {
    // --- SIMULATION ---
    // Pour le moment, renvoyons true la plupart du temps pour ne pas fausser les tests.
    // On peut ajouter une logique aléatoire très simple pour simuler des échecs.

    // Exemple: 5% de chance d'échec simulé
    // const shouldFail = Math.random() < 0.05;
    // if (shouldFail) return false;

    // Ou, pour une simulation encore plus passive, toujours renvoyer true.
    // Cela permet de tester le framework sans impacter le fonctionnement réel.
    return true;
  }
}
