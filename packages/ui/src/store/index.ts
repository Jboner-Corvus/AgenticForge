// Unified store that combines all specialized stores
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useSessionStore } from './sessionStore';
import { useUIStore } from './uiStore';
import { useCanvasStore } from './canvasStore';
import { useCacheStore } from './cacheStore';
import { useLLMKeysStore } from './llmKeysStore';
import { usePinningStore } from './pinningStore';
import type { LlmApiKey, LeaderboardStats } from './types';
import { 
  addLlmApiKeyApi, 
  removeLlmApiKeyApi, 
  editLlmApiKeyApi, 
  setActiveLlmProviderApi,
  getLeaderboardStats,
  getLlmApiKeysApi,
  getTools
} from '../lib/api';

// Combined interface for backward compatibility
export interface CombinedAppState {
  // LLM Management (keeping for backward compatibility)
  llmApiKeys: LlmApiKey[];
  activeLlmApiKeyIndex: number;
  isAddingLlmApiKey: boolean;
  isRemovingLlmApiKey: boolean;
  isSettingActiveLlmApiKey: boolean;
  
  // Leaderboard
  leaderboardStats: LeaderboardStats;
  isLoadingLeaderboardStats: boolean;
  
  // Tools
  isLoadingTools: boolean;
  
  // Actions
  addLlmApiKey: (provider: string, key: string, baseUrl?: string, model?: string) => Promise<void>;
  removeLlmApiKey: (index: number) => Promise<void>;
  editLlmApiKey: (index: number, provider: string, key: string, baseUrl?: string, model?: string) => Promise<void>;
  setActiveLlmApiKey: (index: number) => Promise<void>;
  
  updateLeaderboardStats: (stats: Partial<LeaderboardStats>) => void;
  fetchAndDisplayToolCount: () => Promise<void>;
  initializeSessionAndMessages: () => Promise<void>;
  
  setIsAddingLlmApiKey: (isAdding: boolean) => void;
  setIsRemovingLlmApiKey: (isRemoving: boolean) => void;
  setIsSettingActiveLlmApiKey: (isSetting: boolean) => void;
  setIsLoadingLeaderboardStats: (isLoading: boolean) => void;
  setIsLoadingTools: (isLoading: boolean) => void;
}

