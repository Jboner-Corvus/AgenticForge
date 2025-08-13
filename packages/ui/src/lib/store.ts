import { create } from 'zustand';

import { getTools, saveSessionApi, loadSessionApi, deleteSessionApi, renameSessionApi, addLlmApiKeyApi, removeLlmApiKeyApi, editLlmApiKeyApi, getLeaderboardStats, getLlmApiKeysApi, loadAllSessionsApi, setActiveLlmProviderApi } from './api';
import type { SessionData } from './api';
import { getTranslations } from './translations';
import { generateUUID } from './utils/uuid';
import { type ChatMessage as ExternalChatMessage, type NewChatMessage } from '../types/chat.d';

// Re-define local interfaces for messages, compatible with the backend stream
// Local ChatMessage union type (for internal store use)
export type StoreChatMessage = ExternalChatMessage;

interface Session {
  id: string;
  name: string;
  messages: ExternalChatMessage[]; // Use ChatMessage from types/chat.ts here
  timestamp: number;
  status?: string; // Added status property
}

interface LlmApiKey {
  provider: string;
  key: string;
  baseUrl?: string;
  model?: string;
}

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

export interface AppState {
  addDebugLog: (log: string) => void;
  addMessage: (item: NewChatMessage) => void;
  agentStatus: string | null;
  toolStatus: string;
  authToken: null | string;
  browserStatus: string;
  clearDebugLog: () => void;
  clearMessages: () => void;
  codeExecutionEnabled: boolean;
  debugLog: string[];
  messages: ExternalChatMessage[]; // Use ChatMessage from types/chat.ts here
  fetchAndDisplayToolCount: () => void;
  isProcessing: boolean;
  jobId: null | string;
  messageInputValue: string;
  serverHealthy: boolean;
  sessionId: null | string;
  agentProgress: number;
  isAuthenticated: boolean;
  activeCliJobId: string | null;
  setActiveCliJobId: (jobId: string | null) => void;

  // Loading states
  isLoadingSessions: boolean;
  isLoadingTools: boolean;
  isSavingSession: boolean;
  isDeletingSession: boolean;
  isRenamingSession: boolean;
  isAddingLlmApiKey: boolean;
  isRemovingLlmApiKey: boolean;
  isSettingActiveLlmApiKey: boolean;
  isLoadingLeaderboardStats: boolean;

  // Canvas state
  canvasContent: string;
  canvasType: 'html' | 'markdown' | 'url' | 'text';
  isCanvasVisible: boolean;
  isCanvasPinned: boolean;
  isCanvasFullscreen: boolean;
  canvasWidth: number;
  
  // Todo List state
  isTodoListVisible: boolean;
  setIsTodoListVisible: (isVisible: boolean) => void;
  
  // Canvas history for navigation
  canvasHistory: Array<{
    id: string;
    title: string;
    content: string;
    type: 'html' | 'markdown' | 'url' | 'text';
    timestamp: number;
  }>;
  currentCanvasIndex: number;
  isControlPanelVisible: boolean;
  isSettingsModalOpen: boolean;
  isDarkMode: boolean;
  isDebugLogVisible: boolean;
  toggleDebugLogVisibility: () => void;

  // LLM API Key Management
  llmApiKeys: LlmApiKey[];
  activeLlmApiKeyIndex: number;
  addLlmApiKey: (provider: string, key: string, baseUrl?: string, model?: string) => Promise<void>;
  removeLlmApiKey: (index: number) => Promise<void>;
  editLlmApiKey: (index: number, provider: string, key: string, baseUrl?: string, model?: string) => Promise<void>;
  setActiveLlmApiKey: (index: number) => Promise<void>;

  // Caching
  cache: Record<string, { data: unknown; timestamp: number }>;
  setCache: (key: string, data: unknown) => void;
  clearCache: () => void;

  // Leaderboard
  leaderboardStats: {
    tokensSaved: number;
    successfulRuns: number;
    sessionsCreated: number;
    apiKeysAdded: number;
  };
  updateLeaderboardStats: (stats: Partial<{
    tokensSaved: number;
    successfulRuns: number;
    sessionsCreated: number;
    apiKeysAdded: number;
  }>) => void;

