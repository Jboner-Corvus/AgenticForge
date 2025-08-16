import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clientConfig } from '../config';

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

export interface LLMKey {
  id: string;
  providerId: string;
  providerName: string;
  keyName: string;
  keyValue: string;
  isEncrypted: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsed?: string;
  usageCount: number;
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
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

// API ENDPOINTS
const API_BASE = '/api/llm-api-keys';

// HELPER FUNCTION FOR AUTH HEADERS
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Try to get JWT from cookie
  const cookieName = 'agenticforge_jwt=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(cookieName) === 0) {
      const jwtToken = c.substring(cookieName.length, c.length);
      if (jwtToken) {
        headers['Authorization'] = 'Bearer ' + jwtToken;
      }
      break;
    }
  }

  // Try to get token from localStorage as fallback
  if (!headers['Authorization']) {
    const localStorageToken = localStorage.getItem('authToken');
    if (localStorageToken) {
      headers['Authorization'] = 'Bearer ' + localStorageToken;
    }
  }

  // Fallback to env AUTH_TOKEN
  if (!headers['Authorization']) {
    const envToken = clientConfig.VITE_AUTH_TOKEN || clientConfig.AUTH_TOKEN || 'Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0';
    headers['Authorization'] = 'Bearer ' + envToken;
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
          const response = await fetch(`${API_BASE}`, {
            headers: getAuthHeaders()
          });
          if (!response.ok) throw new Error('Failed to fetch keys');
          
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
          
          // Transform backend format to frontend format
          const rawKeys: LLMKey[] = rawBackendKeys.map((backendKey: BackendKey, index: number) => ({
            id: `${backendKey.apiProvider}-${index}-${Date.now()}`,
            providerId: backendKey.apiProvider,
            providerName: backendKey.apiProvider,
            keyName: `Key ${index + 1}`,
            keyValue: backendKey.apiKey,
            isEncrypted: false,
            isActive: !backendKey.isPermanentlyDisabled,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastUsed: backendKey.lastUsed ? new Date(backendKey.lastUsed).toISOString() : undefined,
            usageCount: backendKey.errorCount || 0,
            metadata: {
              environment: 'universal' as const,
              tags: [backendKey.apiModel || 'unknown'],
              description: `${backendKey.apiProvider} - ${backendKey.apiModel || 'unknown'}`
            }
          }));
          
          // Remove duplicates - more aggressive deduplication
          const keysMap = new Map<string, LLMKey>();
          rawKeys.forEach(key => {
            // Always use combination as primary key to catch duplicates
            const primaryKey = `${key.providerId}-${key.keyName}-${key.keyValue}`;
            
            if (!keysMap.has(primaryKey)) {
              keysMap.set(primaryKey, key);
            } else {
              // If duplicate found, keep the one with the most recent createdAt
              const existing = keysMap.get(primaryKey)!;
              if ((key.createdAt || '') > (existing.createdAt || '')) {
                keysMap.set(primaryKey, key);
              }
            }
          });
          const keys = Array.from(keysMap.values());
          
          const stats = {
            totalKeys: keys.length,
            activeKeys: keys.filter(k => k.isActive).length,
            providersCount: new Set(keys.map(k => k.providerId)).size,
            totalUsage: keys.reduce((sum, k) => sum + k.usageCount, 0),
            lastSync: new Date().toISOString()
          };
          
          // Force deduplication every time we set keys
          console.log('Before deduplication:', keys.length, 'keys');
          set({ keys, stats, isLoading: false });
          console.log('After setting keys:', keys.length, 'keys');
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Unknown error',
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

      // Add new key
      addKey: async (keyData) => {
        set({ isLoading: true, error: null });
        try {
          // Check for existing duplicate before adding
          const currentKeys = get().keys;
          const duplicateCheck = `${keyData.providerId}-${keyData.keyName}-${keyData.keyValue}`;
          const existingKey = currentKeys.find(key => 
            `${key.providerId}-${key.keyName}-${key.keyValue}` === duplicateCheck
          );
          
          if (existingKey) {
            console.warn('Key already exists, skipping duplicate creation');
            set({ isLoading: false });
            return;
          }

          const response = await fetch(`${API_BASE}/keys`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              ...keyData,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              usageCount: 0
            })
          });
          
          if (!response.ok) throw new Error('Failed to add key');
          
          // Refresh the entire keys list from backend to avoid duplicates
          await get().fetchKeys();
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add key',
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
        if (!key) return false;
        
        try {
          const response = await fetch(`${API_BASE}/keys/${id}/test`, {
            method: 'POST'
          });
          
          const result = await response.json();
          return result.valid === true;
        } catch (error) {
          return false;
        }
      },

      // Sync with Redis
      syncWithRedis: async () => {
        set({ isSyncing: true, error: null });
        try {
          const response = await fetch(`${API_BASE}/sync`, {
            method: 'POST'
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
            method: 'POST'
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
            headers: { 'Content-Type': 'application/json' },
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

      // Force deduplication côté client
      forceDeduplication: () => {
        const state = get();
        console.log('🧹 Force deduplication - Avant:', state.keys.length);
        
        const uniqueKeysMap = new Map();
        state.keys.forEach(key => {
          const uniqueId = `${key.providerId}-${key.keyName}-${key.keyValue}`;
          if (!uniqueKeysMap.has(uniqueId)) {
            uniqueKeysMap.set(uniqueId, key);
          } else {
            // Garder la clé la plus récente
            const existing = uniqueKeysMap.get(uniqueId);
            if ((key.createdAt || '') > (existing.createdAt || '')) {
              uniqueKeysMap.set(uniqueId, key);
            }
          }
        });
        
        const uniqueKeys = Array.from(uniqueKeysMap.values());
        console.log('🧹 Force deduplication - Après:', uniqueKeys.length);
        
        const newStats = {
          totalKeys: uniqueKeys.length,
          activeKeys: uniqueKeys.filter(k => k.isActive).length,
          providersCount: new Set(uniqueKeys.map(k => k.providerId)).size,
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