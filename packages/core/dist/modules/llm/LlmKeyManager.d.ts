type LlmKeyErrorType = 'permanent' | 'temporary';
declare const LlmKeyErrorType: {
    PERMANENT: "permanent";
    TEMPORARY: "temporary";
};
interface LlmApiKey {
    apiKey: string;
    apiModel: string;
    apiProvider: string;
    baseUrl?: string;
    errorCount: number;
    isDisabledUntil?: number;
    isPermanentlyDisabled?: boolean;
    lastUsed?: number;
    priority?: number;
    lastError?: string;
    temporaryDisabledUntil?: number;
}
declare class LlmKeyManager {
    private static apiKeys;
    private static lastUsedIndex;
    private static populateApiKeysMap;
    static addKey(apiProvider: string, apiKey: string, apiModel: string, baseUrl?: string): Promise<void>;
    /**
     * Supprime automatiquement les doublons des clés LLM existantes.
     * Cette méthode doit être appelée au démarrage du serveur.
     */
    static deduplicateKeys(): Promise<{
        duplicatesRemoved: number;
        originalCount: number;
        uniqueCount: number;
    }>;
    static getKeyHierarchy(): Promise<{
        [key: string]: number;
    }>;
    static getKeysForApi(): Promise<LlmApiKey[]>;
    /**
     * Gets the next available API key for a provider.
     * @param provider The LLM provider.
     * @returns A promise that resolves to the next available API key, or null if none are available.
     */
    static getNextAvailableKey(provider: string): Promise<LlmApiKey | null>;
    static hasAvailableKeys(providerName: string): Promise<boolean>;
    /**
     * Cleans up and resets failed keys that might be recoverable
     */
    static cleanupFailedKeys(provider?: string): Promise<{
        cleaned: number;
        total: number;
    }>;
    /**
     * Marks an API key as bad based on the error type.
     * @param provider The LLM provider.
     * @param apiKey The API key to mark.
     * @param errorType The type of error encountered.
     */
    static markKeyAsBad(provider: string, apiKey: string, errorType: LlmKeyErrorType): Promise<void>;
    static removeKey(index: number): Promise<void>;
    static resetKeyStatus(provider: string, key: string): Promise<void>;
    static saveKeys(keys: LlmApiKey[]): Promise<void>;
    static setKeyHierarchy(hierarchy: {
        [key: string]: number;
    }): Promise<void>;
    /**
     * Synchronise la clé API maîtresse définie dans les variables d'environnement.
     * Cette clé est ajoutée ou mise à jour en tête de la liste pour assurer sa priorité.
     * Elle sert de solution de secours automatique si aucune autre clé n'est disponible.
     *
     * @returns Un objet indiquant si la clé a été ajoutée, mise à jour ou ignorée.
     */
    static syncEnvMasterKey(): Promise<{
        action: 'added' | 'error' | 'ignored' | 'updated';
        message: string;
    }>;
    /**
     * Teste de manière non-intrusive toutes les clés pour vérifier leur disponibilité.
     * Cette méthode est destinée à être utilisée pour une rotation proactive future.
     * Actuellement, elle s'exécute en mode "dry-run" pour la journalisation uniquement.
     *
     * @param dryRun - Si true (par défaut), ne modifie pas l'état des clés, se contente de logger.
     * @returns Un rapport sur l'état des tests.
     */
    static testAllKeys(dryRun?: boolean): Promise<{
        activeKeys: number;
        failedTests: number;
        report: string;
        successfulTests: number;
        testedKeys: number;
        totalKeys: number;
    }>;
    private static getKeys;
    /**
     * Gets keys with robust fallback mechanisms
     */
    private static getKeysWithFallback;
    /**
     * Creates a temporary key from environment variables
     */
    private static createEnvironmentKey;
    /**
     * Fallback method for getting environment key
     */
    private static getEnvironmentFallbackKey;
    /**
     * Ensures master key is synced from environment to Redis
     */
    private static ensureMasterKeySync;
    private static getKeysWithHierarchy;
    /**
     * Simule un test rapide de disponibilité d'une clé.
     * Dans une implémentation future, cela ferait un vrai appel à l'API du fournisseur.
     * @returns Une promesse résolue avec `true` si la clé est considérée comme disponible.
     */
    private static simulateKeyTest;
}

export { type LlmApiKey, LlmKeyErrorType, LlmKeyManager };
