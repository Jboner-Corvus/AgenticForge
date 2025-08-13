import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
    environment: 'development' | 'staging' | 'production';
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
  selectedEnvironment: string | null;
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
  
  // UI Actions
  setSearchTerm: (term: string) => void;
  setSelectedProvider: (providerId: string | null) => void;
  setSelectedEnvironment: (env: string | null) => void;
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
    id: 'google',
    name: 'google',
    displayName: 'Google AI',
    description: 'Gemini and PaLM models',
    website: 'https://ai.google.dev',
    keyFormat: 'AI...',
    supportedModels: ['gemini-pro', 'gemini-pro-vision', 'palm-2'],
    isActive: true
  },
  {
    id: 'cohere',
    name: 'cohere',
    displayName: 'Cohere',
    description: 'Natural language AI platform',
    website: 'https://cohere.com',
    keyFormat: '...',
    supportedModels: ['command', 'command-light', 'embed-english-v2.0'],
    isActive: true
  },
  {
    id: 'mistral',
    name: 'mistral',
    displayName: 'Mistral AI',
    description: 'Open and portable generative AI',
    website: 'https://mistral.ai',
    keyFormat: '...',
    supportedModels: ['mistral-tiny', 'mistral-small', 'mistral-medium'],
    isActive: true
  }
];

// API ENDPOINTS
const API_BASE = '/api/llm-keys';

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
      selectedEnvironment: null,
      showInactiveKeys: false,

      // Fetch keys from backend/Redis
      fetchKeys: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE}/keys`);
          if (!response.ok) throw new Error('Failed to fetch keys');
          
          const keys: LLMKey[] = await response.json();
          const stats = {
            totalKeys: keys.length,
            activeKeys: keys.filter(k => k.isActive).length,
            providersCount: new Set(keys.map(k => k.providerId)).size,
            totalUsage: keys.reduce((sum, k) => sum + k.usageCount, 0),
            lastSync: new Date().toISOString()
          };
          
          set({ keys, stats, isLoading: false });
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
          const response = await fetch(`${API_BASE}/keys`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...keyData,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              usageCount: 0
            })
          });
          
          if (!response.ok) throw new Error('Failed to add key');
          
          const newKey: LLMKey = await response.json();
          set(state => ({ 
            keys: [...state.keys, newKey],
            isLoading: false 
          }));
          
          get().fetchKeys(); // Refresh stats
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...updates,
              updatedAt: new Date().toISOString()
            })
          });
          
          if (!response.ok) throw new Error('Failed to update key');
          
          const updatedKey: LLMKey = await response.json();
          set(state => ({
            keys: state.keys.map(key => 
              key.id === id ? updatedKey : key
            ),
            isLoading: false
          }));
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
            method: 'DELETE'
          });
          
          if (!response.ok) throw new Error('Failed to delete key');
          
          set(state => ({
            keys: state.keys.filter(key => key.id !== id),
            isLoading: false
          }));
          
          get().fetchKeys(); // Refresh stats
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
          const response = await fetch(`${API_BASE}/export-to-redis`, {
            method: 'POST'
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

      // UI Actions
      setSearchTerm: (term) => set({ searchTerm: term }),
      setSelectedProvider: (providerId) => set({ selectedProvider: providerId }),
      setSelectedEnvironment: (env) => set({ selectedEnvironment: env }),
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
          const matchesEnv = !state.selectedEnvironment || key.metadata.environment === state.selectedEnvironment;
          const matchesActive = state.showInactiveKeys || key.isActive;
          
          return matchesSearch && matchesProvider && matchesEnv && matchesActive;
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
        selectedEnvironment: state.selectedEnvironment,
        showInactiveKeys: state.showInactiveKeys,
        providers: state.providers
      })
    }
  )
);