import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  getRedisClientInstance
} from "./chunk-2TWFUMQU.js";
import {
  getLogger
} from "./chunk-5JE7E5SU.js";
import {
  config,
  getConfig
} from "./chunk-DVHMHG4X.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/utils/llmProvider.ts
init_esm_shims();

// src/modules/llm/llm-types.ts
init_esm_shims();

// src/modules/llm/LlmKeyManager.ts
init_esm_shims();
var LlmKeyErrorType = {
  PERMANENT: "permanent",
  TEMPORARY: "temporary"
};
var MASTER_LLM_API_KEY_ENV_VAR = "MASTER_LLM_API_KEY";
var DEFAULT_MASTER_KEY_PROVIDER = "google-flash";
var DEFAULT_MASTER_KEY_MODEL = "gemini-2.5-flash";
var LLM_API_KEYS_REDIS_KEY = "llmApiKeys";
var LLM_API_KEYS_HIERARCHY_REDIS_KEY = "llmApiKeysHierarchy";
var MAX_TEMPORARY_ERROR_COUNT = 999;
var TEMPORARY_DISABLE_DURATION_MS = 30 * 1e3;
var LlmKeyManager = class {
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
  static async getNextAvailableKey(providerName, modelName) {
    const keys = await this.getKeysWithHierarchy();
    const now = Date.now();
    const availableKeys = keys.filter(
      (key) => (!providerName || key.apiProvider === providerName) && // Filter by providerName
      (!modelName || key.apiModel === modelName) && // Filter by modelName
      !key.isPermanentlyDisabled && (!key.isDisabledUntil || key.isDisabledUntil <= now)
    ).sort((a, b) => {
      const priorityA = a.priority ?? Number.MAX_SAFE_INTEGER;
      const priorityB = b.priority ?? Number.MAX_SAFE_INTEGER;
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      return (a.lastUsed || 0) - (b.lastUsed || 0);
    });
    if (availableKeys.length === 0) {
      getLogger().warn("No available LLM API keys.");
      return null;
    }
    const nextKey = availableKeys[0];
    nextKey.lastUsed = now;
    await this.saveKeys(keys);
    getLogger().debug(
      {
        baseUrl: nextKey.baseUrl,
        model: nextKey.apiModel,
        provider: nextKey.apiProvider
      },
      "Returning next available LLM API key."
    );
    return nextKey;
  }
  static async hasAvailableKeys(providerName) {
    const keys = await this.getKeys();
    const now = Date.now();
    const availableKeysForProvider = keys.filter(
      (key) => key.apiProvider === providerName && !key.isPermanentlyDisabled && (!key.isDisabledUntil || key.isDisabledUntil <= now)
    );
    return availableKeysForProvider.length > 0;
  }
  static async markKeyAsBad(provider, key, errorType) {
    const keys = await this.getKeys();
    const keyIndex = keys.findIndex(
      (k) => k.apiProvider === provider && k.apiKey === key
    );
    if (keyIndex !== -1) {
      const badKey = keys[keyIndex];
      if (errorType === LlmKeyErrorType.PERMANENT) {
        badKey.isPermanentlyDisabled = true;
        badKey.errorCount = 0;
        badKey.isDisabledUntil = void 0;
        getLogger().error(
          {
            apiKey: key.substring(0, 10) + "...",
            provider: badKey.apiProvider
          },
          "LLM API key permanently disabled."
        );
      } else {
        badKey.errorCount = (badKey.errorCount || 0) + 1;
        badKey.lastUsed = Date.now();
        if (badKey.errorCount >= MAX_TEMPORARY_ERROR_COUNT) {
          badKey.isDisabledUntil = Date.now() + TEMPORARY_DISABLE_DURATION_MS;
          badKey.errorCount = 0;
          getLogger().warn(
            {
              apiKey: key.substring(0, 10) + "...",
              provider: badKey.apiProvider
            },
            `LLM API key temporarily disabled for ${TEMPORARY_DISABLE_DURATION_MS / 1e3} seconds due to multiple temporary errors.`
          );
        } else {
          getLogger().warn(
            {
              apiKey: key.substring(0, 10) + "...",
              errorCount: badKey.errorCount,
              provider: badKey.apiProvider
            },
            "LLM API key temporary error count incremented."
          );
        }
      }
      await this.saveKeys(keys);
    }
  }
  static async removeKey(index) {
    const keys = await this.getKeys();
    if (index < 0 || index >= keys.length) {
      throw new Error("Index out of bounds");
    }
    const removedKey = keys.splice(index, 1);
    await this.saveKeys(keys);
    getLogger().info(
      { provider: removedKey[0].apiProvider },
      "LLM API key removed."
    );
  }
  static async resetKeyStatus(provider, key) {
    const keys = await this.getKeys();
    const keyIndex = keys.findIndex(
      (k) => k.apiProvider === provider && k.apiKey === key
    );
    if (keyIndex !== -1) {
      const goodKey = keys[keyIndex];
      goodKey.errorCount = 0;
      goodKey.isDisabledUntil = void 0;
      goodKey.isPermanentlyDisabled = false;
      goodKey.lastUsed = Date.now();
      getLogger().info(
        { apiKey: key.substring(0, 10) + "...", provider: goodKey.apiProvider },
        "LLM API key status reset."
      );
      await this.saveKeys(keys);
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

// src/modules/llm/llm-types.ts
var LlmError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "LlmError";
  }
};

// src/modules/llm/qwenProvider.ts
init_esm_shims();

// src/utils/LlmError.ts
init_esm_shims();
var LlmError2 = class extends Error {
  constructor(message) {
    super(message);
    this.name = "LlmError";
  }
};

// src/modules/llm/qwenProvider.ts
var QwenProvider = class {
  getErrorType(statusCode, _errorBody) {
    if (statusCode === 401 || statusCode === 403) {
      if (_errorBody.includes("invalid_api_key") || _errorBody.includes("Incorrect API key") || _errorBody.includes("invalid access token") || _errorBody.includes("token expired")) {
        return LlmKeyErrorType.TEMPORARY;
      }
      return LlmKeyErrorType.TEMPORARY;
    } else if (statusCode === 429) {
      return LlmKeyErrorType.TEMPORARY;
    } else if (statusCode >= 500) {
      return LlmKeyErrorType.TEMPORARY;
    }
    return LlmKeyErrorType.TEMPORARY;
  }
  async getLlmResponse(messages, systemPrompt, apiKey, modelName) {
    const log = getLogger().child({ module: "QwenProvider" });
    let activeKey = null;
    if (apiKey) {
      activeKey = {
        apiKey,
        apiModel: modelName || config.LLM_MODEL_NAME,
        apiProvider: "qwen",
        errorCount: 0,
        isPermanentlyDisabled: false
      };
    } else {
      activeKey = await LlmKeyManager.getNextAvailableKey("qwen");
    }
    if (!activeKey) {
      const errorMessage = "No Qwen API key available.";
      log.error(errorMessage);
      throw new LlmError2(errorMessage);
    }
    const QWEN_API_BASE_URL = "https://portal.qwen.ai/v1";
    const apiUrls = [
      activeKey.baseUrl ? `${activeKey.baseUrl}/chat/completions` : null,
      `${QWEN_API_BASE_URL}/chat/completions`,
      // Hardcoded endpoint as requested
      "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
      "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
      "https://qwen.aliyuncs.com/v1/chat/completions"
    ].filter(Boolean);
    const qwenMessages = messages.map((msg) => ({
      content: msg.parts.map((part) => part.text).join(""),
      role: msg.role === "user" ? "user" : "assistant"
    }));
    if (systemPrompt) {
      qwenMessages.unshift({ content: systemPrompt, role: "system" });
    }
    const requestBody = {
      max_tokens: 2e3,
      messages: qwenMessages,
      model: modelName || activeKey.apiModel || "qwen3-coder-plus"
    };
    const body = JSON.stringify(requestBody);
    let lastError = null;
    const MAX_RETRIES = 5;
    const INITIAL_DELAY_MS = 1e3;
    const MAX_DELAY_MS = 1e4;
    for (const apiUrl of apiUrls) {
      log.info(`Trying Qwen API endpoint: ${apiUrl}`);
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          if (attempt > 0) {
            const delayMs = Math.min(
              INITIAL_DELAY_MS * Math.pow(2, attempt - 1),
              MAX_DELAY_MS
            );
            log.info(
              `Adding delay of ${delayMs}ms before Qwen API call (attempt ${attempt + 1}/${MAX_RETRIES})`
            );
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
          log.info(
            `[LLM CALL] Sending request to model: ${activeKey.apiModel} via ${activeKey.apiProvider} at ${apiUrl} (attempt ${attempt + 1}/${MAX_RETRIES})`
          );
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3e4);
          const response = await fetch(apiUrl, {
            body,
            headers: {
              Authorization: `Bearer ${activeKey.apiKey}`,
              "Content-Type": "application/json"
            },
            method: "POST",
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (!response.ok) {
            const errorBody = await response.text();
            const errorMessage = `Qwen API request failed with status ${response.status}: ${errorBody}`;
            log.error({ errorBody, status: response.status }, errorMessage);
            const errorType = this.getErrorType(response.status, errorBody);
            if (errorType === LlmKeyErrorType.PERMANENT) {
              await LlmKeyManager.markKeyAsBad(
                activeKey.apiProvider,
                activeKey.apiKey,
                errorType
              );
              throw new LlmError2(errorMessage);
            } else if (attempt < MAX_RETRIES - 1) {
              lastError = new LlmError2(errorMessage);
              log.warn(
                `Temporary error encountered. Retrying... (attempt ${attempt + 1}/${MAX_RETRIES})`
              );
              continue;
            } else {
              await LlmKeyManager.markKeyAsBad(
                activeKey.apiProvider,
                activeKey.apiKey,
                errorType
              );
              throw new LlmError2(errorMessage);
            }
          }
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (content === void 0 || content === null) {
            log.error(
              { response: data },
              "Invalid response structure from Qwen API"
            );
            const errorType = this.getErrorType(
              response.status,
              JSON.stringify(data)
            );
            if (attempt < MAX_RETRIES - 1) {
              lastError = new LlmError2(
                "Invalid response structure from Qwen API. The model may have returned an empty response."
              );
              log.warn(
                `Temporary error encountered. Retrying... (attempt ${attempt + 1}/${MAX_RETRIES})`
              );
              continue;
            } else {
              await LlmKeyManager.markKeyAsBad(
                activeKey.apiProvider,
                activeKey.apiKey,
                errorType
              );
              throw new LlmError2(
                "Invalid response structure from Qwen API. The model may have returned an empty response."
              );
            }
          }
          if (this.isResponseTruncated(content)) {
            log.warn(
              { content },
              "Qwen API response appears to be truncated. Retrying..."
            );
            if (attempt < MAX_RETRIES - 1) {
              lastError = new LlmError2(
                "Qwen API response appears to be truncated. Retrying..."
              );
              continue;
            } else {
              throw new LlmError2(
                "Qwen API response appears to be truncated after all retries."
              );
            }
          }
          const estimatedTokens = messages.reduce(
            (sum, msg) => sum + msg.parts.reduce(
              (partSum, part) => partSum + (part.text?.length || 0),
              0
            ),
            0
          ) / 4;
          log.info(
            {
              apiKey: activeKey.apiKey.substring(0, 5) + "...",
              estimatedTokens,
              provider: activeKey.apiProvider
            },
            "LLM API key status reset."
          );
          return content;
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            log.error("Qwen API request timed out");
            if (attempt < MAX_RETRIES - 1) {
              lastError = new LlmError2("Qwen API request timed out");
              log.warn(
                `Timeout error encountered. Retrying... (attempt ${attempt + 1}/${MAX_RETRIES})`
              );
              continue;
            } else {
              throw new LlmError2("Qwen API request timed out after all retries");
            }
          } else {
            log.error({ error }, "Error calling Qwen API");
            if (attempt < MAX_RETRIES - 1) {
              lastError = error;
              log.warn(
                `Error encountered. Retrying... (attempt ${attempt + 1}/${MAX_RETRIES})`
              );
              continue;
            } else {
              throw error;
            }
          }
        }
      }
    }
    throw lastError || new LlmError2("All Qwen API endpoints failed");
  }
  /**
   * Check if a response appears to be truncated or incomplete
   */
  isResponseTruncated(content) {
    const trimmed = content.trim();
    const truncationIndicators = [
      "\\",
      // Escaped characters at end
      "{",
      // Unclosed object
      "[",
      // Unclosed array
      '"',
      // Unclosed string
      ":",
      // Incomplete key-value pair
      ","
      // Trailing comma
    ];
    if (truncationIndicators.some((indicator) => trimmed.endsWith(indicator))) {
      return true;
    }
    const codeBlockPatterns = [
      "``javascript",
      "``html",
      "``json",
      "function",
      "const ",
      "let ",
      "var ",
      "if (",
      "for (",
      "while ("
    ];
    if (codeBlockPatterns.some((pattern) => trimmed.includes(pattern) && !trimmed.includes("```") && trimmed.length > 100)) {
      return true;
    }
    if (trimmed.includes("Tool Call:") && !trimmed.includes("}")) {
      return true;
    }
    if (trimmed.length > 1e3 && (trimmed.endsWith(".") || trimmed.endsWith("}") || trimmed.endsWith("]")) && !trimmed.includes('"command"') && !trimmed.includes('"thought"') && !trimmed.includes('"answer"')) {
      return true;
    }
    return false;
  }
};