  // Session history
  sessions: Session[];
  activeSessionId: string | null;

  sessionStatus: 'error' | 'unknown' | 'valid';
  setAgentStatus: (agentStatus: string | null) => void;
  setToolStatus: (toolStatus: string) => void;
  setAuthToken: (authToken: null | string) => void;
  setBrowserStatus: (status: string) => void;
  setCodeExecutionEnabled: (codeExecutionEnabled: boolean) => void;
  
  setIsProcessing: (isProcessing: boolean) => void;
  setJobId: (jobId: null | string) => void;
  setMessageInputValue: (messageInputValue: string) => void;
  setServerHealthy: (serverHealthy: boolean) => void;
  setAgentProgress: (progress: number) => void;
  setSessionId: (sessionId: null | string) => void;
  setSessionStatus: (sessionStatus: 'error' | 'unknown' | 'valid') => void;
  streamCloseFunc: (() => void) | null;

  // Loading state setters
  setIsLoadingSessions: (isLoading: boolean) => void;
  setIsLoadingTools: (isLoading: boolean) => void;
  setIsSavingSession: (isSaving: boolean) => void;
  setIsDeletingSession: (isDeleting: boolean) => void;
  setIsRenamingSession: (isRenaming: boolean) => void;
  setIsAddingLlmApiKey: (isAdding: boolean) => void;
  setIsRemovingLlmApiKey: (isRemoving: boolean) => void;
  setIsSettingActiveLlmApiKey: (isSetting: boolean) => void;
  setIsLoadingLeaderboardStats: (isLoading: boolean) => void;
  
  setTokenStatus: (tokenStatus: boolean) => void;
  setToolCount: (toolCount: number | string) => void;
  setToolCreationEnabled: (toolCreationEnabled: boolean) => void;
  setSessions: (sessions: Session[]) => void;
  setMessages: (messages: ExternalChatMessage[]) => void;
  setActiveSessionId: (id: string | null) => void;
  toast: (options: ToastOptions) => void;

  // Canvas setters
  setCanvasContent: (content: string) => void;
  setCanvasType: (type: 'html' | 'markdown' | 'url' | 'text') => void;
  setIsCanvasVisible: (isVisible: boolean) => void;
  setCanvasPinned: (isPinned: boolean) => void;
  setCanvasFullscreen: (isFullscreen: boolean) => void;
  setCanvasWidth: (width: number) => void;
  setIsControlPanelVisible: (isVisible: boolean) => void;
  setIsSettingsModalOpen: (isOpen: boolean) => void;
  toggleDarkMode: () => void;
  toggleIsCanvasVisible: () => void;
  clearCanvas: () => void;
  resetCanvas: () => void;
  addCanvasToHistory: (title: string, content: string, type: 'html' | 'markdown' | 'url' | 'text') => void;
  navigateToCanvas: (index: number) => void;
  removeCanvasFromHistory: (index: number) => void;
  clearCanvasHistory: () => void;
  currentPage: 'chat' | 'leaderboard' | 'llm-api-keys' | 'oauth';
  setCurrentPage: (page: 'chat' | 'leaderboard' | 'llm-api-keys' | 'oauth') => void;

