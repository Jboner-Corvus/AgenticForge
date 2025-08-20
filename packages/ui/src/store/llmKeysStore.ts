import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useUIStore } from './uiStore';

// TYPES POUR LES CLÉS LLM
export interface LLMProvider {
  id: string;
  name: string;
  displayName: string;
  description: string;
  website: string;
  logoUrl?: string;
  keyFormat: string;
  testEndpoint?: string;
  supportedModels: string[];
  isActive: boolean;
}

export interface LLMKeyUsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  lastUsed?: string;
  averageResponseTime: number;
  errorRate: number;
}

export interface LLMKey {
  id: string;
  providerId: string;
  providerName: string;
  keyName: string;
  keyValue: string;
  isEncrypted: boolean;
  isActive: boolean;
  priority: number; // 1 = haute priorité, 10 = basse priorité
  createdAt: string;
  updatedAt: string;
  lastUsed?: string;
  usageCount: number;
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  usageStats?: LLMKeyUsageStats;
  metadata: {
    environment: 'universal';
    tags: string[];
    description?: string;
  };
}

export interface LLMKeyStats {
  totalKeys: number;
  activeKeys: number;
  providersCount: number;
  totalUsage: number;
  lastSync: string;
}

export interface LLMKeysState {
  // Data
  keys: LLMKey[];
  providers: LLMProvider[];
  stats: LLMKeyStats;
  
  // UI State
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  searchTerm: string;
  selectedProvider: string | null;
  showInactiveKeys: boolean;
  
  // Actions
  fetchKeys: () => Promise<void>;
  fetchProviders: () => Promise<void>;
  addKey: (key: Omit<LLMKey, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => Promise<void>;
  updateKey: (id: string, updates: Partial<LLMKey>) => Promise<void>;
  deleteKey: (id: string) => Promise<void>;
  toggleKeyStatus: (id: string) => Promise<void>;
  testKey: (id: string) => Promise<boolean>;
  syncWithRedis: () => Promise<void>;
  importKeysFromRedis: () => Promise<void>;
  exportKeysToRedis: () => Promise<void>;
  cleanupDuplicates: () => Promise<void>;
  forceDeduplication: () => void;
  
  // UI Actions
  setSearchTerm: (term: string) => void;
  setSelectedProvider: (providerId: string | null) => void;
  toggleShowInactiveKeys: () => void;
  clearError: () => void;
  
  // Computed
  getFilteredKeys: () => LLMKey[];
  getKeysByProvider: (providerId: string) => LLMKey[];
  getActiveKeyCount: () => number;
  getBestAvailableKey: (providerId: string) => LLMKey | null;
  updateKeyUsage: (keyId: string, success: boolean, responseTime: number) => void;
}

// PROVIDERS PAR DÉFAUT
const DEFAULT_PROVIDERS: LLMProvider[] = [
  {
    id: 'openai',
    name: 'openai',
    displayName: 'OpenAI',
    description: 'GPT models including GPT-4, GPT-3.5, and DALL-E',
    website: 'https://openai.com',
    keyFormat: 'sk-...',
    testEndpoint: '/v1/models',
    supportedModels: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'dall-e-3', 'whisper-1'],
    isActive: true
  },
  {
    id: 'anthropic',
    name: 'anthropic',
    displayName: 'Anthropic',
    description: 'Claude models for advanced AI assistance',
    website: 'https://anthropic.com',
    keyFormat: 'sk-ant-...',
    testEndpoint: '/v1/models',
    supportedModels: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    isActive: true
  },
  {
    id: 'google-flash',
    name: 'google',
    displayName: 'Google Gemini Flash',
    description: 'Gemini 2.5 Flash - Fast and efficient model',
    website: 'https://ai.google.dev',
    keyFormat: 'AI...',
    testEndpoint: '/v1/models',
    supportedModels: ['gemini-2.5-flash'],
    isActive: true
  },
  {
    id: 'gemini',
    name: 'google',
    displayName: 'Gemini',
    description: 'Gemini 2.5 Pro - Advanced reasoning model',
    website: 'https://ai.google.dev',
    keyFormat: 'AI...',
    testEndpoint: '/v1/models',
    supportedModels: ['gemini-2.5-pro'],
    isActive: true
  },
  {
    id: 'xai',
    name: 'xai',
    displayName: 'xAI Grok',
    description: 'Grok-4 advanced reasoning model',
    website: 'https://x.ai',
    keyFormat: 'xai-...',
    testEndpoint: '/v1/models',
    supportedModels: ['grok-4'],
    isActive: true
  },
  {
    id: 'qwen',
    name: 'qwen',
    displayName: 'Qwen',
    description: 'Qwen3 Coder Plus - Advanced coding model',
    website: 'https://portal.qwen.ai',
    keyFormat: '...',
    testEndpoint: 'https://portal.qwen.ai/v1/chat/completions',
    supportedModels: ['qwen3-coder-plus'],
    isActive: true
  },
  {
    id: 'openrouter',
    name: 'openrouter',
    displayName: 'OpenRouter',
    description: 'Access to multiple AI models via unified API - GLM-4.5-Air Free',
    website: 'https://openrouter.ai',
    keyFormat: 'sk-or-...',
    testEndpoint: 'https://openrouter.ai/api/v1/models',
    supportedModels: ['z-ai/glm-4.5-air:free'],
    isActive: true
  }
];

