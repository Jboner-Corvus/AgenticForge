import { useState, useEffect, useCallback } from 'react';
import { useCombinedStore } from '../../../store';
import { getLlmApiKeysApi, getMasterLlmApiKeyApi } from '../../../lib/api';
import type { LlmApiKey, BackendLlmApiKey } from '../../../store/types';

export interface UseLlmKeysReturn {
  // Data
  backendKeys: BackendLlmApiKey[];
  masterKey: LlmApiKey | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  refreshKeys: () => Promise<void>;
  testKey: (keyIndex: number) => Promise<void>;
  isTestingKey: (keyIndex: number) => boolean;
}

/**
 * Hook pour gérer les clés LLM backend
 */
export const useLlmKeys = (): UseLlmKeysReturn => {
  const [backendKeys, setBackendKeys] = useState<BackendLlmApiKey[]>([]);
  const [masterKey, setMasterKey] = useState<LlmApiKey | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testingKeyIndex, setTestingKeyIndex] = useState<number | null>(null);

  const authToken = useCombinedStore((state) => state.authToken);

  const loadKeys = useCallback(async () => {
    if (!authToken) return;

    setIsLoading(true);
    setError(null);

    try {
      // Charger les clés utilisateur
      const keys = await getLlmApiKeysApi(authToken, null);
      const convertedKeys: BackendLlmApiKey[] = keys.map((key) => ({
        apiKey: key.key || '',
        apiModel: key.model || '',
        apiProvider: key.provider || '',
        baseUrl: key.baseUrl,
        errorCount: key.usageStats?.failedRequests || 0,
        lastUsed: key.usageStats?.lastUsed
          ? new Date(key.usageStats.lastUsed).getTime()
          : undefined,
        priority: key.priority,
        isPermanentlyDisabled: (key.usageStats?.failedRequests || 0) > 10,
      }));

      setBackendKeys(convertedKeys);

      // Charger la clé maître
      try {
        const masterKeyData = await getMasterLlmApiKeyApi(authToken, null);
        setMasterKey(masterKeyData);
      } catch (masterError) {
        console.warn('Failed to load master key:', masterError);
        setMasterKey(null);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load keys';
      setError(errorMessage);
      console.error('Failed to load LLM keys:', err);
    } finally {
      setIsLoading(false);
    }
  }, [authToken]);

  const refreshKeys = useCallback(async () => {
    await loadKeys();
  }, [loadKeys]);

  const testKey = useCallback(
    async (keyIndex: number) => {
      if (!authToken || keyIndex >= backendKeys.length) return;

      setTestingKeyIndex(keyIndex);
      try {
        const keyToTest = backendKeys[keyIndex];
        // TODO: Implement key testing logic
        console.log('Testing key:', keyToTest.apiProvider);

        // Simulate testing delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // TODO: Update key status based on test result
        await refreshKeys();
      } catch (err) {
        console.error('Failed to test key:', err);
      } finally {
        setTestingKeyIndex(null);
      }
    },
    [authToken, backendKeys, refreshKeys],
  );

  const isTestingKey = useCallback(
    (keyIndex: number) => {
      return testingKeyIndex === keyIndex;
    },
    [testingKeyIndex],
  );

  // Load keys on mount and when auth token changes
  useEffect(() => {
    if (authToken) {
      loadKeys();
    }
  }, [authToken, loadKeys]);

  return {
    backendKeys,
    masterKey,
    isLoading,
    error,
    refreshKeys,
    testKey,
    isTestingKey,
  };
};