  // Session history actions
  saveSession: (name: string) => void;
  loadSession: (id: string) => void;
  deleteSession: (id: string) => void;
  deleteAllSessions: () => void;
  renameSession: (id: string, newName: string) => void;

  
  tokenStatus: boolean;
  toolCount: number | string;
  toolCreationEnabled: boolean;
  updateSessionStatus: (status: 'error' | 'unknown' | 'valid') => void;
  initializeSessionAndMessages: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  addDebugLog: (log) => {
    // Defensive check for undefined logs
    if (log === undefined || log === null || log === 'undefined') {
      console.warn('Attempted to log undefined/null value:', log);
      return;
    }
    set((state) => ({ debugLog: [...state.debugLog, log] }));
  },
  addMessage: (message) =>
    set((state) => {
      const baseProps = { id: generateUUID(), timestamp: Date.now() };
      const newMessage: ExternalChatMessage = { ...baseProps, ...message } as ExternalChatMessage;
      return { messages: [...state.messages, newMessage] };
    }),
  agentStatus: null,
  toolStatus: '',
  authToken: null,
  browserStatus: 'idle',
  clearDebugLog: () => set({ debugLog: [] }),
  clearMessages: () => set({ messages: [] }),
  codeExecutionEnabled: true,
  debugLog: [],
  messages: [],
  fetchAndDisplayToolCount: async () => {
    const { addDebugLog, authToken, sessionId, setToolCount, updateSessionStatus, cache, setCache, setIsLoadingTools } = get();
    addDebugLog(`[${new Date().toLocaleTimeString()}] [DEBUG] fetchAndDisplayToolCount called. authToken: ${authToken ? 'set' : 'null'}, sessionId: ${sessionId ? 'set' : 'null'}`);
    
    // Type guard: ensure authToken and sessionId are not null
    if (!authToken || !sessionId) {
      addDebugLog(`[${new Date().toLocaleTimeString()}] [DEBUG] authToken or sessionId is null, returning early.`);
      return;
    }
    // After this point, TypeScript knows authToken and sessionId are strings
    const token: string = authToken;
    const id: string = sessionId;

    const cacheKey = `tools_${id}`;
    const cachedData = cache[cacheKey];
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_DURATION)) {
      addDebugLog(`[${new Date().toLocaleTimeString()}] [CACHE] Using cached tools data.`);
      setToolCount((cachedData.data as { name: string }[]).length);
      updateSessionStatus('valid');
      return;
    }

    setIsLoadingTools(true);
    const translations = getTranslations();
    addDebugLog(`[${new Date().toLocaleTimeString()}] [REQUEST] ${translations.fetchingToolsList}`);
    try {
      const tools = (await getTools(token, id)) as { name: string }[];
      addDebugLog(`[${new Date().toLocaleTimeString()}] [SUCCESS] ${tools.length} ${translations.toolsFound}.`);
      setToolCount(tools.length);
      updateSessionStatus('valid');
      setCache(cacheKey, tools);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] ${translations.getToolsError}: ${message}`);
      setToolCount(translations.error);
      updateSessionStatus('error');
    } finally {
      setIsLoadingTools(false);
    }
  },
  agentProgress: 0,
  isProcessing: false,
  isAuthenticated: false,
  jobId: null,
  messageInputValue: '',
  serverHealthy: false,
  sessionId: null,
  activeCliJobId: null,

  // Canvas state initialization
  canvasContent: '',
  canvasType: 'text',
  isCanvasVisible: false,
  isCanvasPinned: false,
  isCanvasFullscreen: false,
  canvasWidth: 500,
  canvasHistory: [],
  currentCanvasIndex: -1,
  isTodoListVisible: false,
  setIsTodoListVisible: (isVisible: boolean) => set({ isTodoListVisible: isVisible }),
  isControlPanelVisible: false,
  isSettingsModalOpen: false,
  isDarkMode: false,
  isDebugLogVisible: false,

  // Session history initialization
  sessions: [],
  activeSessionId: null,

  // Caching initialization
  cache: {},
  // Leaderboard initialization
  leaderboardStats: {
    tokensSaved: 0,
    successfulRuns: 0,
    sessionsCreated: 0,
    apiKeysAdded: 0,
  },

  // Loading states initialization
  isLoadingSessions: false,
  isLoadingTools: false,
  isSavingSession: false,
  isDeletingSession: false,
  isRenamingSession: false,
  isAddingLlmApiKey: false,
  isRemovingLlmApiKey: false,
  isSettingActiveLlmApiKey: false,
  isLoadingLeaderboardStats: false,

  // LLM API Key Management initialization
  llmApiKeys: (() => {
    try {
      const saved = localStorage.getItem('agenticForgeLlmApiKeys');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  })(),
  activeLlmApiKeyIndex: (() => {
    try {
      const saved = localStorage.getItem('agenticForgeActiveLlmKeyIndex');
      return saved ? parseInt(saved, 10) : -1;
    } catch {
      return -1;
    }
  })(), // -1 indicates no key is active

  sessionStatus: 'unknown',
  setAgentStatus: (agentStatus) => set({ agentStatus }),
  setToolStatus: (toolStatus) => set({ toolStatus }),
  setAuthToken: (authToken) => set({ authToken }),
  setBrowserStatus: (status) => set({ browserStatus: status }),
  setCodeExecutionEnabled: (codeExecutionEnabled) => set({ codeExecutionEnabled }),
  
  setIsProcessing: (isProcessing) => set((state) => {
    if (state.isProcessing && !isProcessing && state.agentStatus !== 'error') {
      setTimeout(() => {
        get().updateLeaderboardStats({ successfulRuns: 1 });
      }, 0);
    }
    return { isProcessing };
  }),
  setJobId: (jobId) => set({ jobId }),
  setMessageInputValue: (messageInputValue) => set({ messageInputValue }),
  setServerHealthy: (serverHealthy) => set({ serverHealthy }),
  setSessionId: (sessionId) => set({ sessionId }),
  setSessionStatus: (sessionStatus) => set({ sessionStatus }),
  setStreamCloseFunc: (func: (() => void) | null) => set({ streamCloseFunc: func }),
  setActiveCliJobId: (jobId) => set({ activeCliJobId: jobId }),

  // Loading state setters
  setIsLoadingSessions: (isLoadingSessions) => set({ isLoadingSessions }),
  setIsLoadingTools: (isLoadingTools) => set({ isLoadingTools }),
  setIsSavingSession: (isSavingSession) => set({ isSavingSession }),
  setIsDeletingSession: (isDeletingSession) => set({ isDeletingSession }),
  setIsRenamingSession: (isRenamingSession) => set({ isRenamingSession }),
  setIsAddingLlmApiKey: (isAddingLlmApiKey) => set({ isAddingLlmApiKey }),
  setIsRemovingLlmApiKey: (isRemovingLlmApiKey) => set({ isRemovingLlmApiKey }),
  setIsSettingActiveLlmApiKey: (isSettingActiveLlmApiKey) => set({ isSettingActiveLlmApiKey }),
  setIsLoadingLeaderboardStats: (isLoadingLeaderboardStats) => set({ isLoadingLeaderboardStats }),
  setTokenStatus: (tokenStatus) => set({ tokenStatus }),
  setToolCount: (toolCount) => set({ toolCount }),
  setAgentProgress: (agentProgress) => set({ agentProgress }),
  setToolCreationEnabled: (toolCreationEnabled) => set({ toolCreationEnabled }),
  setSessions: (sessions) => set({ sessions }),
  setMessages: (messages) => set({ messages }),
  setActiveSessionId: (id) => set({ activeSessionId: id }),

  // Canvas setters
  setCanvasContent: (content) => {
    console.log('🎨 [Store] setCanvasContent appelé avec:', content.length, 'caractères');
    set({ canvasContent: content });
  },
  setCanvasType: (type) => {
    console.log('🎨 [Store] setCanvasType appelé avec:', type);
    set({ canvasType: type });
  },
  setIsCanvasVisible: (isVisible: boolean) => {
    console.log('🎨 [Store] setIsCanvasVisible appelé avec:', isVisible);
    set({ isCanvasVisible: isVisible });
  },
  setCanvasPinned: (isPinned: boolean) => set({ isCanvasPinned: isPinned }),
  setCanvasFullscreen: (isFullscreen: boolean) => set({ isCanvasFullscreen: isFullscreen }),
  setCanvasWidth: (width: number) => set({ canvasWidth: width }),
  setIsControlPanelVisible: (isVisible: boolean) => set({ isControlPanelVisible: isVisible }),
  setIsSettingsModalOpen: (isOpen: boolean) => set({ isSettingsModalOpen: isOpen }),
  toggleDarkMode: () => set((state) => {
    const newDarkMode = !state.isDarkMode;
    localStorage.setItem('agenticForgeDarkMode', String(newDarkMode));
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { isDarkMode: newDarkMode };
  }),
  toggleDebugLogVisibility: () => set((state) => ({ isDebugLogVisible: !state.isDebugLogVisible })),

  // LLM API Key Management actions
  addLlmApiKey: async (provider: string, key: string, baseUrl?: string, model?: string) => {
    const { setIsAddingLlmApiKey, updateLeaderboardStats } = get();
    setIsAddingLlmApiKey(true);
    try {
      await addLlmApiKeyApi(provider, key, baseUrl, model);
      const llmApiKeys = get().llmApiKeys; // Get current keys
      const newKeys = [...llmApiKeys, { provider, key, baseUrl, model }];
      set({ llmApiKeys: newKeys });
      localStorage.setItem('agenticForgeLlmApiKeys', JSON.stringify(newKeys));
      updateLeaderboardStats({ apiKeysAdded: 1 });
    } catch (error) {
      console.error("Failed to add LLM API key to backend:", error);
    } finally {
      setIsAddingLlmApiKey(false);
    }
  },
  removeLlmApiKey: async (index: number) => {
    const { setIsRemovingLlmApiKey } = get();
    setIsRemovingLlmApiKey(true);
    try {
      await removeLlmApiKeyApi(index);
      const newKeys = get().llmApiKeys.filter((_, i) => i !== index);
      set({ llmApiKeys: newKeys, activeLlmApiKeyIndex: -1 });
      localStorage.setItem('agenticForgeLlmApiKeys', JSON.stringify(newKeys));
      localStorage.setItem('agenticForgeActiveLlmKeyIndex', '-1');
    } catch (error) {
      console.error("Failed to remove LLM API key from backend:", error);
    } finally {
      setIsRemovingLlmApiKey(false);
    }
  },
  editLlmApiKey: async (index: number, provider: string, key: string, baseUrl?: string, model?: string) => {
    const { setIsRemovingLlmApiKey, setIsAddingLlmApiKey } = get();
    setIsRemovingLlmApiKey(true);
    try {
      // Edit the key using the API
      await editLlmApiKeyApi(index, provider, key, baseUrl, model);
      
      // Update the state
      const llmApiKeys = get().llmApiKeys;
      const newKeys = [...llmApiKeys];
      newKeys[index] = { provider, key, baseUrl, model };
      set({ llmApiKeys: newKeys });
    } catch (error) {
      console.error("Failed to edit LLM API key:", error);
    } finally {
      setIsRemovingLlmApiKey(false);
      setIsAddingLlmApiKey(false);
    }
  },
  setActiveLlmApiKey: async (index: number) => {
    const { llmApiKeys, authToken, sessionId, addDebugLog, toast, setIsSettingActiveLlmApiKey } = get();
    if (index < 0 || index >= llmApiKeys.length) {
      console.error("Invalid LLM API key index.");
      return;
    }
    const selectedProvider = llmApiKeys[index].provider;
    setIsSettingActiveLlmApiKey(true);
    try {
      await setActiveLlmProviderApi(selectedProvider, authToken, sessionId);
      set({ activeLlmApiKeyIndex: index });
      localStorage.setItem('agenticForgeActiveLlmKeyIndex', index.toString());
      addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Active LLM provider set to: ${selectedProvider}`);
      toast({ title: "LLM Provider Changed", description: `Active LLM provider set to ${selectedProvider}.` });
    } catch (error) {
      console.error("Failed to set active LLM provider:", error);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] Failed to set active LLM provider: ${error instanceof Error ? error.message : String(error)}`);
      toast({ title: "Error", description: "Failed to set active LLM provider.", variant: "destructive" });
    } finally {
      setIsSettingActiveLlmApiKey(false);
    }
  },

  clearCanvas: () => {
    console.log('🎨 [Store] clearCanvas appelé');
    set((state) => ({ 
      canvasContent: '', 
      canvasType: 'text',
      isCanvasVisible: state.isCanvasPinned ? true : false,
      isCanvasFullscreen: false
    }));
  },
  resetCanvas: () => {
    console.log('🎨 [Store] resetCanvas appelé - réinitialisation complète');
    set({ 
      canvasContent: '', 
      canvasType: 'text',
      isCanvasVisible: false,
      isCanvasPinned: false,
      isCanvasFullscreen: false,
      canvasWidth: 500,
      canvasHistory: [],
      currentCanvasIndex: -1
    });
  },
  
  addCanvasToHistory: (title: string, content: string, type: 'html' | 'markdown' | 'url' | 'text') => {
    console.log('🎨 [Store] addCanvasToHistory appelé avec:', title);
    set((state) => {
      const newCanvas = {
        id: generateUUID(),
        title,
        content,
        type,
        timestamp: Date.now()
      };
      
      const newHistory = [...state.canvasHistory, newCanvas];
      const newIndex = newHistory.length - 1;
      
      // Ajuster la largeur du canvas si nécessaire
      const currentCanvasWidth = state.canvasWidth;
      const maxCanvasWidth = Math.min(800, window.innerWidth * 0.6);
      const adjustedCanvasWidth = Math.min(currentCanvasWidth, maxCanvasWidth);
      
      return {
        canvasHistory: newHistory,
        currentCanvasIndex: newIndex,
        canvasContent: content,
        canvasType: type,
        isCanvasVisible: true,
        canvasWidth: adjustedCanvasWidth
      };
    });
  },
  
  navigateToCanvas: (index: number) => {
    console.log('🎨 [Store] navigateToCanvas appelé avec index:', index);
    set((state) => {
      const canvas = state.canvasHistory[index];
      if (canvas) {
        return {
          currentCanvasIndex: index,
          canvasContent: canvas.content,
          canvasType: canvas.type
        };
      }
      return state;
    });
  },
  
  removeCanvasFromHistory: (index: number) => {
    console.log('🎨 [Store] removeCanvasFromHistory appelé avec index:', index);
    set((state) => {
      const newHistory = state.canvasHistory.filter((_, i) => i !== index);
      let newIndex = state.currentCanvasIndex;
      
      // Ajuster l'index si nécessaire
      if (index === state.currentCanvasIndex) {
        // Si on supprime l'élément actuel, aller au précédent ou suivant
        newIndex = Math.max(0, Math.min(index - 1, newHistory.length - 1));
      } else if (index < state.currentCanvasIndex) {
        // Si on supprime un élément avant l'actuel, décrémenter l'index
        newIndex = state.currentCanvasIndex - 1;
      }
      
      // Si plus d'historique, vider le canvas
      if (newHistory.length === 0) {
        return {
          canvasHistory: [],
          currentCanvasIndex: -1,
          canvasContent: '',
          canvasType: 'text'
        };
      }
      
      const currentCanvas = newHistory[newIndex];
      return {
        canvasHistory: newHistory,
        currentCanvasIndex: newIndex,
        canvasContent: currentCanvas?.content || '',
        canvasType: currentCanvas?.type || 'text'
      };
    });
  },
  
  clearCanvasHistory: () => {
    console.log('🎨 [Store] clearCanvasHistory appelé');
    set({ 
      canvasHistory: [],
      currentCanvasIndex: -1,
      canvasContent: '',
      canvasType: 'text',
      isCanvasFullscreen: false
    });
  },

  // Caching actions
  setCache: (key: string, data: unknown) => set((state) => ({
    cache: { ...state.cache, [key]: { data, timestamp: Date.now() } },
  })),
  clearCache: () => set({ cache: {} }),

  // Leaderboard actions
  updateLeaderboardStats: (stats: Partial<{
    tokensSaved: number;
    successfulRuns: number;
    sessionsCreated: number;
    apiKeysAdded: number;
  }>) => set((state) => {
    const updatedStats = {
      tokensSaved: state.leaderboardStats.tokensSaved + (stats.tokensSaved || 0),
      successfulRuns: state.leaderboardStats.successfulRuns + (stats.successfulRuns || 0),
      sessionsCreated: state.leaderboardStats.sessionsCreated + (stats.sessionsCreated || 0),
      apiKeysAdded: state.leaderboardStats.apiKeysAdded + (stats.apiKeysAdded || 0),
    };
    localStorage.setItem('agenticForgeLeaderboardStats', JSON.stringify(updatedStats));
    return { leaderboardStats: updatedStats };
  }),

  // Session history actions
  // Session history actions
  saveSession: (name: string) => async () => {
    const { sessionId, messages, sessions, setIsSavingSession, updateLeaderboardStats } = get();
    if (!sessionId) return;

    const sessionToSave: Session = {
      id: sessionId,
      name: name || `Session ${new Date().toLocaleString()}`,
      messages: messages,
      timestamp: Date.now(),
    };

    const sessionDataToSend: SessionData = {
      id: sessionToSave.id,
      name: sessionToSave.name,
      messages: sessionToSave.messages,
      timestamp: sessionToSave.timestamp,
    };

    setIsSavingSession(true);
    try {
      await saveSessionApi(sessionDataToSend);
      const updatedSessions = [...sessions.filter(s => s.id !== sessionId), sessionToSave];
      localStorage.setItem('agenticForgeSessions', JSON.stringify(updatedSessions));
      set({ sessions: updatedSessions });
      updateLeaderboardStats({ sessionsCreated: 1 });
    } catch (error) {
      console.error("Failed to save session to backend:", error);
    } finally {
      setIsSavingSession(false);
    }
  },
  loadSession: (id: string) => async () => {
    const { setIsLoadingSessions } = get();
    setIsLoadingSessions(true);
    try {
      const sessionToLoad = await loadSessionApi(id);
      localStorage.setItem('agenticForgeSessionId', sessionToLoad.id);
      set({
        sessionId: sessionToLoad.id,
        messages: sessionToLoad.messages,
        activeSessionId: sessionToLoad.id,
      });
    } catch (error) {
      console.error("Failed to load session from backend:", error);
    } finally {
      setIsLoadingSessions(false);
    }
  },
  deleteSession: (id: string) => async () => {
    const { setIsDeletingSession } = get();
    setIsDeletingSession(true);
    try {
      await deleteSessionApi(id);
      const { sessions, activeSessionId } = get();
      const updatedSessions = sessions.filter(s => s.id !== id);
      let newActiveSessionId = activeSessionId;
      if (newActiveSessionId === id) {
        newActiveSessionId = updatedSessions.length > 0 ? updatedSessions[0].id : null;
      }
      set({ sessions: updatedSessions, activeSessionId: newActiveSessionId });
    } catch (error) {
      console.error("Failed to delete session from backend:", error);
    } finally {
      setIsDeletingSession(false);
    }
  },
  deleteAllSessions: () => async () => {
    const { sessions, setIsDeletingSession } = get();
    setIsDeletingSession(true);
    try {
      // Delete all sessions from backend
      for (const session of sessions) {
        await deleteSessionApi(session.id);
      }
      // Clear all sessions from local storage
      localStorage.removeItem('agenticForgeSessions');
      // Update state
      set({ sessions: [], activeSessionId: null });
    } catch (error) {
      console.error("Failed to delete all sessions from backend:", error);
    } finally {
      setIsDeletingSession(false);
    }
  },
  renameSession: (id: string, newName: string) => async () => {
    const { setIsRenamingSession } = get();
    setIsRenamingSession(true);
    try {
      await renameSessionApi(id, newName);
      const { sessions } = get();
      const updatedSessions = sessions.map(s =>
        s.id === id ? { ...s, name: newName } : s
      );
      set({ sessions: updatedSessions });
    } catch (error) {
      console.error("Failed to rename session on backend:", error);
    } finally {
      setIsRenamingSession(false);
    }
  },

  streamCloseFunc: null,
  tokenStatus: false,
  toolCount: 0,
  toolCreationEnabled: true,
  updateSessionStatus: (status) => set({ sessionStatus: status }),
  toggleIsCanvasVisible: () => set((state) => ({ isCanvasVisible: !state.isCanvasVisible })),
  currentPage: 'chat',
  setCurrentPage: (page) => set({ currentPage: page }),
  toast: (options) => {
    // This will be overridden by the actual toast implementation
    console.log('Toast called with options:', options);
  },
  initializeSessionAndMessages: async () => {
    const { setSessions, setActiveSessionId, setMessages, setSessionId, addDebugLog, updateLeaderboardStats, setIsLoadingLeaderboardStats, setIsLoadingSessions } = get();

    // Load leaderboard stats from backend
    setIsLoadingLeaderboardStats(true);
    try {
      const stats = await getLeaderboardStats();
      updateLeaderboardStats(stats);
    } catch (error) {
      console.error("Failed to fetch leaderboard stats:", error);
    } finally {
      setIsLoadingLeaderboardStats(false);
    }

    // Load LLM API keys from backend
    // No explicit loading state for this as it's usually quick and part of init
    console.log('🔑 [INIT] Starting to load LLM API keys from backend...');
    try {
      const keys = await getLlmApiKeysApi();
      console.log('🔑 [INIT] Fetched keys from backend:', keys);
      const validKeys = keys.filter(key => key.provider && key.key);
      console.log('🔑 [INIT] Valid keys after filtering:', validKeys);
      
      if (validKeys.length > 0) {
        // Set all keys at once instead of one by one to avoid multiple re-renders
        set({ llmApiKeys: validKeys, activeLlmApiKeyIndex: 0 });
        localStorage.setItem('agenticForgeLlmApiKeys', JSON.stringify(validKeys));
        localStorage.setItem('agenticForgeActiveLlmKeyIndex', '0');
        console.log('🔑 [INIT] Keys loaded successfully, active index set to 0');
      } else {
        console.log('🔑 [INIT] No valid keys found');
        // Clear localStorage if no keys found
        localStorage.removeItem('agenticForgeLlmApiKeys');
        localStorage.removeItem('agenticForgeActiveLlmKeyIndex');
      }
    } catch (error) {
      console.error("🔑 [INIT] Failed to fetch LLM API keys:", error);
    }

    // Load sessions from backend first
    setIsLoadingSessions(true);
    try {
      const backendSessions = await loadAllSessionsApi();
      if (backendSessions && backendSessions.length > 0) {
        setSessions(backendSessions);
        const currentSessionId = localStorage.getItem('agenticForgeSessionId');
        let activeSession = backendSessions.find((s: SessionData) => s.id === currentSessionId);

        if (!activeSession) {
          // If the stored session ID doesn't exist in backend sessions, try to find a session with matching messages
          const storedMessages = localStorage.getItem(`agenticForgeSession_${currentSessionId}_messages`);
          if (storedMessages) {
            const parsedStoredMessages = JSON.parse(storedMessages);
            activeSession = backendSessions.find((s: SessionData) => JSON.stringify(s.messages) === JSON.stringify(parsedStoredMessages));
          }
        }

        if (!activeSession) {
          // If still no active session, default to the most recent session from backend
          activeSession = backendSessions.sort((a: SessionData, b: SessionData) => b.timestamp - a.timestamp)[0];
        }

        setSessionId(activeSession.id);
        setActiveSessionId(activeSession.id);
        setMessages(activeSession.messages || []);
        // Set active LLM API key based on loaded session's activeLlmProvider
        if (activeSession.activeLlmProvider) {
          const llmApiKeys = get().llmApiKeys;
          const providerIndex = llmApiKeys.findIndex(key => key.provider === activeSession.activeLlmProvider);
          if (providerIndex !== -1) {
            set({ activeLlmApiKeyIndex: providerIndex });
            addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Active LLM provider synchronized from session: ${activeSession.activeLlmProvider}`);
          } else {
            addDebugLog(`[${new Date().toLocaleTimeString()}] [WARN] Session's active LLM provider '${activeSession.activeLlmProvider}' not found in available keys.`);
          }
        }
        addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Sessions and messages loaded from backend.`);
        return;
      }
    } catch (error) {
      console.error("Failed to fetch sessions from backend:", error);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] Failed to load sessions from backend. Falling back to localStorage.`);
    } finally {
      setIsLoadingSessions(false);
    }

    // If no sessions found anywhere, generate a new one (handled by initializeSession in AppInitializer)
    // The initializeSession in AppInitializer will handle generating a new session ID if none exists.
    // Messages will be empty for a new session.
  },
}));