// API ENDPOINTS - Unified endpoint
const API_BASE = '/api/llm-keys';

// HELPER FUNCTION FOR AUTH HEADERS
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Get token from UI store
  const uiStore = useUIStore.getState();
  const token = uiStore.getValidAuthToken();
  
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  return headers;
}

export const useLLMKeysStore = create<LLMKeysState>()(
  persist(
    (set, get) => ({
      // Initial state
      keys: [],
      providers: DEFAULT_PROVIDERS,
      stats: {
        totalKeys: 0,
        activeKeys: 0,
        providersCount: 0,
        totalUsage: 0,
        lastSync: new Date().toISOString()
      },
      
      isLoading: false,
      isSyncing: false,
      error: null,
      searchTerm: '',
      selectedProvider: null,
      showInactiveKeys: false,

      // Fetch keys from backend/Redis
      fetchKeys: async () => {
        set({ isLoading: true, error: null });
        try {
          const headers = getAuthHeaders();
          
          const response = await fetch(`${API_BASE}`, {
            headers
          });
          
          if (!response.ok) {
            if (response.status === 401) {
              // Handle unauthorized access
              useUIStore.getState().setAuthToken(null);
              throw new Error('Unauthorized access - please check your authentication token');
            }
            throw new Error(`Failed to fetch keys: ${response.status} ${response.statusText}`);
          }
          
          const rawBackendKeys = await response.json();
          
          // Define the backend key format interface
          interface BackendKey {
            apiProvider: string;
            apiKey: string;
            isPermanentlyDisabled: boolean;
            lastUsed?: string;
            errorCount?: number;
            apiModel?: string;
          }
          
          // Transform backend format to frontend format with better validation
          const rawKeys: LLMKey[] = rawBackendKeys.map((backendKey: BackendKey, index: number) => {
            // Validate required fields
            if (!backendKey.apiProvider || !backendKey.apiKey) {
              console.warn('Skipping invalid key entry:', backendKey);
              return null;
            }
            
            return {
              id: `${backendKey.apiProvider}-${index}-${Date.now()}`,
              providerId: backendKey.apiProvider,
              providerName: backendKey.apiProvider,
              keyName: backendKey.apiModel ? `${backendKey.apiProvider} - ${backendKey.apiModel}` : `Key ${index + 1}`,
              keyValue: backendKey.apiKey,
              isEncrypted: false,
              isActive: !backendKey.isPermanentlyDisabled,
              priority: 5, // Default priority
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastUsed: backendKey.lastUsed ? new Date(backendKey.lastUsed).toISOString() : undefined,
              usageCount: backendKey.errorCount || 0,
              usageStats: {
                totalRequests: backendKey.errorCount || 0,
                successfulRequests: 0,
                failedRequests: backendKey.errorCount || 0,
                averageResponseTime: 0,
                errorRate: backendKey.errorCount ? 1 : 0
              },
              metadata: {
                environment: 'universal' as const,
                tags: [backendKey.apiModel || 'unknown'],
                description: `${backendKey.apiProvider} - ${backendKey.apiModel || 'unknown'}`
              }
            };
          }).filter((key: LLMKey | null): key is LLMKey => key !== null); // Filter out null values
          
          // Remove duplicates with improved algorithm including apiModel + baseUrl
          const keysMap = new Map<string, LLMKey>();
          rawKeys.forEach((key: LLMKey) => {
            // Create comprehensive key for deduplication including model and description
            const apiModel = key.metadata?.tags?.[0] || '';
            const description = key.metadata?.description || '';
            const primaryKey = `${key.providerId}|${key.keyValue}|${apiModel}|${description}`;
            
            if (!keysMap.has(primaryKey)) {
              keysMap.set(primaryKey, key);
            } else {
              // If duplicate found, keep the active one or the one with more recent usage
              const existing = keysMap.get(primaryKey)!;
              if (key.isActive && !existing.isActive) {
                keysMap.set(primaryKey, key);
              } else if ((key.lastUsed || '') > (existing.lastUsed || '')) {
                keysMap.set(primaryKey, key);
              } else if (key.usageCount > existing.usageCount) {
                keysMap.set(primaryKey, key);
              }
            }
          });
          const keys = Array.from(keysMap.values());
          
          // Sort keys by priority (lower number = higher priority)
          keys.sort((a, b) => a.priority - b.priority);
          
          // Get unique providers from keys
          const uniqueProviders = Array.from(new Set(keys.map(k => k.providerId)));
          
          const stats = {
            totalKeys: keys.length,
            activeKeys: keys.filter(k => k.isActive).length,
            providersCount: uniqueProviders.length,
            totalUsage: keys.reduce((sum, k) => sum + k.usageCount, 0),
            lastSync: new Date().toISOString()
          };
          
          set({ keys, stats, isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('Error fetching keys:', error);
          set({ 
            error: `Failed to load LLM keys: ${errorMessage}`,
            isLoading: false 
          });
        }
      },

      fetchProviders: async () => {
        try {
          const response = await fetch(`${API_BASE}/providers`);
          if (response.ok) {
            const providers: LLMProvider[] = await response.json();
            set({ providers });
          }
        } catch (error) {
          console.warn('Failed to fetch providers, using defaults');
        }
      },

      // Add new key - fixed race condition
      addKey: async (keyData) => {
        const state = get();
        
        // Prevent multiple concurrent additions
        if (state.isLoading) {
          throw new Error('Another key operation is in progress. Please wait.');
        }
        
        set({ isLoading: true, error: null });
        try {
          // Validate required fields
          if (!keyData.providerId || !keyData.keyValue) {
            throw new Error('Provider and API key are required');
          }
          
          // Use comprehensive duplicate check (same as deduplication algorithm)
          const apiModel = keyData.metadata?.tags?.[0] || '';
          const description = keyData.metadata?.description || '';
          const duplicateCheck = `${keyData.providerId}|${keyData.keyValue}|${apiModel}|${description}`;
          
          const currentKeys = get().keys;
          const existingKey = currentKeys.find(key => {
            const keyApiModel = key.metadata?.tags?.[0] || '';
            const keyDescription = key.metadata?.description || '';
            const keyId = `${key.providerId}|${key.keyValue}|${keyApiModel}|${keyDescription}`;
            return keyId === duplicateCheck;
          });
          
          if (existingKey) {
            throw new Error('This API key already exists for this provider and model');
          }

          const response = await fetch(`${API_BASE}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              ...keyData,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              usageCount: 0,
              priority: keyData.priority || 5, // Default priority if not provided
              usageStats: {
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                averageResponseTime: 0,
                errorRate: 0
              }
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Failed to add key: ${response.status} ${response.statusText}`);
          }
          
          // Refresh the entire keys list from backend to avoid duplicates
          await get().fetchKeys();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to add key';
          console.error('Error adding key:', error);
          set({ 
            error: errorMessage,
            isLoading: false 
          });
        }
      },

      // Update existing key
      updateKey: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE}/keys/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              ...updates,
              updatedAt: new Date().toISOString()
            })
          });
          
          if (!response.ok) throw new Error('Failed to update key');
          
          // Refresh the entire keys list from backend to ensure consistency
          await get().fetchKeys();
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update key',
            isLoading: false 
          });
        }
      },

      // Delete key
      deleteKey: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE}/keys/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
          
          if (!response.ok) throw new Error('Failed to delete key');
          
          // Refresh the entire keys list from backend to ensure consistency
          await get().fetchKeys();
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete key',
            isLoading: false 
          });
        }
      },

      // Toggle key active status
      toggleKeyStatus: async (id) => {
        const key = get().keys.find(k => k.id === id);
        if (!key) return;
        
        await get().updateKey(id, { isActive: !key.isActive });
      },

      // Test key validity
      testKey: async (id) => {
        const key = get().keys.find(k => k.id === id);
        if (!key) {
          console.warn('Key not found for testing:', id);
          return false;
        }
        
        try {
          const response = await fetch(`${API_BASE}/keys/${id}/test`, {
            method: 'POST',
            headers: getAuthHeaders()
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Test failed: ${response.status} ${response.statusText}`);
          }
          
          const result = await response.json();
          
          // Update key stats based on test result
          if (result.valid === true) {
            set(state => ({
              keys: state.keys.map(k => 
                k.id === id 
                  ? { 
                      ...k, 
                      usageStats: k.usageStats 
                        ? { 
                            ...k.usageStats, 
                            successfulRequests: k.usageStats.successfulRequests + 1,
                            totalRequests: k.usageStats.totalRequests + 1,
                            errorRate: (k.usageStats.failedRequests) / (k.usageStats.totalRequests + 1)
                          } 
                        : {
                            totalRequests: 1,
                            successfulRequests: 1,
                            failedRequests: 0,
                            averageResponseTime: 0,
                            errorRate: 0
                          }
                    } 
                  : k
              )
            }));
          }
          
          return result.valid === true;
        } catch (error) {
          console.error('Error testing key:', error);
          
          // Update key stats for failed test
          set(state => ({
            keys: state.keys.map(k => 
              k.id === id 
                ? { 
                    ...k, 
                    usageStats: k.usageStats 
                      ? { 
                          ...k.usageStats, 
                          failedRequests: k.usageStats.failedRequests + 1,
                          totalRequests: k.usageStats.totalRequests + 1,
                          errorRate: (k.usageStats.failedRequests + 1) / (k.usageStats.totalRequests + 1)
                        } 
                      : {
                          totalRequests: 1,
                          successfulRequests: 0,
                          failedRequests: 1,
                          averageResponseTime: 0,
                          errorRate: 1
                        }
                  } 
                : k
            )
          }));
          
          return false;
        }
      },

      // Sync with Redis
      syncWithRedis: async () => {
        set({ isSyncing: true, error: null });
        try {
          const response = await fetch(`${API_BASE}/sync`, {
            method: 'POST',
            headers: getAuthHeaders()
          });
          
          if (!response.ok) throw new Error('Failed to sync with Redis');
          
          await get().fetchKeys();
          set({ isSyncing: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Sync failed',
            isSyncing: false 
          });
        }
      },

      // Import keys from Redis
      importKeysFromRedis: async () => {
        set({ isSyncing: true, error: null });
        try {
          const response = await fetch(`${API_BASE}/import-from-redis`, {
            method: 'POST',
            headers: getAuthHeaders()
          });
          
          if (!response.ok) throw new Error('Failed to import from Redis');
          
          // Refresh keys after import
          await get().fetchKeys();
          set({ isSyncing: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Import failed',
            isSyncing: false 
          });
        }
      },

      // Export keys to Redis
      exportKeysToRedis: async () => {
        set({ isSyncing: true, error: null });
        try {
          // First get all current keys
          const keysToExport = get().keys;
          
          // Send keys to backend for export to Redis
          const response = await fetch(`${API_BASE}/export-to-redis`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ keys: keysToExport })
          });
          
          if (!response.ok) throw new Error('Failed to export to Redis');
          
          set({ isSyncing: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Export failed',
            isSyncing: false 
          });
        }
      },

      // Cleanup duplicates
      cleanupDuplicates: async () => {
        set({ isSyncing: true, error: null });
        try {
          const response = await fetch(`${API_BASE}/cleanup-duplicates`, {
            method: 'POST',
            headers: getAuthHeaders()
          });
          
          if (!response.ok) throw new Error('Failed to cleanup duplicates');
          
          // Refresh keys after cleanup
          await get().fetchKeys();
          set({ isSyncing: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Cleanup failed',
            isSyncing: false 
          });
        }
      },

      // Force deduplication côté client - fixed algorithm
      forceDeduplication: () => {
        const state = get();
        
        const uniqueKeysMap = new Map();
        state.keys.forEach((key: LLMKey) => {
          // Use same comprehensive deduplication as fetchKeys
          const apiModel = key.metadata?.tags?.[0] || '';
          const description = key.metadata?.description || '';
          const uniqueId = `${key.providerId}|${key.keyValue}|${apiModel}|${description}`;
          
          if (!uniqueKeysMap.has(uniqueId)) {
            uniqueKeysMap.set(uniqueId, key);
          } else {
            // Keep the most recently used or active key
            const existing = uniqueKeysMap.get(uniqueId);
            if (key.isActive && !existing.isActive) {
              uniqueKeysMap.set(uniqueId, key);
            } else if ((key.lastUsed || '') > (existing.lastUsed || '')) {
              uniqueKeysMap.set(uniqueId, key);
            } else if ((key.usageCount || 0) > (existing.usageCount || 0)) {
              uniqueKeysMap.set(uniqueId, key);
            }
          }
        });
        
        const uniqueKeys = Array.from(uniqueKeysMap.values());
        console.log('🧹 Force deduplication - Après:', uniqueKeys.length);
        
        // Recalculer les fournisseurs uniques
        const uniqueProviders = Array.from(new Set(uniqueKeys.map(k => k.providerId)));
        
        const newStats = {
          totalKeys: uniqueKeys.length,
          activeKeys: uniqueKeys.filter(k => k.isActive).length,
          providersCount: uniqueProviders.length,
          totalUsage: uniqueKeys.reduce((sum, k) => sum + (k.usageCount || 0), 0),
          lastSync: new Date().toISOString()
        };
        
        set({ keys: uniqueKeys, stats: newStats });
      },

      // UI Actions
      setSearchTerm: (term) => set({ searchTerm: term }),
      setSelectedProvider: (providerId) => set({ selectedProvider: providerId }),
      toggleShowInactiveKeys: () => set(state => ({ 
        showInactiveKeys: !state.showInactiveKeys 
      })),
      clearError: () => set({ error: null }),

      // Computed getters
      getFilteredKeys: () => {
        const state = get();
        return state.keys.filter(key => {
          const matchesSearch = key.keyName.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
                               key.providerName.toLowerCase().includes(state.searchTerm.toLowerCase());
          const matchesProvider = !state.selectedProvider || key.providerId === state.selectedProvider;
          // Toutes les clés fonctionnent dans tous les environnements maintenant
          const matchesActive = state.showInactiveKeys || key.isActive;
          
          return matchesSearch && matchesProvider && matchesActive;
        });
      },

      getKeysByProvider: (providerId) => {
        return get().keys.filter(key => key.providerId === providerId);
      },

      getActiveKeyCount: () => {
        return get().keys.filter(key => key.isActive).length;
      },

      // Get the best available key for a provider based on priority and status
      getBestAvailableKey: (providerId: string) => {
        const state = get();
        const availableKeys = state.keys
          .filter(key => 
            key.providerId === providerId && 
            key.isActive
          )
          .sort((a, b) => a.priority - b.priority);
          
        return availableKeys.length > 0 ? availableKeys[0] : null;
      },

      // Update key usage statistics
      updateKeyUsage: (keyId: string, success: boolean, responseTime: number) => {
        set(state => ({
          keys: state.keys.map(key => {
            if (key.id === keyId) {
              const usageStats = key.usageStats || {
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                averageResponseTime: 0,
                errorRate: 0
              };
              
              const newStats = {
                ...usageStats,
                totalRequests: usageStats.totalRequests + 1,
                successfulRequests: success ? usageStats.successfulRequests + 1 : usageStats.successfulRequests,
                failedRequests: success ? usageStats.failedRequests : usageStats.failedRequests + 1,
                lastUsed: new Date().toISOString(),
                averageResponseTime: success 
                  ? ((usageStats.averageResponseTime * usageStats.successfulRequests) + responseTime) / (usageStats.successfulRequests + 1)
                  : usageStats.averageResponseTime,
                errorRate: ((usageStats.failedRequests + (success ? 0 : 1)) / (usageStats.totalRequests + 1))
              };
              
              return { ...key, usageStats: newStats, lastUsed: new Date().toISOString() };
            }
            return key;
          })
        }));
      }
    }),
    {
      name: 'llm-keys-store',
      partialize: (state) => ({
        // Only persist UI preferences, not sensitive key data
        searchTerm: state.searchTerm,
        selectedProvider: state.selectedProvider,
        showInactiveKeys: state.showInactiveKeys,
        providers: state.providers
      })
    }
  )
);