export const useCombinedStore = create<CombinedAppState>()(
  devtools(
    (set, get) => ({
      // LLM API Keys state
      llmApiKeys: [],
      activeLlmApiKeyIndex: -1,
      isAddingLlmApiKey: false,
      isRemovingLlmApiKey: false,
      isSettingActiveLlmApiKey: false,
      
      // Leaderboard state
      leaderboardStats: {
        tokensSaved: 0,
        successfulRuns: 0,
        sessionsCreated: 0,
        apiKeysAdded: 0,
      },
      isLoadingLeaderboardStats: false,
      
      // Tools state
      isLoadingTools: false,

      // LLM API Key Management
      addLlmApiKey: async (provider: string, key: string, baseUrl?: string, model?: string) => {
        set({ isAddingLlmApiKey: true });
        try {
          await addLlmApiKeyApi(provider, key, baseUrl, model);
          
          // Update local state
          const newKey: LlmApiKey = { provider, key, baseUrl, model };
          set((state) => ({
            llmApiKeys: [...state.llmApiKeys, newKey],
            leaderboardStats: {
              ...state.leaderboardStats,
              apiKeysAdded: state.leaderboardStats.apiKeysAdded + 1
            }
          }));
          
          console.log(`✅ LLM API Key added: ${provider}`);
        } catch (error) {
          console.error('Failed to add LLM API key:', error);
          throw error;
        } finally {
          set({ isAddingLlmApiKey: false });
        }
      },

      removeLlmApiKey: async (index: number) => {
        const state = get();
        if (index < 0 || index >= state.llmApiKeys.length) return;

        set({ isRemovingLlmApiKey: true });
        try {
          await removeLlmApiKeyApi(index);
          
          // Update local state
          const newKeys = [...state.llmApiKeys];
          newKeys.splice(index, 1);
          
          // Adjust active index if necessary
          let newActiveIndex = state.activeLlmApiKeyIndex;
          if (index === state.activeLlmApiKeyIndex) {
            newActiveIndex = -1;
          } else if (index < state.activeLlmApiKeyIndex) {
            newActiveIndex = state.activeLlmApiKeyIndex - 1;
          }
          
          set({
            llmApiKeys: newKeys,
            activeLlmApiKeyIndex: newActiveIndex
          });
          
          console.log(`✅ LLM API Key removed: index ${index}`);
        } catch (error) {
          console.error('Failed to remove LLM API key:', error);
          throw error;
        } finally {
          set({ isRemovingLlmApiKey: false });
        }
      },

      editLlmApiKey: async (index: number, provider: string, key: string, baseUrl?: string, model?: string) => {
        const state = get();
        if (index < 0 || index >= state.llmApiKeys.length) return;

        set({ isSettingActiveLlmApiKey: true });
        try {
          await editLlmApiKeyApi(index, provider, key, baseUrl, model);
          
          // Update local state
          const newKeys = [...state.llmApiKeys];
          newKeys[index] = { provider, key, baseUrl, model };
          
          set({ llmApiKeys: newKeys });
          
          console.log(`✅ LLM API Key edited: index ${index}`);
        } catch (error) {
          console.error('Failed to edit LLM API key:', error);
          throw error;
        } finally {
          set({ isSettingActiveLlmApiKey: false });
        }
      },

      setActiveLlmApiKey: async (index: number) => {
        const state = get();
        if (index < -1 || index >= state.llmApiKeys.length) return;

        set({ isSettingActiveLlmApiKey: true });
        try {
          // Get the provider name from the key at the given index
          const providerName = state.llmApiKeys[index]?.provider;
          if (!providerName) {
            throw new Error('Invalid provider index');
          }
          
          // Get auth token and session ID from UI store
          const uiStore = useUIStore.getState();
          const sessionStore = useSessionStore.getState();
          
          await setActiveLlmProviderApi(providerName, uiStore.authToken, sessionStore.sessionId);
          set({ activeLlmApiKeyIndex: index });
          
          console.log(`✅ Active LLM API Key set: index ${index}`);
        } catch (error) {
          console.error('Failed to set active LLM API key:', error);
          throw error;
        } finally {
          set({ isSettingActiveLlmApiKey: false });
        }
      },

      // Leaderboard
      updateLeaderboardStats: (stats) => {
        set((state) => ({
          leaderboardStats: {
            ...state.leaderboardStats,
            ...stats
          }
        }));
      },

      // Tools
      fetchAndDisplayToolCount: async () => {
        const uiStore = useUIStore.getState();
        const sessionStore = useSessionStore.getState();
        const cacheStore = useCacheStore.getState();
        
        if (!uiStore.authToken || !sessionStore.sessionId) {
          console.warn('Auth token or session ID missing');
          return;
        }

        const cacheKey = `tools_${sessionStore.sessionId}`;
        const cachedTools = cacheStore.get<{ name: string }[]>(cacheKey);
        
        if (cachedTools) {
          uiStore.setToolCount(cachedTools.length);
          sessionStore.setSessionStatus('valid');
          return;
        }

        set({ isLoadingTools: true });
        try {
          const tools = await getTools(uiStore.authToken, sessionStore.sessionId);
          uiStore.setToolCount(tools.length);
          sessionStore.setSessionStatus('valid');
          
          // Cache for 5 minutes
          cacheStore.set(cacheKey, tools, 5 * 60 * 1000, ['tools']);
          
          console.log(`✅ Tools fetched: ${tools.length} tools`);
        } catch (error) {
          console.error('Failed to fetch tools:', error);
          uiStore.setToolCount('error');
          sessionStore.setSessionStatus('error');
        } finally {
          set({ isLoadingTools: false });
        }
      },

      // Initialization
      initializeSessionAndMessages: async () => {
        try {
          // Load sessions
          await useSessionStore.getState().loadAllSessions();
          
          // Load LLM keys
          const llmKeys = await getLlmApiKeysApi();
          set({ llmApiKeys: llmKeys || [] });
          
          // Load leaderboard stats
          set({ isLoadingLeaderboardStats: true });
          try {
            const stats = await getLeaderboardStats();
            set({ leaderboardStats: stats });
          } catch (error) {
            console.error('Failed to load leaderboard stats:', error);
          } finally {
            set({ isLoadingLeaderboardStats: false });
          }
          
          console.log('✅ App initialized');
        } catch (error) {
          console.error('Failed to initialize app:', error);
        }
      },

      // Loading state setters
      setIsAddingLlmApiKey: (isAddingLlmApiKey) => set({ isAddingLlmApiKey }),
      setIsRemovingLlmApiKey: (isRemovingLlmApiKey) => set({ isRemovingLlmApiKey }),
      setIsSettingActiveLlmApiKey: (isSettingActiveLlmApiKey) => set({ isSettingActiveLlmApiKey }),
      setIsLoadingLeaderboardStats: (isLoadingLeaderboardStats) => set({ isLoadingLeaderboardStats }),
      setIsLoadingTools: (isLoadingTools) => set({ isLoadingTools })
    }),
    { name: 'combined-app-store' }
  )
);

// Store selectors for better performance
export const useStores = () => ({
  session: useSessionStore(),
  ui: useUIStore(),
  canvas: useCanvasStore(),
  cache: useCacheStore(),
  llmKeys: useLLMKeysStore(),
  pinning: usePinningStore(),
  combined: useCombinedStore()
});

// Backward compatibility - re-export the original store interface
export const useStore = useCombinedStore;