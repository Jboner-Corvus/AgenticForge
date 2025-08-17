import { getLogger } from '../../logger.ts';
import { getRedisClientInstance } from '../redis/redisClient.ts';
import { config } from '../../config.ts'; // Import config to access environment variables
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
}

// Constants for the master key from environment
// Using a specific env var allows overriding the default LLM_API_KEY if needed
const MASTER_LLM_API_KEY_ENV_VAR = 'MASTER_LLM_API_KEY';
const DEFAULT_MASTER_KEY_PROVIDER = 'google-flash'; // Align with .env.example LLM_MODEL_NAME=gemini-2.5-flash
const DEFAULT_MASTER_KEY_MODEL = 'gemini-2.5-flash'; // Align with .env.example

const LLM_API_KEYS_REDIS_KEY = 'llmApiKeys';
const MAX_TEMPORARY_ERROR_COUNT = 8; // Max consecutive temporary errors before disabling key temporarily
const TEMPORARY_DISABLE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export class LlmKeyManager {
  public static async addKey(
    apiProvider: string,
    apiKey: string,
    apiModel: string,
    baseUrl?: string,
  ): Promise<void> {
    const keys = await this.getKeys();
    
    // 🚨 VÉRIFICATION ANTI-DOUBLON
    // Vérifier si la clé existe déjà (même provider + clé + modèle)
    const existingKeyIndex = keys.findIndex(
      (k) => k.apiProvider === apiProvider && 
             k.apiKey === apiKey && 
             k.apiModel === apiModel &&
             (k.baseUrl || '') === (baseUrl || '')
    );
    
    if (existingKeyIndex !== -1) {
      getLogger().warn(
        { apiKey: apiKey.substring(0, 10) + '...', apiModel, apiProvider, baseUrl },
        'LLM API key already exists - updating existing entry instead of creating duplicate.',
      );
      
      // Mettre à jour la clé existante au lieu de créer un doublon
      const existingKey = keys[existingKeyIndex];
      existingKey.baseUrl = baseUrl;
      // Réinitialiser les compteurs d'erreur si la clé est re-ajoutée
      existingKey.errorCount = 0;
      existingKey.isPermanentlyDisabled = false;
      existingKey.isDisabledUntil = undefined;
      
      await this.saveKeys(keys);
      getLogger().info(
        { apiKey: apiKey.substring(0, 10) + '...', apiModel, apiProvider, baseUrl },
        'LLM API key updated (duplicate avoided).',
      );
      return;
    }
    
    // Si pas de doublon, ajouter la nouvelle clé
    keys.push({ apiKey, apiModel, apiProvider, baseUrl, errorCount: 0 });
    await this.saveKeys(keys);
    getLogger().info(
      { apiKey: apiKey.substring(0, 10) + '...', apiModel, apiProvider, baseUrl },
      'LLM API key added.',
    );
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
      {
        baseUrl: nextKey.baseUrl,
        model: nextKey.apiModel,
        provider: nextKey.apiProvider,
      },
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

  public static async saveKeys(keys: LlmApiKey[]): Promise<void> {
    await getRedisClientInstance().del(LLM_API_KEYS_REDIS_KEY);
    if (keys.length > 0) {
      await getRedisClientInstance().rpush(
        LLM_API_KEYS_REDIS_KEY,
        ...keys.map((key) => JSON.stringify(key)),
      );
    }
  }

  /**
   * Supprime automatiquement les doublons des clés LLM existantes.
   * Cette méthode doit être appelée au démarrage du serveur.
   */
  public static async deduplicateKeys(): Promise<{
    originalCount: number;
    uniqueCount: number;
    duplicatesRemoved: number;
  }> {
    const keys = await this.getKeys();
    const originalCount = keys.length;
    
    if (originalCount === 0) {
      return { originalCount: 0, uniqueCount: 0, duplicatesRemoved: 0 };
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
            provider: key.apiProvider, 
            model: key.apiModel,
            keyPrefix: key.apiKey.substring(0, 10) + '...' 
          },
          'Clé LLM unique conservée'
        );
      } else {
        getLogger().warn(
          { 
            provider: key.apiProvider, 
            model: key.apiModel,
            keyPrefix: key.apiKey.substring(0, 10) + '...' 
          },
          'Doublon de clé LLM supprimé'
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
          originalCount, 
          uniqueCount, 
          duplicatesRemoved 
        },
        '🧹 Dédoublonnage automatique des clés LLM terminé'
      );
    } else {
      getLogger().debug('Aucun doublon de clé LLM trouvé');
    }
    
    return { originalCount, uniqueCount, duplicatesRemoved };
  }

  /**
   * Synchronise la clé API maîtresse définie dans les variables d'environnement.
   * Cette clé est ajoutée ou mise à jour en tête de la liste pour assurer sa priorité.
   * Elle sert de solution de secours automatique si aucune autre clé n'est disponible.
   * 
   * @returns Un objet indiquant si la clé a été ajoutée, mise à jour ou ignorée.
   */
  public static async syncEnvMasterKey(): Promise<{ action: 'added' | 'updated' | 'ignored' | 'error', message: string }> {
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
      apiProvider: DEFAULT_MASTER_KEY_PROVIDER,
      apiModel: DEFAULT_MASTER_KEY_MODEL,
      errorCount: 0,
      // Note: lastUsed is intentionally left undefined or will be updated to make it 'recent'
    };

    try {
      // 3. Récupérer la liste actuelle des clés
      let existingKeys = await this.getKeys();
      const originalKeyCount = existingKeys.length;

      // 4. Vérifier si la clé maîtresse existe déjà
      const masterKeyIndex = existingKeys.findIndex(
        k => k.apiProvider === masterKeyData.apiProvider && 
             k.apiKey === masterKeyData.apiKey && 
             k.apiModel === masterKeyData.apiModel
      );

      if (masterKeyIndex !== -1) {
        // 4a. La clé existe - la mettre à jour et la déplacer en tête
        const existingMasterKey = existingKeys[masterKeyIndex];
        
        // Mettre à jour les champs pertinents
        existingMasterKey.lastUsed = Date.now(); // Marquer comme récemment utilisée
        
        // Réinitialiser les erreurs si la clé était désactivée, pour lui donner une nouvelle chance
        // Cela permet de réutiliser la clé maîtresse si elle avait été temporairement désactivée
        if (existingMasterKey.isPermanentlyDisabled || (existingMasterKey.isDisabledUntil && existingMasterKey.isDisabledUntil > Date.now())) {
            logger.info({ provider: existingMasterKey.apiProvider, apiKeyPrefix: existingMasterKey.apiKey.substring(0, 5) + '...' }, 
                        'La clé maîtresse était désactivée, réinitialisation de son statut.');
            existingMasterKey.errorCount = 0;
            existingMasterKey.isDisabledUntil = undefined;
            existingMasterKey.isPermanentlyDisabled = false;
        }
        
        // Retirer la clé de son ancienne position
        const [updatedMasterKey] = existingKeys.splice(masterKeyIndex, 1);
        
        // Ajouter la clé mise à jour en tête de liste
        existingKeys.unshift(updatedMasterKey);
        
        await this.saveKeys(existingKeys);
        const msg = `Clé maîtresse déjà présente. Statut mis à jour et placée en tête de liste.`;
        logger.info({ provider: masterKeyData.apiProvider, apiKeyPrefix: masterKeyData.apiKey.substring(0, 5) + '...' }, msg);
        return { action: 'updated', message: msg };
        
      } else {
        // 4b. La clé n'existe pas - l'ajouter en tête de liste
        // S'assurer qu'elle est active
        masterKeyData.isPermanentlyDisabled = false;
        masterKeyData.isDisabledUntil = undefined;
        masterKeyData.lastUsed = Date.now(); // Marquer comme récemment utilisée
        
        existingKeys.unshift(masterKeyData);
        await this.saveKeys(existingKeys);
        
        const msg = `Nouvelle clé maîtresse ajoutée en tête de liste.`;
        logger.info({ provider: masterKeyData.apiProvider, apiKeyPrefix: masterKeyData.apiKey.substring(0, 5) + '...' }, msg);
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
    totalKeys: number; 
    activeKeys: number; 
    testedKeys: number; 
    successfulTests: number; 
    failedTests: number;
    report: string 
  }> {
    const logger = getLogger();
    const reportLines: string[] = [];
    let successfulTests = 0;
    let failedTests = 0;
    let testedKeys = 0;

    try {
      const keys = await this.getKeys();
      const activeKeys = keys.filter(k => !k.isPermanentlyDisabled && (!k.isDisabledUntil || k.isDisabledUntil <= Date.now())).length;
      
      reportLines.push(`🔍 Rapport de test de toutes les clés (dryRun: ${dryRun})`);
      reportLines.push(`   - Clés totales: ${keys.length}`);
      reportLines.push(`   - Clés actives: ${activeKeys}`);

      // Itérer sur une copie pour éviter les modifications pendant l'itération
      const keysToTest = [...keys]; 

      for (const key of keysToTest) {
        // Sauter les clés désactivées de manière permanente
        if (key.isPermanentlyDisabled) {
            reportLines.push(`⏭️ Clé sautée (désactivée de manière permanente): ${key.apiProvider} (${key.apiKey.substring(0, 5)}...)`);
            continue;
        }
        
        // Sauter les clés désactivées temporairement
        if (key.isDisabledUntil && key.isDisabledUntil > Date.now()) {
            const timeLeftSec = Math.ceil((key.isDisabledUntil - Date.now()) / 1000);
            reportLines.push(`⏭️ Clé sautée (désactivée temporairement, ${timeLeftSec}s restantes): ${key.apiProvider} (${key.apiKey.substring(0, 5)}...)`);
            continue;
        }

        testedKeys++;
        reportLines.push(`🧪 Test de la clé: ${key.apiProvider} - ${key.apiModel} (${key.apiKey.substring(0, 5)}...)`);

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
          reportLines.push(`   ❌ Erreur lors du test de ${key.apiProvider}: ${testError.message}`);
          logger.warn({ err: testError, provider: key.apiProvider }, 'Erreur non critique lors du test de la clé');
          
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
        totalKeys: keys.length,
        activeKeys,
        testedKeys,
        successfulTests,
        failedTests,
        report: finalReport
      };

    } catch (error: any) {
      const errorMsg = `Erreur fatale lors du test de toutes les clés: ${error.message}`;
      logger.error({ err: error }, errorMsg);
      return {
        totalKeys: 0,
        activeKeys: 0,
        testedKeys: 0,
        successfulTests: 0,
        failedTests: 0,
        report: errorMsg
      };
    }
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
