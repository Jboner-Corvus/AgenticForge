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
          
          const response = await fetch(`${API_BASE}/keys`, {
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
            id?: string;
            providerId?: string;
            providerName?: string;
            keyName?: string;
            isEncrypted?: boolean;
            isActive?: boolean;
            priority?: number;
            createdAt?: string;
            updatedAt?: string;
            usageCount?: number;
            rateLimit?: {
              requestsPerMinute: number;
              tokensPerMinute: number;
            };
            usageStats?: LLMKeyUsageStats;
            metadata?: {
              environment: 'universal';
              tags: string[];
              description?: string;
            };
          }
          
          // Transform backend format to frontend format with better validation
          const rawKeys: LLMKey[] = rawBackendKeys.map((backendKey: BackendKey, index: number) => {
            // Check if it's already in the new format
            if (backendKey.id && backendKey.providerId) {
              return {
                id: backendKey.id,
                providerId: backendKey.providerId,
                providerName: backendKey.providerName || backendKey.providerId,
                keyName: backendKey.keyName || `Key ${index + 1}`,
                keyValue: backendKey.apiKey,
                isEncrypted: backendKey.isEncrypted || false,
                isActive: backendKey.isActive !== undefined ? backendKey.isActive : !backendKey.isPermanentlyDisabled,
                priority: backendKey.priority || 5,
                createdAt: backendKey.createdAt || new Date().toISOString(),
                updatedAt: backendKey.updatedAt || new Date().toISOString(),
                lastUsed: backendKey.lastUsed ? new Date(backendKey.lastUsed).toISOString() : undefined,
                usageCount: backendKey.usageCount || 0,
                rateLimit: backendKey.rateLimit,
                usageStats: backendKey.usageStats || {
                  totalRequests: backendKey.usageCount || 0,
                  successfulRequests: 0,
                  failedRequests: backendKey.errorCount || 0,
                  averageResponseTime: 0,
                  errorRate: backendKey.errorCount ? (backendKey.errorCount / (backendKey.usageCount || 1)) : 0
                },
                metadata: backendKey.metadata || {
                  environment: 'universal' as const,
                  tags: [backendKey.apiModel || 'unknown'],
                  description: `${backendKey.providerId || backendKey.apiProvider} - ${backendKey.apiModel || 'unknown'}`
                }
              };
            }
            
            // Handle legacy format
            return {
              id: backendKey.id || `${backendKey.apiProvider || 'unknown'}-${index}-${Date.now()}`,
              providerId: backendKey.apiProvider || 'unknown',
              providerName: backendKey.apiProvider || 'unknown',
              keyName: backendKey.apiModel ? `${backendKey.apiProvider || 'unknown'} - ${backendKey.apiModel}` : `Key ${index + 1}`,
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
                description: `${backendKey.apiProvider || 'unknown'} - ${backendKey.apiModel || 'unknown'}`
              }
            };
          }).filter((key: LLMKey | null): key is LLMKey => key !== null); // Filter out null values
          
          // Remove duplicates with improved algorithm including apiModel + baseUrl
          const keysMap = new Map<string, LLMKey>();
          rawKeys.forEach((key: LLMKey) => {
            // Create comprehensive key for deduplication including model and description
            const apiModel = key.metadata?.tags?.[0] || '';
            const description = key.metadata?.description || '';
            const keyValue = key.keyValue || '';
            const primaryKey = `${key.providerId}|${keyValue}|${apiModel}|${description}`;
            
            if (!keysMap.has(primaryKey)) {
              keysMap.set(primaryKey, key);
            }
          });
          
          const keys = Array.from(keysMap.values());
          
          // Update stats
          const activeKeys = keys.filter(key => key.isActive).length;
          const providersCount = new Set(keys.map(key => key.providerId)).size;
          const totalUsage = keys.reduce((sum, key) => sum + (key.usageCount || 0), 0);
          
          set({
            keys,
            stats: {
              totalKeys: keys.length,
              activeKeys,
              providersCount,
              totalUsage,
              lastSync: new Date().toISOString()
            },
            isLoading: false
          });
        } catch (error) {
          console.error('Failed to fetch keys:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch keys',
            isLoading: false
          });
        }
      },

      // Fetch providers list
      fetchProviders: async () => {
        set({ isLoading: true, error: null });
        try {
          const headers = getAuthHeaders();
          
          const response = await fetch(`${API_BASE}/providers`, {
            headers
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch providers: ${response.status} ${response.statusText}`);
          }
          
          const providers = await response.json();
          set({ providers, isLoading: false });
        } catch (error) {
          console.error('Failed to fetch providers:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch providers',
            isLoading: false
          });
        }
      },

      // Add a new key
      addKey: async (keyData) => {
        set({ isLoading: true, error: null });
        try {
          const headers = getAuthHeaders();
          
          const response = await fetch(`${API_BASE}/keys`, {
            method: 'POST',
            headers,
            body: JSON.stringify(keyData)
          });
          
          if (!response.ok) {
            throw new Error(`Failed to add key: ${response.status} ${response.statusText}`);
          }
          
          // Refresh the keys list
          await get().fetchKeys();
          
          // Show success message
          console.log('✅ Key added successfully');
        } catch (error) {
          console.error('Failed to add key:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to add key',
            isLoading: false
          });
          throw error;
        }
      },

      // Update an existing key
      updateKey: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
          const headers = getAuthHeaders();
          
          const response = await fetch(`${API_BASE}/keys/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(updates)
          });
          
          if (!response.ok) {
            throw new Error(`Failed to update key: ${response.status} ${response.statusText}`);
          }
          
          // Refresh the keys list
          await get().fetchKeys();
          
          // Show success message
          console.log('✅ Key updated successfully');
        } catch (error) {
          console.error('Failed to update key:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to update key',
            isLoading: false
          });
          throw error;
        }
      },

      // Delete a key
      deleteKey: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const headers = getAuthHeaders();
          
          const response = await fetch(`${API_BASE}/keys/${id}`, {
            method: 'DELETE',
            headers
          });
          
          if (!response.ok) {
            throw new Error(`Failed to delete key: ${response.status} ${response.statusText}`);
          }
          
          // Refresh the keys list
          await get().fetchKeys();
          
          // Show success message
          console.log('✅ Key deleted successfully');
        } catch (error) {
          console.error('Failed to delete key:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to delete key',
            isLoading: false
          });
          throw error;
        }
      },

      // Toggle key status (active/inactive)
      toggleKeyStatus: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const key = get().keys.find(k => k.id === id);
          if (!key) {
            throw new Error('Key not found');
          }
          
          await get().updateKey(id, { isActive: !key.isActive });
        } catch (error) {
          console.error('Failed to toggle key status:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to toggle key status',
            isLoading: false
          });
          throw error;
        }
      },

      // Test key validity
      testKey: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const key = get().keys.find(k => k.id === id);
          if (!key) {
            throw new Error('Key not found');
          }
          
          const headers = getAuthHeaders();
          
          const response = await fetch(`${API_BASE}/test`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              provider: key.providerId,
              keyValue: key.keyValue || ''
            })
          });
          
          if (!response.ok) {
            throw new Error(`Failed to test key: ${response.status} ${response.statusText}`);
          }
          
          const result = await response.json();
          set({ isLoading: false });
          
          // Show a notification to the user based on the result
          if (result.valid) {
            console.log(`✅ Key test successful for ${key.keyName}`);
          } else {
            console.log(`❌ Key test failed for ${key.keyName}: ${result.message || result.error || 'Unknown error'}`);
          }
          
          return result.valid;
        } catch (error) {
          console.error('Failed to test key:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to test key',
            isLoading: false
          });
          throw error;
        }
      },

      // Sync with Redis
      syncWithRedis: async () => {
        set({ isSyncing: true, error: null });
        try {
          const headers = getAuthHeaders();
          
          // Call the backend sync endpoint
          const response = await fetch(`${API_BASE}/sync`, {
            method: 'POST',
            headers
          });
          
          if (!response.ok) {
            throw new Error(`Failed to sync with Redis: ${response.status} ${response.statusText}`);
          }
          
          // Refresh the keys list
          await get().fetchKeys();
          
          // Show success message
          console.log('✅ Synced with Redis successfully');
          set({ isSyncing: false });
        } catch (error) {
          console.error('Failed to sync with Redis:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to sync with Redis',
            isSyncing: false
          });
        }
      },

      // Import keys from Redis
      importKeysFromRedis: async () => {
        set({ isSyncing: true, error: null });
        try {
          const headers = getAuthHeaders();
          
          // Call the backend import endpoint
          const response = await fetch(`${API_BASE}/import`, {
            method: 'POST',
            headers
          });
          
          if (!response.ok) {
            throw new Error(`Failed to import keys from Redis: ${response.status} ${response.statusText}`);
          }
          
          // Refresh the keys list
          await get().fetchKeys();
          
          // Show success message
          console.log('✅ Imported keys from Redis successfully');
          set({ isSyncing: false });
        } catch (error) {
          console.error('Failed to import keys from Redis:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to import keys from Redis',
            isSyncing: false
          });
        }
      },

      // Export keys to Redis
      exportKeysToRedis: async () => {
        set({ isSyncing: true, error: null });
        try {
          const headers = getAuthHeaders();
          
          // Call the backend export endpoint
          const keysWithValidValues = get().keys.map(key => ({
            ...key,
            keyValue: key.keyValue || ''
          }));
          
          const response = await fetch(`${API_BASE}/export`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ keys: keysWithValidValues })
          });
          
          if (!response.ok) {
            throw new Error(`Failed to export keys to Redis: ${response.status} ${response.statusText}`);
          }
          
          // Refresh the keys list
          await get().fetchKeys();
          
          // Show success message
          console.log('✅ Exported keys to Redis successfully');
          set({ isSyncing: false });
        } catch (error) {
          console.error('Failed to export keys to Redis:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to export keys to Redis',
            isSyncing: false
          });
        }
      },

      // Cleanup duplicates
      cleanupDuplicates: async () => {
        set({ isSyncing: true, error: null });
        try {
          const headers = getAuthHeaders();
          
          // Call the backend cleanup endpoint
          const response = await fetch(`${API_BASE}/cleanup-duplicates`, {
            method: 'POST',
            headers
          });
          
          if (!response.ok) {
            throw new Error(`Failed to cleanup duplicates: ${response.status} ${response.statusText}`);
          }
          
          // Refresh the keys list
          await get().fetchKeys();
          
          // Show success message
          console.log('✅ Cleaned up duplicates successfully');
          set({ isSyncing: false });
        } catch (error) {
          console.error('Failed to cleanup duplicates:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to cleanup duplicates',
            isSyncing: false
          });
        }
      },

      // Force deduplication
      forceDeduplication: () => {
        // This would be implemented in a real application
        console.log('Force deduplication called');
      },

      // UI Actions
      setSearchTerm: (term) => set({ searchTerm: term }),
      setSelectedProvider: (providerId) => set({ selectedProvider: providerId }),
      toggleShowInactiveKeys: () => set((state) => ({ showInactiveKeys: !state.showInactiveKeys })),
      clearError: () => set({ error: null }),

      // Computed
      getFilteredKeys: () => {
        const { keys, searchTerm, selectedProvider, showInactiveKeys } = get();
        
        return keys.filter(key => {
          // Filter by search term
          if (searchTerm && !key.keyName.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
          }
          
          // Filter by provider
          if (selectedProvider && key.providerId !== selectedProvider) {
            return false;
          }
          
          // Filter by active status
          if (!showInactiveKeys && !key.isActive) {
            return false;
          }
          
          return true;
        });
      },

      getKeysByProvider: (providerId) => {
        return get().keys.filter(key => key.providerId === providerId);
      },

      getActiveKeyCount: () => {
        return get().keys.filter(key => key.isActive).length;
      },

      getBestAvailableKey: (providerId) => {
        const keys = get().getKeysByProvider(providerId);
        const activeKeys = keys.filter(key => key.isActive);
        if (activeKeys.length > 0) {
          // Return the key with the highest priority (lowest number)
          return activeKeys.sort((a, b) => a.priority - b.priority)[0];
        }
        return null;
      },

      updateKeyUsage: (keyId, success, responseTime) => {
        set((state) => {
          const keys = [...state.keys];
          const keyIndex = keys.findIndex(key => key.id === keyId);
          
          if (keyIndex !== -1) {
            const key = keys[keyIndex];
            const usageStats = key.usageStats || {
              totalRequests: 0,
              successfulRequests: 0,
              failedRequests: 0,
              averageResponseTime: 0,
              errorRate: 0
            };
            
            usageStats.totalRequests += 1;
            if (success) {
              usageStats.successfulRequests += 1;
            } else {
              usageStats.failedRequests += 1;
            }
            
            // Update average response time
            const totalResponseTime = (usageStats.averageResponseTime * (usageStats.totalRequests - 1)) + responseTime;
            usageStats.averageResponseTime = totalResponseTime / usageStats.totalRequests;
            
            // Update error rate
            usageStats.errorRate = usageStats.failedRequests / usageStats.totalRequests;
            
            keys[keyIndex] = {
              ...key,
              usageStats,
              usageCount: usageStats.totalRequests,
              lastUsed: new Date().toISOString()
            };
            
            // Update stats
            const activeKeys = keys.filter(k => k.isActive).length;
            const providersCount = new Set(keys.map(k => k.providerId)).size;
            const totalUsage = keys.reduce((sum, k) => sum + (k.usageCount || 0), 0);
            
            return {
              keys,
              stats: {
                ...state.stats,
                totalKeys: keys.length,
                activeKeys,
                providersCount,
                totalUsage
              }
            };
          }
          
          return state;
        });
      }
    }),
    {
      name: 'llm-keys-store',
      partialize: (state) => ({
        keys: state.keys,
        providers: state.providers,
        stats: state.stats,
        searchTerm: state.searchTerm,
        selectedProvider: state.selectedProvider,
        showInactiveKeys: state.showInactiveKeys
      })
    }
  )
);