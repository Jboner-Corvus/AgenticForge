import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  getRedisClientInstance
} from "./chunk-UWC7S2CG.js";
import {
  getLogger
} from "./chunk-BL4YZGPN.js";
import {
  config
} from "./chunk-VUKI2J6K.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/modules/llm/LlmKeyManager.ts
init_esm_shims();
var LlmKeyErrorType = {
  PERMANENT: "permanent",
  TEMPORARY: "temporary"
};
var MASTER_LLM_API_KEY_ENV_VAR = "MASTER_LLM_API_KEY";
var DEFAULT_MASTER_KEY_PROVIDER = "gemini";
var DEFAULT_MASTER_KEY_MODEL = "gemini-2.5-pro";
var LLM_API_KEYS_REDIS_KEY = "llmApiKeys";
var LLM_API_KEYS_HIERARCHY_REDIS_KEY = "llmApiKeysHierarchy";
var MAX_TEMPORARY_ERROR_COUNT = 999;
var TEMPORARY_DISABLE_DURATION_MS = 30 * 1e3;
var LlmKeyManager = class {
  static apiKeys = /* @__PURE__ */ new Map();
  static lastUsedIndex = /* @__PURE__ */ new Map();
  // Helper method to populate the apiKeys map from Redis data
  static populateApiKeysMap(keys) {
    this.apiKeys.clear();
    keys.forEach((key) => {
      if (!this.apiKeys.has(key.apiProvider)) {
        this.apiKeys.set(key.apiProvider, []);
      }
      this.apiKeys.get(key.apiProvider).push(key);
    });
  }
  static async addKey(apiProvider, apiKey, apiModel, baseUrl) {
    const keys = await this.getKeys();
    const existingKeyIndex = keys.findIndex(
      (k) => k.apiProvider === apiProvider && k.apiKey === apiKey && k.apiModel === apiModel && (k.baseUrl || "") === (baseUrl || "")
    );
    if (existingKeyIndex !== -1) {
      getLogger().warn(
        {
          apiKey: apiKey.substring(0, 10) + "...",
          apiModel,
          apiProvider,
          baseUrl
        },
        "LLM API key already exists - updating existing entry instead of creating duplicate."
      );
      const existingKey = keys[existingKeyIndex];
      existingKey.baseUrl = baseUrl;
      existingKey.errorCount = 0;
      existingKey.isPermanentlyDisabled = false;
      existingKey.isDisabledUntil = void 0;
      await this.saveKeys(keys);
      this.populateApiKeysMap(keys);
      getLogger().info(
        {
          apiKey: apiKey.substring(0, 10) + "...",
          apiModel,
          apiProvider,
          baseUrl
        },
        "LLM API key updated (duplicate avoided)."
      );
      return;
    }
    keys.push({ apiKey, apiModel, apiProvider, baseUrl, errorCount: 0 });
    await this.saveKeys(keys);
    this.populateApiKeysMap(keys);
    try {
      const redisClient = getRedisClientInstance();
      await redisClient.incr("leaderboard:apiKeysAdded");
    } catch (error) {
      getLogger().error(
        {
          apiKey: apiKey.substring(0, 10) + "...",
          apiModel,
          apiProvider,
          baseUrl,
          error
        },
        "Failed to increment apiKeysAdded in Redis"
      );
    }
    getLogger().info(
      {
        apiKey: apiKey.substring(0, 10) + "...",
        apiModel,
        apiProvider,
        baseUrl
      },
      "LLM API key added."
    );
  }
  /**
   * Supprime automatiquement les doublons des clés LLM existantes.
   * Cette méthode doit être appelée au démarrage du serveur.
   */
  static async deduplicateKeys() {
    const keys = await this.getKeys();
    const originalCount = keys.length;
    if (originalCount === 0) {
      return { duplicatesRemoved: 0, originalCount: 0, uniqueCount: 0 };
    }
    const uniqueKeysMap = /* @__PURE__ */ new Map();
    const seenKeys = /* @__PURE__ */ new Set();
    for (const key of keys) {
      const keyIdentifier = `${key.apiProvider}|${key.apiKey}|${key.apiModel}|${key.baseUrl || ""}`;
      if (!seenKeys.has(keyIdentifier)) {
        seenKeys.add(keyIdentifier);
        uniqueKeysMap.set(keyIdentifier, key);
        getLogger().debug(
          {
            keyPrefix: key.apiKey.substring(0, 10) + "...",
            model: key.apiModel,
            provider: key.apiProvider
          },
          "Cl\xE9 LLM unique conserv\xE9e"
        );
      } else {
        getLogger().warn(
          {
            keyPrefix: key.apiKey.substring(0, 10) + "...",
            model: key.apiModel,
            provider: key.apiProvider
          },
          "Doublon de cl\xE9 LLM supprim\xE9"
        );
      }
    }
    const uniqueKeys = Array.from(uniqueKeysMap.values());
    const uniqueCount = uniqueKeys.length;
    const duplicatesRemoved = originalCount - uniqueCount;
    if (duplicatesRemoved > 0) {
      await this.saveKeys(uniqueKeys);
      getLogger().info(
        {
          duplicatesRemoved,
          originalCount,
          uniqueCount
        },
        "\u{1F9F9} D\xE9doublonnage automatique des cl\xE9s LLM termin\xE9"
      );
    } else {
      getLogger().debug("Aucun doublon de cl\xE9 LLM trouv\xE9");
    }
    return { duplicatesRemoved, originalCount, uniqueCount };
  }
  // New methods for key hierarchy management
  static async getKeyHierarchy() {
    try {
      const hierarchyJson = await getRedisClientInstance().get(
        LLM_API_KEYS_HIERARCHY_REDIS_KEY
      );
      return hierarchyJson ? JSON.parse(hierarchyJson) : {};
    } catch (error) {
      getLogger().error({ error }, "Failed to get key hierarchy from Redis");
      return {};
    }
  }
  static async getKeysForApi() {
    return await this.getKeys();
  }
  /**
   * Gets the next available API key for a provider.
   * @param provider The LLM provider.
   * @returns A promise that resolves to the next available API key, or null if none are available.
   */
  static async getNextAvailableKey(provider) {
    const log = getLogger().child({ module: "LlmKeyManager" });
    try {
      const keys = await this.getKeysWithFallback(provider);
      this.populateApiKeysMap(keys);
      const providerKeys2 = this.apiKeys.get(provider) || [];
      if (providerKeys2.length === 0) {
        log.warn(`No API keys configured for provider: ${provider}`);
        return this.getEnvironmentFallbackKey(provider);
      }
    } catch (error) {
      log.error({ error, provider }, "Error getting keys from Redis, trying fallback");
      return this.getEnvironmentFallbackKey(provider);
    }
    const providerKeys = this.apiKeys.get(provider) || [];
    const workingKeys = providerKeys.filter((key) => {
      if (key.isPermanentlyDisabled) return false;
      if (key.temporaryDisabledUntil && Date.now() < key.temporaryDisabledUntil) return false;
      return key.errorCount < MAX_TEMPORARY_ERROR_COUNT;
    });
    if (workingKeys.length === 0 && providerKeys.length > 0) {
      log.warn({ provider }, "No working keys found, attempting cleanup");
      const cleanupResult = await this.cleanupFailedKeys(provider);
      if (cleanupResult.cleaned > 0) {
        const refreshedKeys = await this.getKeys();
        this.populateApiKeysMap(refreshedKeys);
        const refreshedProviderKeys = this.apiKeys.get(provider) || [];
        const newWorkingKeys = refreshedProviderKeys.filter((key) => {
          if (key.isPermanentlyDisabled) return false;
          if (key.temporaryDisabledUntil && Date.now() < key.temporaryDisabledUntil) return false;
          return key.errorCount < MAX_TEMPORARY_ERROR_COUNT;
        });
        if (newWorkingKeys.length > 0) {
          log.info({ provider, cleanedCount: cleanupResult.cleaned }, "Keys recovered after cleanup");
          const selectedIndex2 = this.lastUsedIndex?.get(provider) ?? -1;
          const nextIndex2 = (selectedIndex2 + 1) % newWorkingKeys.length;
          this.lastUsedIndex?.set(provider, nextIndex2);
          const selectedKey2 = newWorkingKeys[nextIndex2];
          log.info(`Selected API key ${selectedKey2.apiKey.substring(0, 8)}... for provider ${provider}`);
          return selectedKey2;
        }
      }
      log.warn({ provider }, "No working keys after cleanup, using environment fallback");
      return this.getEnvironmentFallbackKey(provider);
    }
    let availableKeys = workingKeys;
    if (availableKeys.length === 0) {
      availableKeys = providerKeys.filter((key) => {
        if (key.isPermanentlyDisabled) {
          return false;
        }
        if (key.isDisabledUntil && Date.now() < key.isDisabledUntil) {
          log.debug(
            `Key ${key.apiKey.substring(0, 8)}... is temporarily disabled until ${new Date(key.isDisabledUntil).toISOString()}`
          );
          return false;
        }
        if (key.temporaryDisabledUntil && Date.now() < key.temporaryDisabledUntil) {
          log.debug(
            `Key ${key.apiKey.substring(0, 8)}... is temporarily disabled until ${new Date(key.temporaryDisabledUntil).toISOString()}`
          );
          return false;
        }
        return true;
      });
    }
    if (availableKeys.length === 0) {
      log.warn(`No available API keys for provider: ${provider}`);
      const soonestAvailable = providerKeys.filter((key) => key.isDisabledUntil && !key.isPermanentlyDisabled).sort((a, b) => (a.isDisabledUntil || 0) - (b.isDisabledUntil || 0))[0];
      if (soonestAvailable) {
        const timeUntilAvailable = (soonestAvailable.isDisabledUntil || 0) - Date.now();
        log.info(
          `Next key will be available in ${Math.ceil(timeUntilAvailable / 1e3)} seconds`
        );
      }
      return null;
    }
    const selectedIndex = this.lastUsedIndex?.get(provider) ?? -1;
    const nextIndex = (selectedIndex + 1) % availableKeys.length;
    this.lastUsedIndex?.set(provider, nextIndex);
    const selectedKey = availableKeys[nextIndex];
    log.info(
      `Selected API key ${selectedKey.apiKey.substring(0, 8)}... for provider ${provider}`
    );
    return selectedKey;
  }
  static async hasAvailableKeys(providerName) {
    try {
      const keys = await this.getKeysWithFallback(providerName);
      const now = Date.now();
      const availableKeysForProvider = keys.filter(
        (key) => key.apiProvider === providerName && !key.isPermanentlyDisabled && (!key.isDisabledUntil || key.isDisabledUntil <= now) && (!key.temporaryDisabledUntil || key.temporaryDisabledUntil <= now)
      );
      if (availableKeysForProvider.length === 0) {
        const envKey = this.getEnvironmentFallbackKey(providerName);
        return envKey !== null;
      }
      return availableKeysForProvider.length > 0;
    } catch (error) {
      const envKey = this.getEnvironmentFallbackKey(providerName);
      return envKey !== null;
    }
  }
  /**
   * Cleans up and resets failed keys that might be recoverable
   */
  static async cleanupFailedKeys(provider) {
    const log = getLogger().child({ module: "LlmKeyManager" });
    try {
      const keys = await this.getKeys();
      let cleanedCount = 0;
      const currentTime = Date.now();
      const cleanedKeys = keys.map((key) => {
        if (provider && key.apiProvider !== provider) {
          return key;
        }
        if (key.temporaryDisabledUntil && currentTime > key.temporaryDisabledUntil) {
          log.info({
            provider: key.apiProvider,
            keyPreview: key.apiKey.substring(0, 12) + "..."
          }, "Re-enabling temporarily disabled key");
          cleanedCount++;
          return {
            ...key,
            errorCount: 0,
            temporaryDisabledUntil: void 0,
            lastError: void 0,
            isPermanentlyDisabled: false
          };
        }
        if (key.errorCount >= MAX_TEMPORARY_ERROR_COUNT && !key.isPermanentlyDisabled) {
          const lastUsed = key.lastUsed || 0;
          const timeSinceLastUse = currentTime - lastUsed;
          if (timeSinceLastUse > TEMPORARY_DISABLE_DURATION_MS * 2) {
            log.info({
              provider: key.apiProvider,
              keyPreview: key.apiKey.substring(0, 12) + "...",
              oldErrorCount: key.errorCount
            }, "Resetting high-error-count key after cooldown");
            cleanedCount++;
            return {
              ...key,
              errorCount: 0,
              temporaryDisabledUntil: void 0,
              lastError: void 0
            };
          }
        }
        return key;
      });
      if (cleanedCount > 0) {
        await this.saveKeys(cleanedKeys);
        log.info({ cleanedCount, total: keys.length }, "Cleaned up failed keys");
      }
      return { cleaned: cleanedCount, total: keys.length };
    } catch (error) {
      log.error({ error, provider }, "Failed to cleanup keys");
      return { cleaned: 0, total: 0 };
    }
  }
  /**
   * Marks an API key as bad based on the error type.
   * @param provider The LLM provider.
   * @param apiKey The API key to mark.
   * @param errorType The type of error encountered.
   */
  static async markKeyAsBad(provider, apiKey, errorType) {
    const log = getLogger().child({ module: "LlmKeyManager" });
    const keys = await this.getKeys();
    this.populateApiKeysMap(keys);
    const keysForProvider = this.apiKeys.get(provider) || [];
    const keyObj = keysForProvider.find((k) => k.apiKey === apiKey);
    if (!keyObj) {
      log.warn(
        `Attempted to mark non-existent key as bad: ${apiKey} for provider ${provider}`
      );
      return;
    }
    keyObj.errorCount++;
    log.info(
      `Key ${apiKey.substring(0, 8)}... error count incremented to ${keyObj.errorCount}`
    );
    if (errorType === LlmKeyErrorType.PERMANENT) {
      log.warn(
        `Permanently disabling key ${apiKey.substring(0, 8)}... due to permanent error`
      );
      keyObj.isPermanentlyDisabled = true;
    } else {
      let backoffTime;
      if (keyObj.lastError?.includes("quota") || keyObj.lastError?.includes("limit") || keyObj.lastError?.includes("exceeded")) {
        log.warn(
          `Quota exceeded for key ${apiKey.substring(0, 8)}..., temporarily disabling for 2 minutes`
        );
        backoffTime = 2 * 60 * 1e3;
      } else {
        backoffTime = Math.min(1e3 * Math.pow(2, keyObj.errorCount), 6e4);
      }
      keyObj.isDisabledUntil = Date.now() + backoffTime;
      log.info(
        `Temporarily disabling key ${apiKey.substring(0, 8)}... for ${backoffTime}ms due to temporary error`
      );
    }
    keyObj.lastError = `Error count: ${keyObj.errorCount}, Type: ${errorType}`;
    await this.saveKeys(keys);
    this.populateApiKeysMap(keys);
  }
  static async removeKey(index) {
    const keys = await this.getKeys();
    if (index < 0 || index >= keys.length) {
      throw new Error("Index out of bounds");
    }
    const removedKey = keys.splice(index, 1);
    await this.saveKeys(keys);
    this.populateApiKeysMap(keys);
    getLogger().info(
      { provider: removedKey[0].apiProvider },
      "LLM API key removed."
    );
  }
  static async resetKeyStatus(provider, key) {
    const keys = await this.getKeys();
    this.populateApiKeysMap(keys);
    const keysForProvider = this.apiKeys.get(provider) || [];
    const keyIndex = keysForProvider.findIndex((k) => k.apiKey === key);
    if (keyIndex !== -1) {
      const goodKey = keysForProvider[keyIndex];
      goodKey.errorCount = 0;
      goodKey.isDisabledUntil = void 0;
      goodKey.isPermanentlyDisabled = false;
      goodKey.lastUsed = Date.now();
      getLogger().info(
        { apiKey: key.substring(0, 10) + "...", provider: goodKey.apiProvider },
        "LLM API key status reset."
      );
      await this.saveKeys(keys);
      this.populateApiKeysMap(keys);
    }
  }
  static async saveKeys(keys) {
    await getRedisClientInstance().del(LLM_API_KEYS_REDIS_KEY);
    if (keys.length > 0) {
      await getRedisClientInstance().rpush(
        LLM_API_KEYS_REDIS_KEY,
        ...keys.map((key) => JSON.stringify(key))
      );
    }
  }
  static async setKeyHierarchy(hierarchy) {
    try {
      await getRedisClientInstance().set(
        LLM_API_KEYS_HIERARCHY_REDIS_KEY,
        JSON.stringify(hierarchy)
      );
      getLogger().info("Key hierarchy saved to Redis");
    } catch (error) {
      getLogger().error({ error }, "Failed to save key hierarchy to Redis");
    }
  }
  /**
   * Synchronise la clé API maîtresse définie dans les variables d'environnement.
   * Cette clé est ajoutée ou mise à jour en tête de la liste pour assurer sa priorité.
   * Elle sert de solution de secours automatique si aucune autre clé n'est disponible.
   *
   * @returns Un objet indiquant si la clé a été ajoutée, mise à jour ou ignorée.
   */
  static async syncEnvMasterKey() {
    const logger = getLogger();
    let masterApiKey = process.env[MASTER_LLM_API_KEY_ENV_VAR];
    if (!masterApiKey) {
      masterApiKey = config.LLM_API_KEY;
    }
    if (!masterApiKey || masterApiKey.trim() === "") {
      const msg = `Aucune cl\xE9 API ma\xEEtresse trouv\xE9e dans '${MASTER_LLM_API_KEY_ENV_VAR}' ou 'LLM_API_KEY'. La synchronisation est ignor\xE9e.`;
      logger.info(msg);
      return { action: "ignored", message: msg };
    }
    const masterKeyData = {
      apiKey: masterApiKey.trim(),
      apiModel: DEFAULT_MASTER_KEY_MODEL,
      apiProvider: DEFAULT_MASTER_KEY_PROVIDER,
      errorCount: 0
      // Note: lastUsed is intentionally left undefined or will be updated to make it 'recent'
    };
    try {
      const existingKeys = await this.getKeys();
      const originalKeyCount = existingKeys.length;
      const masterKeyIndex = existingKeys.findIndex(
        (k) => k.apiProvider === masterKeyData.apiProvider && k.apiKey === masterKeyData.apiKey && k.apiModel === masterKeyData.apiModel
      );
      if (masterKeyIndex !== -1) {
        const existingMasterKey = existingKeys[masterKeyIndex];
        existingMasterKey.lastUsed = Date.now();
        if (existingMasterKey.isPermanentlyDisabled || existingMasterKey.isDisabledUntil && existingMasterKey.isDisabledUntil > Date.now()) {
          logger.info(
            {
              apiKeyPrefix: existingMasterKey.apiKey.substring(0, 5) + "...",
              provider: existingMasterKey.apiProvider
            },
            "La cl\xE9 ma\xEEtresse \xE9tait d\xE9sactiv\xE9e, r\xE9initialisation de son statut."
          );
          existingMasterKey.errorCount = 0;
          existingMasterKey.isDisabledUntil = void 0;
          existingMasterKey.isPermanentlyDisabled = false;
        }
        const [updatedMasterKey] = existingKeys.splice(masterKeyIndex, 1);
        existingKeys.unshift(updatedMasterKey);
        await this.saveKeys(existingKeys);
        this.populateApiKeysMap(existingKeys);
        const msg = `Cl\xE9 ma\xEEtresse d\xE9j\xE0 pr\xE9sente. Statut mis \xE0 jour et plac\xE9e en t\xEAte de liste.`;
        logger.info(
          {
            apiKeyPrefix: masterKeyData.apiKey.substring(0, 5) + "...",
            provider: masterKeyData.apiProvider
          },
          msg
        );
        return { action: "updated", message: msg };
      } else {
        masterKeyData.isPermanentlyDisabled = false;
        masterKeyData.isDisabledUntil = void 0;
        masterKeyData.lastUsed = Date.now();
        existingKeys.unshift(masterKeyData);
        await this.saveKeys(existingKeys);
        this.populateApiKeysMap(existingKeys);
        const msg = `Nouvelle cl\xE9 ma\xEEtresse ajout\xE9e en t\xEAte de liste.`;
        logger.info(
          {
            apiKeyPrefix: masterKeyData.apiKey.substring(0, 5) + "...",
            provider: masterKeyData.apiProvider
          },
          msg
        );
        return { action: "added", message: msg };
      }
    } catch (error) {
      const errorMsg = `Erreur lors de la synchronisation de la cl\xE9 ma\xEEtresse: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorMsg);
      return { action: "error", message: errorMsg };
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
  static async testAllKeys(dryRun = true) {
    const logger = getLogger();
    const reportLines = [];
    let successfulTests = 0;
    let failedTests = 0;
    let testedKeys = 0;
    try {
      const keys = await this.getKeys();
      const activeKeys = keys.filter(
        (k) => !k.isPermanentlyDisabled && (!k.isDisabledUntil || k.isDisabledUntil <= Date.now())
      ).length;
      reportLines.push(
        `\u{1F50D} Rapport de test de toutes les cl\xE9s (dryRun: ${dryRun})`
      );
      reportLines.push(`   - Cl\xE9s totales: ${keys.length}`);
      reportLines.push(`   - Cl\xE9s actives: ${activeKeys}`);
      const keysToTest = [...keys];
      for (const key of keysToTest) {
        if (key.isPermanentlyDisabled) {
          reportLines.push(
            `\u23ED\uFE0F Cl\xE9 saut\xE9e (d\xE9sactiv\xE9e de mani\xE8re permanente): ${key.apiProvider} (${key.apiKey.substring(0, 5)}...)`
          );
          continue;
        }
        if (key.isDisabledUntil && key.isDisabledUntil > Date.now()) {
          const timeLeftSec = Math.ceil(
            (key.isDisabledUntil - Date.now()) / 1e3
          );
          reportLines.push(
            `\u23ED\uFE0F Cl\xE9 saut\xE9e (d\xE9sactiv\xE9e temporairement, ${timeLeftSec}s restantes): ${key.apiProvider} (${key.apiKey.substring(0, 5)}...)`
          );
          continue;
        }
        testedKeys++;
        reportLines.push(
          `\u{1F9EA} Test de la cl\xE9: ${key.apiProvider} - ${key.apiModel} (${key.apiKey.substring(0, 5)}...)`
        );
        try {
          const isAvailable = await this.simulateKeyTest(key);
          if (isAvailable) {
            successfulTests++;
            reportLines.push(`   \u2705 Test r\xE9ussi pour ${key.apiProvider}`);
            if (!dryRun) {
            }
          } else {
            failedTests++;
            reportLines.push(`   \u274C Test \xE9chou\xE9 pour ${key.apiProvider}`);
            if (!dryRun) {
            }
          }
        } catch (testError) {
          failedTests++;
          reportLines.push(
            `   \u274C Erreur lors du test de ${key.apiProvider}: ${testError.message}`
          );
          logger.warn(
            { err: testError, provider: key.apiProvider },
            "Erreur non critique lors du test de la cl\xE9"
          );
          if (!dryRun) {
          }
        }
      }
      const finalReport = reportLines.join("\n");
      logger.info(finalReport);
      return {
        activeKeys,
        failedTests,
        report: finalReport,
        successfulTests,
        testedKeys,
        totalKeys: keys.length
      };
    } catch (error) {
      const errorMsg = `Erreur fatale lors du test de toutes les cl\xE9s: ${error.message}`;
      logger.error({ err: error }, errorMsg);
      return {
        activeKeys: 0,
        failedTests: 0,
        report: errorMsg,
        successfulTests: 0,
        testedKeys: 0,
        totalKeys: 0
      };
    }
  }
  static async getKeys() {
    const keysJson = await getRedisClientInstance().lrange(
      LLM_API_KEYS_REDIS_KEY,
      0,
      -1
    );
    return keysJson.map((key) => JSON.parse(key));
  }
  /**
   * Gets keys with robust fallback mechanisms
   */
  static async getKeysWithFallback(provider) {
    const log = getLogger().child({ module: "LlmKeyManager" });
    try {
      const keys = await this.getKeys();
      if (keys.length === 0) {
        log.warn("Redis is empty, trying to sync from environment variables");
        await this.ensureMasterKeySync();
        return await this.getKeys();
      }
      return keys;
    } catch (redisError) {
      log.error({ redisError, provider }, "Redis failed, using environment fallback");
      const envKey = this.createEnvironmentKey(provider);
      return envKey ? [envKey] : [];
    }
  }
  /**
   * Creates a temporary key from environment variables
   */
  static createEnvironmentKey(provider) {
    let apiKey;
    let modelName;
    switch (provider.toLowerCase()) {
      case "gemini":
        apiKey = process.env.GEMINI_API_KEY || (config.LLM_PROVIDER === "gemini" ? config.LLM_API_KEY : void 0);
        modelName = config.LLM_MODEL_NAME || "gemini-2.5-flash";
        break;
      case "openai":
        apiKey = process.env.OPENAI_API_KEY || (config.LLM_PROVIDER === "openai" ? config.LLM_API_KEY : void 0);
        modelName = "gpt-4";
        break;
      case "qwen":
        apiKey = process.env.QWEN_API_KEY || (config.LLM_PROVIDER === "qwen" ? config.LLM_API_KEY : void 0);
        modelName = "qwen-plus";
        break;
      default:
        if (config.LLM_PROVIDER === provider) {
          apiKey = config.LLM_API_KEY;
          modelName = config.LLM_MODEL_NAME;
        }
    }
    if (!apiKey) {
      return null;
    }
    return {
      apiKey,
      apiModel: modelName || "default",
      apiProvider: provider,
      errorCount: 0,
      isPermanentlyDisabled: false,
      lastUsed: Date.now()
    };
  }
  /**
   * Fallback method for getting environment key
   */
  static getEnvironmentFallbackKey(provider) {
    const log = getLogger().child({ module: "LlmKeyManager" });
    const envKey = this.createEnvironmentKey(provider);
    if (envKey) {
      log.info({ provider, hasKey: !!envKey.apiKey }, "Using environment fallback key");
      return envKey;
    }
    log.warn({ provider }, "No environment fallback key available");
    return null;
  }
  /**
   * Ensures master key is synced from environment to Redis
   */
  static async ensureMasterKeySync() {
    const log = getLogger().child({ module: "LlmKeyManager" });
    if (config.LLM_API_KEY && config.LLM_PROVIDER && config.LLM_MODEL_NAME) {
      log.info({
        provider: config.LLM_PROVIDER,
        model: config.LLM_MODEL_NAME,
        hasKey: !!config.LLM_API_KEY
      }, "Syncing master key from environment to Redis");
      await this.addKey(
        config.LLM_PROVIDER,
        config.LLM_API_KEY,
        config.LLM_MODEL_NAME
      );
      log.info("Master key synced successfully");
    } else {
      log.warn({
        hasApiKey: !!config.LLM_API_KEY,
        hasProvider: !!config.LLM_PROVIDER,
        hasModel: !!config.LLM_MODEL_NAME
      }, "Cannot sync master key - missing configuration");
    }
  }
  static async getKeysWithHierarchy() {
    const keys = await this.getKeys();
    const hierarchy = await this.getKeyHierarchy();
    return keys.map((key) => {
      const keyIdentifier = `${key.apiProvider}|${key.apiKey}|${key.apiModel}|${key.baseUrl || ""}`;
      return {
        ...key,
        priority: hierarchy[keyIdentifier]
      };
    });
  }
  /**
   * Simule un test rapide de disponibilité d'une clé.
   * Dans une implémentation future, cela ferait un vrai appel à l'API du fournisseur.
   * @returns Une promesse résolue avec `true` si la clé est considérée comme disponible.
   */
  static async simulateKeyTest(key) {
    return true;
  }
};

export {
  LlmKeyErrorType,
  LlmKeyManager
};