// src/utils/gpt5Provider.ts
init_esm_shims();
var Gpt5Provider = class {
  getErrorType(statusCode, _errorBody) {
    if (statusCode === 401 || statusCode === 403) {
      return LlmKeyErrorType.PERMANENT;
    } else if (statusCode === 429) {
      if (_errorBody.includes("quota") || _errorBody.includes("limit") || _errorBody.includes("exceeded")) {
        return LlmKeyErrorType.PERMANENT;
      }
      return LlmKeyErrorType.TEMPORARY;
    } else if (statusCode >= 500) {
      return LlmKeyErrorType.TEMPORARY;
    } else if (_errorBody.includes("invalid_api_key") || _errorBody.includes("Incorrect API key")) {
      return LlmKeyErrorType.PERMANENT;
    }
    return LlmKeyErrorType.TEMPORARY;
  }
  async getLlmResponse(messages, systemPrompt, apiKey, modelName, gpt5Options) {
    const log = getLogger().child({ module: "Gpt5Provider" });
    let activeKey;
    if (apiKey) {
      activeKey = {
        apiKey,
        apiModel: modelName || getConfig().LLM_MODEL_NAME,
        apiProvider: "openai",
        // GPT-5 is an OpenAI model
        errorCount: 0,
        isPermanentlyDisabled: false
      };
    } else {
      activeKey = await LlmKeyManager.getNextAvailableKey("openai");
    }
    if (!activeKey) {
      const errorMessage = "No LLM API key available.";
      log.error(errorMessage);
      throw new LlmError(errorMessage);
    }
    const apiUrl = activeKey.baseUrl || "https://api.openai.com/v1/responses";
    const gpt5Messages = messages.map((msg) => ({
      content: msg.parts.map((part) => part.text).join(""),
      role: msg.role === "user" ? "user" : "assistant"
    }));
    const inputContent = gpt5Messages.map((m) => m.content).join("\n");
    const requestBody = {
      input: inputContent,
      model: modelName || getConfig().LLM_MODEL_NAME
    };
    if (gpt5Options?.reasoning) {
      requestBody.reasoning = gpt5Options.reasoning;
    }
    if (gpt5Options?.text) {
      requestBody.text = gpt5Options.text;
    }
    if (systemPrompt) {
      requestBody.system_prompt = systemPrompt;
    }
    const body = JSON.stringify(requestBody);
    try {
      log.info(
        `[LLM CALL] Envoi de la requ\xEAte au mod\xE8le GPT-5 : ${modelName || getConfig().LLM_MODEL_NAME} via ${activeKey.apiProvider}`
      );
      const response = await fetch(apiUrl, {
        body,
        headers: {
          Authorization: `Bearer ${activeKey.apiKey}`,
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      if (!response.ok) {
        const errorBody = await response.text();
        const errorMessage = `GPT-5 API request failed with status ${response.status}: ${errorBody}`;
        log.error({ errorBody, status: response.status }, errorMessage);
        const errorType = this.getErrorType(response.status, errorBody);
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType
        );
        throw new LlmError(errorMessage);
      }
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || data.output;
      if (content === void 0 || content === null) {
        log.error(
          { response: data },
          "Invalid response structure from GPT-5 API"
        );
        const errorType = this.getErrorType(
          response.status,
          JSON.stringify(data)
        );
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType
        );
        throw new LlmError(
          "Invalid response structure from GPT-5 API. The model may have returned an empty response."
        );
      }
      const estimatedTokens = messages.reduce(
        (sum, msg) => sum + msg.parts.reduce(
          (partSum, part) => partSum + (part.text?.length || 0),
          0
        ),
        0
      ) + content.length;
      getRedisClientInstance().incrby("leaderboard:tokensSaved", estimatedTokens).catch((_error) => {
        getLogger().error(
          { _error },
          "Failed to increment tokensSaved in Redis"
        );
      });
      await LlmKeyManager.resetKeyStatus(
        activeKey.apiProvider,
        activeKey.apiKey
      );
      return content.trim();
    } catch (_error) {
      if (_error instanceof LlmError) {
        throw _error;
      }
      log.error({ _error }, "Failed to get response from GPT-5");
      if (activeKey) {
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          LlmKeyErrorType.TEMPORARY
        );
      }
      throw new LlmError("Failed to communicate with GPT-5.");
    }
  }
};

