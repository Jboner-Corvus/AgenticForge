import { create } from 'zustand';

import { getTools, saveSessionApi, loadSessionApi, deleteSessionApi, renameSessionApi, addLlmApiKeyApi, removeLlmApiKeyApi, editLlmApiKeyApi, getLeaderboardStats, getLlmApiKeysApi, loadAllSessionsApi, setActiveLlmProviderApi } from './api';
import type { SessionData } from './api';
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
  isControlPanelVisible: boolean;
  isSettingsModalOpen: boolean;
  isDarkMode: boolean;
  isHighContrastMode: boolean;
  toggleHighContrastMode: () => void;

  // LLM API Key Management
  llmApiKeys: LlmApiKey[];
  activeLlmApiKeyIndex: number;
  addLlmApiKey: (provider: string, key: string, baseUrl?: string, model?: string) => void;
  removeLlmApiKey: (index: number) => void;
  editLlmApiKey: (index: number, provider: string, key: string, baseUrl?: string, model?: string) => void;
  setActiveLlmApiKey: (index: number) => void;

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
  setIsControlPanelVisible: (isVisible: boolean) => void;
  setIsSettingsModalOpen: (isOpen: boolean) => void;
  toggleDarkMode: () => void;
  toggleIsCanvasVisible: () => void;
  clearCanvas: () => void;
  currentPage: 'chat' | 'leaderboard' | 'llm-api-keys';
  setCurrentPage: (page: 'chat' | 'leaderboard' | 'llm-api-keys') => void;

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
  startAgent: () => Promise<void>;
  initializeSessionAndMessages: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  addDebugLog: (log) => set((state) => ({ debugLog: [...state.debugLog, log] })),
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
    if (!authToken || !sessionId) return;

    const cacheKey = `tools_${sessionId}`;
    const cachedData = cache[cacheKey];
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_DURATION)) {
      addDebugLog(`[${new Date().toLocaleTimeString()}] [CACHE] Using cached tools data.`);
            setToolCount((cachedData.data as { name: string }[]).length);
      updateSessionStatus('valid');
      return;
    }

    setIsLoadingTools(true);
    addDebugLog(`[${new Date().toLocaleTimeString()}] [REQUEST] Récupération de la liste des outils...`);
    try {
      const tools = (await getTools(authToken, sessionId)) as { name: string }[];
      addDebugLog(`[${new Date().toLocaleTimeString()}] [SUCCESS] ${tools.length} outils trouvés.`);
      setToolCount(tools.length);
      updateSessionStatus('valid');
      setCache(cacheKey, tools);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] Erreur getTools: ${message}`);
      setToolCount('Erreur');
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

  // Canvas state initialization
  canvasContent: '',
  canvasType: 'text',
  isCanvasVisible: false,
  isControlPanelVisible: true,
  isSettingsModalOpen: false,
  isDarkMode: false,
  isHighContrastMode: false,

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
  llmApiKeys: [],
  activeLlmApiKeyIndex: -1, // -1 indicates no key is active

  sessionStatus: 'unknown',
  setAgentStatus: (agentStatus) => set({ agentStatus }),
  setToolStatus: (toolStatus) => set({ toolStatus }),
  setAuthToken: (authToken) => set({ authToken }),
  setBrowserStatus: (status) => set({ browserStatus: status }),
  setCodeExecutionEnabled: (codeExecutionEnabled) => set({ codeExecutionEnabled }),
  
  setIsProcessing: (isProcessing) => set((state) => {
    if (state.isProcessing && !isProcessing && state.agentStatus !== 'error') {
      state.updateLeaderboardStats({ successfulRuns: 1 });
    }
    return { isProcessing };
  }),
  setJobId: (jobId) => set({ jobId }),
  setMessageInputValue: (messageInputValue) => set({ messageInputValue }),
  setServerHealthy: (serverHealthy) => set({ serverHealthy }),
  setSessionId: (sessionId) => set({ sessionId }),
  setSessionStatus: (sessionStatus) => set({ sessionStatus }),
  setStreamCloseFunc: (func: (() => void) | null) => set({ streamCloseFunc: func }),

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
  setCanvasContent: (content) => set({ canvasContent: content }),
  setCanvasType: (type) => set({ canvasType: type }),
  setIsCanvasVisible: (isVisible: boolean) => set({ isCanvasVisible: isVisible }),
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
  toggleHighContrastMode: () => set((state) => {
    const newHighContrastMode = !state.isHighContrastMode;
    localStorage.setItem('agenticForgeHighContrastMode', String(newHighContrastMode));
    if (newHighContrastMode) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    return { isHighContrastMode: newHighContrastMode };
  }),

  // LLM API Key Management actions
  addLlmApiKey: (provider: string, key: string, baseUrl?: string, model?: string) => async () => {
    const { setIsAddingLlmApiKey } = get();
    setIsAddingLlmApiKey(true);
    try {
      await addLlmApiKeyApi(provider, key, baseUrl, model);
      const llmApiKeys = get().llmApiKeys; // Get current keys
      set({ llmApiKeys: [...llmApiKeys, { provider, key, baseUrl, model }] });
    } catch (error) {
      console.error("Failed to add LLM API key to backend:", error);
    } finally {
      setIsAddingLlmApiKey(false);
    }
  },
  removeLlmApiKey: (index: number) => async () => {
    const { setIsRemovingLlmApiKey } = get();
    setIsRemovingLlmApiKey(true);
    try {
      await removeLlmApiKeyApi(index);
      const newKeys = get().llmApiKeys.filter((_, i) => i !== index);
      set({ llmApiKeys: newKeys, activeLlmApiKeyIndex: -1 });
    } catch (error) {
      console.error("Failed to remove LLM API key from backend:", error);
    } finally {
      setIsRemovingLlmApiKey(false);
    }
  },
  editLlmApiKey: (index: number, provider: string, key: string, baseUrl?: string, model?: string) => async () => {
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
  setActiveLlmApiKey: (index: number) => async () => {
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

  clearCanvas: () => set({ canvasContent: '', isCanvasVisible: false }),

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
    const { sessionId, messages, sessions, setIsSavingSession } = get();
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
  startAgent: async () => {
    const { messageInputValue, authToken, sessionId, addDebugLog, setIsProcessing, setJobId, addMessage } = get();

    if (!messageInputValue.trim()) {
      addDebugLog(`[${new Date().toLocaleTimeString()}] [WARN] Message input is empty.`);
      return;
    }

    if (!authToken || !sessionId) {
      addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] Missing authentication token or session ID.`);
      return;
    }

    setIsProcessing(true);
    addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Sending message to agent...`);

    // Add user message to history immediately
    addMessage({
      type: 'user',
      content: messageInputValue,
    });

    const storedLlmConfig = localStorage.getItem('llmConfig');
    let llmProvider: string | undefined;
    let llmModelName: string | undefined;
    let llmApiKey: string | undefined;

    if (storedLlmConfig) {
      const parsedConfig = JSON.parse(storedLlmConfig);
      llmProvider = parsedConfig.provider;
      llmModelName = parsedConfig.model;
      llmApiKey = parsedConfig.apiKey;
    }

    try {
      // Try to get JWT from cookie as fallback
      let authHeader = `Bearer ${authToken}`;
      const name = 'agenticforge_jwt=';
      const decodedCookie = decodeURIComponent(document.cookie);
      const ca = decodedCookie.split(';');
      for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
          c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
          const jwtToken = c.substring(name.length, c.length);
          if (jwtToken) {
            authHeader = 'Bearer ' + jwtToken;
          }
          break;
        }
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
          'X-Session-ID': sessionId,
        },
        body: JSON.stringify({
          prompt: messageInputValue,
          apiKey: authToken, // This is the general auth token, not LLM specific
          llmProvider,
          llmModelName,
          llmApiKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message to agent');
      }

      const data = await response.json();
      setJobId(data.jobId);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [SUCCESS] Message sent. Job ID: ${data.jobId}`);

      // Clear input after sending
      set({ messageInputValue: '' });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] Error sending message: ${errorMessage}`);
      setIsProcessing(false);
    }
  },
  toast: () => {},
  initializeSessionAndMessages: async () => {
    const { setSessions, setActiveSessionId, setMessages, setSessionId, addDebugLog, updateLeaderboardStats, addLlmApiKey, setActiveLlmApiKey, setIsLoadingLeaderboardStats, setIsLoadingSessions } = get();

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
    try {
      const keys = await getLlmApiKeysApi();
      keys.forEach((llmKey: { provider: string; key: string; baseUrl?: string; model?: string }) => 
        addLlmApiKey(llmKey.provider, llmKey.key, llmKey.baseUrl, llmKey.model));
      if (keys.length > 0) {
        setActiveLlmApiKey(0);
      }
    } catch (error) {
      console.error("Failed to fetch LLM API keys:", error);
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
