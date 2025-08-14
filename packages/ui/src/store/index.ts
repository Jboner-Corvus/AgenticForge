/* eslint-disable @typescript-eslint/no-explicit-any */
// Unified store that combines all specialized stores
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useSessionStore } from './sessionStore';
import { useUIStore } from './uiStore';
import { useCanvasStore } from './canvasStore';
import { useCacheStore } from './cacheStore';
import { useLLMKeysStore } from './llmKeysStore';
import { usePinningStore } from './pinningStore';
import type { LlmApiKey, LeaderboardStats, PageType } from './types';
import { 
  addLlmApiKeyApi, 
  removeLlmApiKeyApi, 
  editLlmApiKeyApi, 
  setActiveLlmProviderApi,
  getLeaderboardStats,
  getLlmApiKeysApi,
  getTools
} from '../lib/api';

// Combined interface for backward compatibility - includes all store properties
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
  
  // UI Store properties
  currentPage: string;
  isControlPanelVisible: boolean;
  isDebugLogVisible: boolean;
  isTodoListVisible: boolean;
  isDarkMode: boolean;
  isProcessing: boolean;
  agentProgress: number;
  messageInputValue: string;
  agentStatus: string | null;
  toolStatus: string;
  browserStatus: string;
  serverHealthy: boolean;
  isAuthenticated: boolean;
  tokenStatus: boolean;
  toolCount: number | string;
  toolCreationEnabled: boolean;
  codeExecutionEnabled: boolean;
  authToken: string | null;
  jobId: string | null;
  activeCliJobId: string | null;
  streamCloseFunc: (() => void) | null;
  debugLog: string[];
  isSettingsModalOpen: boolean;
  
  // Canvas Store properties
  canvasContent: string;
  canvasType: unknown;
  isCanvasVisible: boolean;
  isCanvasPinned: boolean;
  isCanvasFullscreen: boolean;
  canvasWidth: number;
  canvasHistory: unknown[];
  currentCanvasIndex: number;
  
  // Session Store properties
  sessionId: string | null;
  activeSessionId: string | null;
  sessionStatus: unknown;
  messages: unknown[];
  sessions: unknown[];
  isLoadingSessions: boolean;
  isSavingSession: boolean;
  isDeletingSession: boolean;
  isRenamingSession: boolean;
  
  // UI Store actions
  setCurrentPage: (page: PageType) => void;
  setIsSettingsModalOpen: (isOpen: boolean) => void;
  setIsControlPanelVisible: (isVisible: boolean) => void;
  setIsTodoListVisible: (isVisible: boolean) => void;
  toggleDebugLogVisibility: () => void;
  toggleDarkMode: () => void;
  setIsProcessing: (isProcessing: boolean) => void;
  setAgentProgress: (progress: number) => void;
  setMessageInputValue: (value: string) => void;
  setAgentStatus: (status: string | null) => void;
  setToolStatus: (status: string) => void;
  setBrowserStatus: (status: string) => void;
  setServerHealthy: (healthy: boolean) => void;
  setTokenStatus: (status: boolean) => void;
  setToolCount: (count: number | string) => void;
  setToolCreationEnabled: (enabled: boolean) => void;
  setCodeExecutionEnabled: (enabled: boolean) => void;
  setAuthToken: (token: string | null) => void;
  setJobId: (jobId: string | null) => void;
  setActiveCliJobId: (jobId: string | null) => void;
  addDebugLog: (log: string) => void;
  clearDebugLog: () => void;
  
  // Canvas Store actions
  setCanvasContent: (content: string) => void;
  setCanvasType: (type: unknown) => void;
  setIsCanvasVisible: (isVisible: boolean) => void;
  setCanvasPinned: (isPinned: boolean) => void;
  setCanvasFullscreen: (isFullscreen: boolean) => void;
  setCanvasWidth: (width: number) => void;
  clearCanvas: () => void;
  resetCanvas: () => void;
  toggleIsCanvasVisible: () => void;
  addCanvasToHistory: (title: string, content: string, type: unknown) => void;
  navigateToCanvas: (index: number) => void;
  removeCanvasFromHistory: (index: number) => void;
  clearCanvasHistory: () => void;
  
  // Session Store actions
  setSessionId: (sessionId: string | null) => void;
  setSessionStatus: (status: unknown) => void;
  setMessages: (messages: unknown[]) => void;
  setSessions: (sessions: unknown[]) => void;
  setActiveSessionId: (id: string | null) => void;
  addMessage: (message: unknown) => void;
  clearMessages: () => void;
  saveSession: (name: string) => Promise<void>;
  loadSession: (id: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  deleteAllSessions: () => Promise<void>;
  renameSession: (id: string, newName: string) => Promise<void>;
  loadAllSessions: () => Promise<void>;
  setIsLoadingSessions: (isLoading: boolean) => void;
  setIsSavingSession: (isSaving: boolean) => void;
  setIsDeletingSession: (isDeleting: boolean) => void;
  setIsRenamingSession: (isRenaming: boolean) => void;
  
  // Main actions
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

// Simple wrapper that just provides actions, components should use individual stores directly
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
      
      // UI Store properties - using default values, components should use individual stores
      currentPage: 'chat',
      isControlPanelVisible: false,
      isDebugLogVisible: false,
      isTodoListVisible: false,
      isDarkMode: false,
      isProcessing: false,
      agentProgress: 0,
      messageInputValue: '',
      agentStatus: null,
      toolStatus: '',
      browserStatus: 'idle',
      serverHealthy: false,
      isAuthenticated: false,
      tokenStatus: false,
      toolCount: 0,
      toolCreationEnabled: false,
      codeExecutionEnabled: true,
      authToken: null,
      jobId: null,
      activeCliJobId: null,
      streamCloseFunc: null,
      debugLog: [],
      isSettingsModalOpen: false,
      
      // Canvas Store properties - using default values
      canvasContent: '',
      canvasType: 'text',
      isCanvasVisible: false,
      isCanvasPinned: false,
      isCanvasFullscreen: false,
      canvasWidth: 500,
      canvasHistory: [],
      currentCanvasIndex: -1,
      
      // Session Store properties - using default values
      sessionId: null,
      activeSessionId: null,
      sessionStatus: 'unknown',
      messages: [],
      sessions: [],
      isLoadingSessions: false,
      isSavingSession: false,
      isDeletingSession: false,
      isRenamingSession: false,
      
      // UI Store actions (proxied)
      setCurrentPage: (page: PageType) => useUIStore.getState().setCurrentPage(page),
      setIsSettingsModalOpen: (isOpen: boolean) => useUIStore.getState().setIsSettingsModalOpen(isOpen),
      setIsControlPanelVisible: (isVisible: boolean) => useUIStore.getState().setIsControlPanelVisible(isVisible),
      setIsTodoListVisible: (isVisible: boolean) => useUIStore.getState().setIsTodoListVisible(isVisible),
      toggleDebugLogVisibility: () => useUIStore.getState().toggleDebugLogVisibility(),
      toggleDarkMode: () => useUIStore.getState().toggleDarkMode(),
      setIsProcessing: (isProcessing: boolean) => useUIStore.getState().setIsProcessing(isProcessing),
      setAgentProgress: (progress: number) => useUIStore.getState().setAgentProgress(progress),
      setMessageInputValue: (value: string) => useUIStore.getState().setMessageInputValue(value),
      setAgentStatus: (status: string | null) => useUIStore.getState().setAgentStatus(status),
      setToolStatus: (status: string) => useUIStore.getState().setToolStatus(status),
      setBrowserStatus: (status: string) => useUIStore.getState().setBrowserStatus(status),
      setServerHealthy: (healthy: boolean) => useUIStore.getState().setServerHealthy(healthy),
      setTokenStatus: (status: boolean) => useUIStore.getState().setTokenStatus(status),
      setToolCount: (count: number | string) => useUIStore.getState().setToolCount(count),
      setToolCreationEnabled: (enabled: boolean) => useUIStore.getState().setToolCreationEnabled(enabled),
      setCodeExecutionEnabled: (enabled: boolean) => useUIStore.getState().setCodeExecutionEnabled(enabled),
      setAuthToken: (token: string | null) => useUIStore.getState().setAuthToken(token),
      setJobId: (jobId: string | null) => useUIStore.getState().setJobId(jobId),
      setActiveCliJobId: (jobId: string | null) => useUIStore.getState().setActiveCliJobId(jobId),
      addDebugLog: (log: string) => useUIStore.getState().addDebugLog(log),
      clearDebugLog: () => useUIStore.getState().clearDebugLog(),
      
      // Canvas Store actions (proxied)
      setCanvasContent: (content: string) => useCanvasStore.getState().setCanvasContent(content),
      setCanvasType: (type: unknown) => useCanvasStore.getState().setCanvasType(type as any),
      setIsCanvasVisible: (isVisible: boolean) => useCanvasStore.getState().setIsCanvasVisible(isVisible),
      setCanvasPinned: (isPinned: boolean) => useCanvasStore.getState().setCanvasPinned(isPinned),
      setCanvasFullscreen: (isFullscreen: boolean) => useCanvasStore.getState().setCanvasFullscreen(isFullscreen),
      setCanvasWidth: (width: number) => useCanvasStore.getState().setCanvasWidth(width),
      clearCanvas: () => useCanvasStore.getState().clearCanvas(),
      resetCanvas: () => useCanvasStore.getState().resetCanvas(),
      toggleIsCanvasVisible: () => useCanvasStore.getState().toggleIsCanvasVisible(),
      addCanvasToHistory: (title: string, content: string, type: unknown) => useCanvasStore.getState().addCanvasToHistory(title, content, type as any),
      navigateToCanvas: (index: number) => useCanvasStore.getState().navigateToCanvas(index),
      removeCanvasFromHistory: (index: number) => useCanvasStore.getState().removeCanvasFromHistory(index),
      clearCanvasHistory: () => useCanvasStore.getState().clearCanvasHistory(),
      
      // Session Store actions (proxied)
      setSessionId: (sessionId: string | null) => useSessionStore.getState().setSessionId(sessionId),
      setSessionStatus: (status: unknown) => useSessionStore.getState().setSessionStatus(status as any),
      setMessages: (messages: unknown[]) => useSessionStore.getState().setMessages(messages as any),
      setSessions: (sessions: unknown[]) => useSessionStore.getState().setSessions(sessions as any),
      setActiveSessionId: (id: string | null) => useSessionStore.getState().setActiveSessionId(id),
      addMessage: (message: unknown) => useSessionStore.getState().addMessage(message as any),
      clearMessages: () => useSessionStore.getState().clearMessages(),
      saveSession: (name: string) => useSessionStore.getState().saveSession(name),
      loadSession: (id: string) => useSessionStore.getState().loadSession(id),
      deleteSession: (id: string) => useSessionStore.getState().deleteSession(id),
      deleteAllSessions: () => useSessionStore.getState().deleteAllSessions(),
      renameSession: (id: string, newName: string) => useSessionStore.getState().renameSession(id, newName),
      loadAllSessions: () => useSessionStore.getState().loadAllSessions(),
      setIsLoadingSessions: (isLoading: boolean) => useSessionStore.getState().setIsLoadingSessions(isLoading),
      setIsSavingSession: (isSaving: boolean) => useSessionStore.getState().setIsSavingSession(isSaving),
      setIsDeletingSession: (isDeleting: boolean) => useSessionStore.getState().setIsDeletingSession(isDeleting),
      setIsRenamingSession: (isRenaming: boolean) => useSessionStore.getState().setIsRenamingSession(isRenaming),

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