// src/utils/llmProvider.ts
var AnthropicProvider = class {
  getErrorType(statusCode, _errorBody) {
    if (statusCode === 401 || statusCode === 403) {
      return LlmKeyErrorType.PERMANENT;
    } else if (statusCode === 429) {
      if (_errorBody.includes("quota") || _errorBody.includes("limit") || _errorBody.includes("exceeded")) {
        return LlmKeyErrorType.PERMANENT;
      }
      return LlmKeyErrorType.TEMPORARY;
    } else if (statusCode >= 500) {
      return LlmKeyErrorType.TEMPORARY;
    } else if (_errorBody.includes("invalid_api_key") || _errorBody.includes("authentication_error")) {
      return LlmKeyErrorType.PERMANENT;
    }
    return LlmKeyErrorType.TEMPORARY;
  }
  async getLlmResponse(messages, systemPrompt, apiKey, modelName) {
    const log = getLogger().child({ module: "AnthropicProvider" });
    let activeKey;
    if (apiKey) {
      activeKey = {
        apiKey,
        apiModel: modelName || getConfig().LLM_MODEL_NAME,
        apiProvider: "anthropic",
        errorCount: 0,
        isPermanentlyDisabled: false
      };
    } else {
      activeKey = await LlmKeyManager.getNextAvailableKey("anthropic");
    }
    if (!activeKey) {
      const errorMessage = "No Anthropic API key available.";
      log.error(errorMessage);
      throw new LlmError(errorMessage);
    }
    const apiUrl = activeKey.baseUrl || "https://api.anthropic.com/v1/messages";
    const anthropicMessages = messages.map((msg) => {
      let role = "user";
      if (msg.role === "model") {
        role = "assistant";
      } else if (msg.role === "tool") {
        return {
          content: `Tool output: ${msg.parts.map((p) => p.text).join("")}`,
          role: "user"
        };
      }
      return {
        content: msg.parts.map((p) => p.text).join(""),
        role
      };
    });
    const requestBody = {
      max_tokens: 4096,
      // A reasonable default for Anthropic models
      messages: anthropicMessages,
      model: modelName || getConfig().LLM_MODEL_NAME
    };
    if (systemPrompt) {
      requestBody.system = systemPrompt;
    }
    const body = JSON.stringify(requestBody);
    try {
      log.info(
        `[LLM CALL] Sending request to model: ${modelName || getConfig().LLM_MODEL_NAME} via ${activeKey.apiProvider}`
      );
      const response = await fetch(apiUrl, {
        body,
        headers: {
          "anthropic-version": "2023-06-01",
          // Required Anthropic API version
          "Content-Type": "application/json",
          "x-api-key": activeKey.apiKey
        },
        method: "POST"
      });
      if (!response.ok) {
        const errorBody = await response.text();
        const errorMessage = `Anthropic API request failed with status ${response.status}: ${errorBody}`;
        log.error({ errorBody, status: response.status }, errorMessage);
        const errorType = this.getErrorType(response.status, errorBody);
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType
        );
        throw new LlmError(errorMessage);
      }
      const data = await response.json();
      const content = data.content?.[0]?.text;
      if (content === void 0 || content === null) {
        log.error(
          { response: data },
          "Invalid response structure from Anthropic API"
        );
        const errorType = this.getErrorType(
          response.status,
          JSON.stringify(data)
        );
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType
        );
        throw new LlmError(
          "Invalid response structure from Anthropic API. The model may have returned an empty response."
        );
      }
      const estimatedTokens = messages.reduce(
        (sum, msg) => sum + msg.parts.reduce(
          (partSum, part) => partSum + (part.text?.length || 0),
          0
        ),
        0
      ) + content.length;
      getRedisClientInstance().incrby("leaderboard:tokensSaved", estimatedTokens).catch((_error) => {
        getLogger().error(
          { _error },
          "Failed to increment tokensSaved in Redis"
        );
      });
      await LlmKeyManager.resetKeyStatus(
        activeKey.apiProvider,
        activeKey.apiKey
      );
      return content.trim();
    } catch (_error) {
      if (_error instanceof LlmError) {
        throw _error;
      }
      log.error({ _error }, "Failed to get response from LLM");
      if (activeKey) {
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          LlmKeyErrorType.TEMPORARY
        );
      }
      throw new LlmError("Failed to communicate with the LLM.");
    }
  }
};
var GeminiProvider = class {
  getErrorType(statusCode, _errorBody) {
    if (statusCode === 401 || statusCode === 403) {
      return LlmKeyErrorType.PERMANENT;
    } else if (statusCode === 429) {
      if (_errorBody.includes("quota") || _errorBody.includes("limit") || _errorBody.includes("exceeded")) {
        return LlmKeyErrorType.PERMANENT;
      }
      return LlmKeyErrorType.TEMPORARY;
    } else if (statusCode >= 500) {
      return LlmKeyErrorType.TEMPORARY;
    } else if (_errorBody.includes("invalid_api_key") || _errorBody.includes("Incorrect API key")) {
      return LlmKeyErrorType.PERMANENT;
    }
    return LlmKeyErrorType.TEMPORARY;
  }
  async getLlmResponse(messages, systemPrompt, apiKey, modelName) {
    const log = getLogger().child({ module: "GeminiProvider" });
    let activeKey;
    if (apiKey) {
      activeKey = {
        apiKey,
        apiModel: modelName || getConfig().LLM_MODEL_NAME,
        apiProvider: "gemini",
        // Assuming provider based on the class
        errorCount: 0,
        isPermanentlyDisabled: false
      };
    } else {
      activeKey = await LlmKeyManager.getNextAvailableKey("gemini");
    }
    if (!activeKey) {
      const errorMessage = "No LLM API key available.";
      log.error(errorMessage);
      throw new LlmError(errorMessage);
    }
    const baseUrl = activeKey.baseUrl || "https://generativelanguage.googleapis.com/v1";
    const apiUrl = `${baseUrl}/models/${modelName || getConfig().LLM_MODEL_NAME}:generateContent?key=${activeKey.apiKey}`;
    const geminiMessages = messages.map((msg) => {
      let role = msg.role;
      let parts = msg.parts;
      if (role === "tool") {
        role = "user";
        parts = [
          {
            text: `Tool output: ${parts.map((p) => p.text).join("")}`
          }
        ];
      }
      return { parts, role };
    });
    if (systemPrompt) {
      const firstUserMessage = geminiMessages.find(
        (msg) => msg.role === "user"
      );
      if (firstUserMessage) {
        firstUserMessage.parts.unshift({ text: systemPrompt + "\n" });
      } else {
        geminiMessages.unshift({
          parts: [{ text: systemPrompt }],
          role: "user"
        });
      }
    }
    const requestBody = {
      contents: geminiMessages
    };
    const body = JSON.stringify(requestBody);
    try {
      log.info(
        `[LLM CALL] Envoi de la requ\xEAte au mod\xE8le : ${modelName || getConfig().LLM_MODEL_NAME} via ${activeKey.apiProvider}`
      );
      const response = await fetch(apiUrl, {
        body,
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      if (!response.ok) {
        const errorBody = await response.text();
        const errorMessage = `Gemini API request failed with status ${response.status}: ${errorBody}`;
        log.error({ errorBody, status: response.status }, errorMessage);
        const errorType = this.getErrorType(response.status, errorBody);
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType
        );
        throw new LlmError(errorMessage);
      }
      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (content === void 0 || content === null) {
        log.error(
          { response: data },
          "Invalid response structure from Gemini API"
        );
        const errorType = this.getErrorType(
          response.status,
          JSON.stringify(data)
        );
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType
        );
        throw new LlmError(
          "Invalid response structure from Gemini API. The model may have returned an empty response."
        );
      }
      const estimatedTokens = messages.reduce(
        (sum, msg) => sum + msg.parts.reduce(
          (partSum, part) => partSum + (part.text?.length || 0),
          0
        ),
        0
      ) + content.length;
      getRedisClientInstance().incrby("leaderboard:tokensSaved", estimatedTokens).catch((_error) => {
        getLogger().error(
          { _error },
          "Failed to increment tokensSaved in Redis"
        );
      });
      await LlmKeyManager.resetKeyStatus(
        activeKey.apiProvider,
        activeKey.apiKey
      );
      return content.trim();
    } catch (_error) {
      if (_error instanceof LlmError) {
        throw _error;
      }
      log.error({ _error }, "Failed to get response from LLM");
      if (activeKey) {
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          LlmKeyErrorType.TEMPORARY
        );
      }
      throw new LlmError("Failed to communicate with the LLM.");
    }
  }
};
var GrokProvider = class {
  getErrorType(statusCode, _errorBody) {
    if (statusCode === 401 || statusCode === 403) {
      return LlmKeyErrorType.PERMANENT;
    } else if (statusCode === 429) {
      if (_errorBody.includes("quota") || _errorBody.includes("limit") || _errorBody.includes("exceeded")) {
        return LlmKeyErrorType.PERMANENT;
      }
      return LlmKeyErrorType.TEMPORARY;
    } else if (statusCode >= 500) {
      return LlmKeyErrorType.TEMPORARY;
    } else if (_errorBody.includes("invalid_api_key") || _errorBody.includes("Incorrect API key")) {
      return LlmKeyErrorType.PERMANENT;
    }
    return LlmKeyErrorType.TEMPORARY;
  }
  async getLlmResponse(messages, systemPrompt, apiKey, modelName) {
    const log = getLogger().child({ module: "GrokProvider" });
    let activeKey;
    if (apiKey) {
      activeKey = {
        apiKey,
        apiModel: modelName || getConfig().LLM_MODEL_NAME,
        apiProvider: "grok",
        errorCount: 0,
        isPermanentlyDisabled: false
      };
    } else {
      activeKey = await LlmKeyManager.getNextAvailableKey("grok");
    }
    if (!activeKey) {
      const errorMessage = "No Grok API key available.";
      log.error(errorMessage);
      throw new LlmError(errorMessage);
    }
    const apiUrl = activeKey.baseUrl || "https://api.grok.com/v1/chat/completions";
    const grokMessages = messages.map((msg) => ({
      content: msg.parts.map((part) => part.text).join(""),
      role: msg.role === "user" ? "user" : "assistant"
    }));
    if (systemPrompt) {
      grokMessages.unshift({ content: systemPrompt, role: "system" });
    }
    const requestBody = {
      messages: grokMessages,
      model: modelName || getConfig().LLM_MODEL_NAME
      // Use modelName if provided, else fallback to config
    };
    const body = JSON.stringify(requestBody);
    try {
      log.info(
        `[LLM CALL] Sending request to model: ${modelName || getConfig().LLM_MODEL_NAME} via ${activeKey.apiProvider}`
      );
      const response = await fetch(apiUrl, {
        body,
        headers: {
          Authorization: `Bearer ${activeKey.apiKey}`,
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      if (!response.ok) {
        const errorBody = await response.text();
        const errorMessage = `Grok API request failed with status ${response.status}: ${errorBody}`;
        log.error({ errorBody, status: response.status }, errorMessage);
        const errorType = this.getErrorType(response.status, errorBody);
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType
        );
        throw new LlmError(errorMessage);
      }
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content === void 0 || content === null) {
        log.error(
          { response: data },
          "Invalid response structure from Grok API"
        );
        const errorType = this.getErrorType(
          response.status,
          JSON.stringify(data)
        );
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType
        );
        throw new LlmError(
          "Invalid response structure from Grok API. The model may have returned an empty response."
        );
      }
      const estimatedTokens = messages.reduce(
        (sum, msg) => sum + msg.parts.reduce(
          (partSum, part) => partSum + (part.text?.length || 0),
          0
        ),
        0
      ) + content.length;
      getRedisClientInstance().incrby("leaderboard:tokensSaved", estimatedTokens).catch((_error) => {
        getLogger().error(
          { _error },
          "Failed to increment tokensSaved in Redis"
        );
      });
      await LlmKeyManager.resetKeyStatus(
        activeKey.apiProvider,
        activeKey.apiKey
      );
      return content.trim();
    } catch (_error) {
      if (_error instanceof LlmError) {
        throw _error;
      }
      log.error({ _error }, "Failed to get response from LLM");
      if (activeKey) {
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          LlmKeyErrorType.TEMPORARY
        );
      }
      throw new LlmError("Failed to communicate with the LLM.");
    }
  }
};
var HuggingFaceProvider = class {
  getErrorType(statusCode, _errorBody) {
    if (statusCode === 401 || statusCode === 403) {
      return LlmKeyErrorType.PERMANENT;
    } else if (statusCode === 429) {
      if (_errorBody.includes("quota") || _errorBody.includes("limit") || _errorBody.includes("exceeded")) {
        return LlmKeyErrorType.PERMANENT;
      }
      return LlmKeyErrorType.TEMPORARY;
    } else if (statusCode >= 500) {
      return LlmKeyErrorType.TEMPORARY;
    } else if (_errorBody.includes("invalid_api_key") || _errorBody.includes("Authorization header is invalid")) {
      return LlmKeyErrorType.PERMANENT;
    }
    return LlmKeyErrorType.TEMPORARY;
  }
  async getLlmResponse(messages, systemPrompt, apiKey, modelName) {
    const log = getLogger().child({ module: "HuggingFaceProvider" });
    let activeKey;
    if (apiKey) {
      activeKey = {
        apiKey,
        apiModel: modelName || getConfig().LLM_MODEL_NAME,
        apiProvider: "huggingface",
        // Assuming provider based on the class
        errorCount: 0,
        isPermanentlyDisabled: false
      };
    } else {
      activeKey = await LlmKeyManager.getNextAvailableKey("huggingface");
    }
    if (!activeKey) {
      const errorMessage = "No LLM API key available.";
      log.error(errorMessage);
      throw new LlmError(errorMessage);
    }
    const baseUrl = activeKey.baseUrl || "https://api-inference.huggingface.co";
    const apiUrl = `${baseUrl}/models/${modelName || getConfig().LLM_MODEL_NAME}`;
    const requestBody = {
      inputs: messages.map((msg) => msg.parts.map((p) => p.text).join("")).join("\n"),
      parameters: {
        max_new_tokens: 4096
        // A reasonable default for HuggingFace models
      }
    };
    const body = JSON.stringify(requestBody);
    try {
      log.info(
        `[LLM CALL] Sending request to model: ${modelName || getConfig().LLM_MODEL_NAME} via ${activeKey.apiProvider}`
      );
      const response = await fetch(apiUrl, {
        body,
        headers: {
          Authorization: `Bearer ${activeKey.apiKey}`,
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      if (!response.ok) {
        const errorBody = await response.text();
        const errorMessage = `HuggingFace API request failed with status ${response.status}: ${errorBody}`;
        log.error({ errorBody, status: response.status }, errorMessage);
        const errorType = this.getErrorType(response.status, errorBody);
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType
        );
        throw new LlmError(errorMessage);
      }
      const data = await response.json();
      const content = data?.[0]?.generated_text;
      if (content === void 0 || content === null) {
        log.error(
          { response: data },
          "Invalid response structure from HuggingFace API"
        );
        const errorType = this.getErrorType(
          response.status,
          JSON.stringify(data)
        );
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType
        );
        throw new LlmError(
          "Invalid response structure from HuggingFace API. The model may have returned an empty response."
        );
      }
      const estimatedTokens = messages.reduce(
        (sum, msg) => sum + msg.parts.reduce(
          (partSum, part) => partSum + (part.text?.length || 0),
          0
        ),
        0
      ) + content.length;
      getRedisClientInstance().incrby("leaderboard:tokensSaved", estimatedTokens).catch((_error) => {
        getLogger().error(
          { _error },
          "Failed to increment tokensSaved in Redis"
        );
      });
      await LlmKeyManager.resetKeyStatus(
        activeKey.apiProvider,
        activeKey.apiKey
      );
      return content.trim();
    } catch (_error) {
      if (_error instanceof LlmError) {
        throw _error;
      }
      log.error({ _error }, "Failed to get response from LLM");
      if (activeKey) {
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          LlmKeyErrorType.TEMPORARY
        );
      }
      throw new LlmError("Failed to communicate with the LLM.");
    }
  }
};
var MistralProvider = class {
  getErrorType(statusCode, _errorBody) {
    if (statusCode === 401 || statusCode === 403) {
      return LlmKeyErrorType.PERMANENT;
    } else if (statusCode === 429) {
      if (_errorBody.includes("quota") || _errorBody.includes("limit") || _errorBody.includes("exceeded")) {
        return LlmKeyErrorType.PERMANENT;
      }
      return LlmKeyErrorType.TEMPORARY;
    } else if (statusCode >= 500) {
      return LlmKeyErrorType.TEMPORARY;
    }
    return LlmKeyErrorType.TEMPORARY;
  }
  async getLlmResponse(messages, systemPrompt, apiKey, modelName) {
    const log = getLogger().child({ module: "MistralProvider" });
    let activeKey;
    if (apiKey) {
      activeKey = {
        apiKey,
        apiModel: modelName || getConfig().LLM_MODEL_NAME,
        apiProvider: "mistral",
        // Assuming provider based on the class
        errorCount: 0,
        isPermanentlyDisabled: false
      };
    } else {
      activeKey = await LlmKeyManager.getNextAvailableKey("mistral");
    }
    if (!activeKey) {
      const errorMessage = "No LLM API key available.";
      log.error(errorMessage);
      throw new LlmError(errorMessage);
    }
    const apiUrl = activeKey.baseUrl || "https://api.mistral.ai/v1/chat/completions";
    const mistralMessages = messages.map((msg) => ({
      content: msg.parts.map((part) => part.text).join(""),
      role: msg.role === "user" ? "user" : "model"
    }));
    if (systemPrompt) {
      mistralMessages.unshift({ content: systemPrompt, role: "system" });
    }
    const requestBody = {
      messages: mistralMessages,
      model: modelName || getConfig().LLM_MODEL_NAME
      // Use modelName if provided, else fallback to config
    };
    const body = JSON.stringify(requestBody);
    try {
      log.info(
        `[LLM CALL] Envoi de la requ\xEAte au mod\xE8le : ${modelName || getConfig().LLM_MODEL_NAME} via ${activeKey.apiProvider}`
      );
      const response = await fetch(apiUrl, {
        body,
        headers: {
          Authorization: `Bearer ${activeKey.apiKey}`,
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      if (!response.ok) {
        const errorBody = await response.text();
        const errorMessage = `Mistral API request failed with status ${response.status}: ${errorBody}`;
        log.error({ errorBody, status: response.status }, errorMessage);
        const errorType = this.getErrorType(response.status, errorBody);
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType
        );
        throw new LlmError(errorMessage);
      }
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content === void 0 || content === null) {
        log.error(
          { response: data },
          "Invalid response structure from Mistral API"
        );
        const errorType = this.getErrorType(
          response.status,
          JSON.stringify(data)
        );
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType
        );
        throw new LlmError(
          "Invalid response structure from Mistral API. The model may have returned an empty response."
        );
      }
      const estimatedTokens = messages.reduce(
        (sum, msg) => sum + msg.parts.reduce(
          (partSum, part) => partSum + (part.text?.length || 0),
          0
        ),
        0
      ) + content.length;
      getRedisClientInstance().incrby("leaderboard:tokensSaved", estimatedTokens).catch((_error) => {
        getLogger().error(
          { _error },
          "Failed to increment tokensSaved in Redis"
        );
      });
      await LlmKeyManager.resetKeyStatus(
        activeKey.apiProvider,
        activeKey.apiKey
      );
      return content.trim();
    } catch (_error) {
      if (_error instanceof LlmError) {
        throw _error;
      }
      log.error({ _error }, "Failed to get response from LLM");
      if (activeKey) {
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          LlmKeyErrorType.TEMPORARY
        );
      }
      throw new LlmError("Failed to communicate with the LLM.");
    }
  }
};
var OpenAIProvider = class {
  getErrorType(statusCode, _errorBody) {
    if (statusCode === 401 || statusCode === 403) {
      return LlmKeyErrorType.PERMANENT;
    } else if (statusCode === 429) {
      if (_errorBody.includes("quota") || _errorBody.includes("limit") || _errorBody.includes("exceeded")) {
        return LlmKeyErrorType.PERMANENT;
      }
      return LlmKeyErrorType.TEMPORARY;
    } else if (statusCode >= 500) {
      return LlmKeyErrorType.TEMPORARY;
    } else if (_errorBody.includes("invalid_api_key") || _errorBody.includes("Incorrect API key")) {
      return LlmKeyErrorType.PERMANENT;
    }
    return LlmKeyErrorType.TEMPORARY;
  }
  async getLlmResponse(messages, systemPrompt, apiKey, modelName) {
    const log = getLogger().child({ module: "OpenAIProvider" });
    let activeKey;
    if (apiKey) {
      activeKey = {
        apiKey,
        apiModel: modelName || getConfig().LLM_MODEL_NAME,
        apiProvider: "openai",
        // Assuming provider based on the class
        errorCount: 0,
        isPermanentlyDisabled: false
      };
    } else {
      activeKey = await LlmKeyManager.getNextAvailableKey("openai");
    }
    if (!activeKey) {
      const errorMessage = "No LLM API key available.";
      log.error(errorMessage);
      throw new LlmError(errorMessage);
    }
    const apiUrl = activeKey.baseUrl || "https://api.openai.com/v1/chat/completions";
    const openaiMessages = messages.map((msg) => ({
      content: msg.parts.map((part) => part.text).join(""),
      role: msg.role === "user" ? "user" : "model"
    }));
    if (systemPrompt) {
      openaiMessages.unshift({ content: systemPrompt, role: "system" });
    }
    const requestBody = {
      messages: openaiMessages,
      model: modelName || getConfig().LLM_MODEL_NAME
      // Use modelName if provided, else fallback to config
    };
    const body = JSON.stringify(requestBody);
    try {
      log.info(
        `[LLM CALL] Envoi de la requ\xEAte au mod\xE8le : ${modelName || getConfig().LLM_MODEL_NAME} via ${activeKey.apiProvider}`
      );
      const response = await fetch(apiUrl, {
        body,
        headers: {
          Authorization: `Bearer ${activeKey.apiKey}`,
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      if (!response.ok) {
        const errorBody = await response.text();
        const errorMessage = `OpenAI API request failed with status ${response.status}: ${errorBody}`;
        log.error({ errorBody, status: response.status }, errorMessage);
        const errorType = this.getErrorType(response.status, errorBody);
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType
        );
        throw new LlmError(errorMessage);
      }
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content === void 0 || content === null) {
        log.error(
          { response: data },
          "Invalid response structure from OpenAI API"
        );
        const errorType = this.getErrorType(
          response.status,
          JSON.stringify(data)
        );
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType
        );
        throw new LlmError(
          "Invalid response structure from OpenAI API. The model may have returned an empty response."
        );
      }
      const estimatedTokens = messages.reduce(
        (sum, msg) => sum + msg.parts.reduce(
          (partSum, part) => partSum + (part.text?.length || 0),
          0
        ),
        0
      ) + content.length;
      getRedisClientInstance().incrby("leaderboard:tokensSaved", estimatedTokens).catch((_error) => {
        getLogger().error(
          { _error },
          "Failed to increment tokensSaved in Redis"
        );
      });
      await LlmKeyManager.resetKeyStatus(
        activeKey.apiProvider,
        activeKey.apiKey
      );
      return content.trim();
    } catch (_error) {
      if (_error instanceof LlmError) {
        throw _error;
      }
      log.error({ _error }, "Failed to get response from LLM");
      if (activeKey) {
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          LlmKeyErrorType.TEMPORARY
        );
      }
      throw new LlmError("Failed to communicate with the LLM.");
    }
  }
};
var OpenRouterProvider = class {
  getErrorType(statusCode, _errorBody) {
    if (statusCode === 401 || statusCode === 403) {
      return LlmKeyErrorType.PERMANENT;
    } else if (statusCode === 429) {
      if (_errorBody.includes("quota") || _errorBody.includes("limit") || _errorBody.includes("exceeded")) {
        return LlmKeyErrorType.PERMANENT;
      }
      return LlmKeyErrorType.TEMPORARY;
    } else if (statusCode >= 500) {
      return LlmKeyErrorType.TEMPORARY;
    } else if (_errorBody.includes("invalid_api_key") || _errorBody.includes("Incorrect API key")) {
      return LlmKeyErrorType.PERMANENT;
    }
    return LlmKeyErrorType.TEMPORARY;
  }
  async getLlmResponse(messages, systemPrompt, apiKey, modelName) {
    const log = getLogger().child({ module: "OpenRouterProvider" });
    let activeKey;
    if (apiKey) {
      activeKey = {
        apiKey,
        apiModel: modelName || getConfig().LLM_MODEL_NAME,
        apiProvider: "openrouter",
        // Assuming provider based on the class
        errorCount: 0,
        isPermanentlyDisabled: false
      };
    } else {
      activeKey = await LlmKeyManager.getNextAvailableKey("openrouter");
    }
    if (!activeKey) {
      const errorMessage = "No LLM API key available.";
      log.error(errorMessage);
      throw new LlmError(errorMessage);
    }
    const apiUrl = activeKey.baseUrl || "https://openrouter.ai/api/v1/chat/completions";
    const openRouterMessages = messages.map((msg) => ({
      content: msg.parts.map((part) => part.text).join(""),
      role: msg.role === "user" ? "user" : "model"
    }));
    if (systemPrompt) {
      openRouterMessages.unshift({ content: systemPrompt, role: "system" });
    }
    const requestBody = {
      messages: openRouterMessages,
      model: modelName || getConfig().LLM_MODEL_NAME
      // Use modelName if provided, else fallback to config
    };
    const body = JSON.stringify(requestBody);
    try {
      await new Promise(
        (resolve) => setTimeout(resolve, getConfig().LLM_REQUEST_DELAY_MS)
      );
      log.info(
        `[LLM CALL] Envoi de la requ\xEAte au mod\xE8le : ${modelName || getConfig().LLM_MODEL_NAME} via ${activeKey.apiProvider}`
      );
      const response = await fetch(apiUrl, {
        body,
        headers: {
          Authorization: `Bearer ${activeKey.apiKey}`,
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      if (!response.ok) {
        const errorBody = await response.text();
        const errorMessage = `OpenRouter API request failed with status ${response.status}: ${errorBody}`;
        log.error({ errorBody, status: response.status }, errorMessage);
        const errorType = this.getErrorType(response.status, errorBody);
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType
        );
        throw new LlmError(errorMessage);
      }
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content === void 0 || content === null) {
        log.error(
          { response: data },
          "Invalid response structure from OpenRouter API"
        );
        const errorType = this.getErrorType(
          response.status,
          JSON.stringify(data)
        );
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          errorType
        );
        throw new LlmError(
          "Invalid response structure from OpenRouter API. The model may have returned an empty response."
        );
      }
      const estimatedTokens = messages.reduce(
        (sum, msg) => sum + msg.parts.reduce(
          (partSum, part) => partSum + (part.text?.length || 0),
          0
        ),
        0
      ) + content.length;
      getRedisClientInstance().incrby("leaderboard:tokensSaved", estimatedTokens).catch((_error) => {
        getLogger().error(
          { _error },
          "Failed to increment tokensSaved in Redis"
        );
      });
      await LlmKeyManager.resetKeyStatus(
        activeKey.apiProvider,
        activeKey.apiKey
      );
      return content.trim();
    } catch (_error) {
      if (_error instanceof LlmError) {
        throw _error;
      }
      log.error({ _error }, "Failed to get response from LLM");
      if (activeKey) {
        await LlmKeyManager.markKeyAsBad(
          activeKey.apiProvider,
          activeKey.apiKey,
          LlmKeyErrorType.TEMPORARY
        );
      }
      throw new LlmError("Failed to communicate with the LLM.");
    }
  }
};
function getLlmProvider(providerName, modelName) {
  let currentLlmProvider;
  if (providerName === "openai" && modelName && modelName.startsWith("gpt-5")) {
    return new Gpt5Provider();
  }
  switch (providerName) {
    case "anthropic":
      currentLlmProvider = new AnthropicProvider();
      break;
    case "gemini":
      currentLlmProvider = new GeminiProvider();
      break;
    case "grok":
      currentLlmProvider = new GrokProvider();
      break;
    case "huggingface":
      currentLlmProvider = new HuggingFaceProvider();
      break;
    case "mistral":
      currentLlmProvider = new MistralProvider();
      break;
    case "openai":
      currentLlmProvider = new OpenAIProvider();
      break;
    case "openrouter":
      currentLlmProvider = new OpenRouterProvider();
      break;
    case "qwen":
      currentLlmProvider = new QwenProvider();
      break;
    default:
      getLogger().warn(
        `Unknown LLM provider requested: ${providerName}. Defaulting to GeminiProvider.`
      );
      currentLlmProvider = new GeminiProvider();
      break;
  }
  return currentLlmProvider;
}

export {
  LlmError2 as LlmError,
  LlmKeyErrorType,
  LlmKeyManager,
  LlmError as LlmError2,
  getLlmProvider
};
