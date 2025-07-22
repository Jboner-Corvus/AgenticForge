import { create } from 'zustand';

import { getTools, saveSessionApi, loadSessionApi, deleteSessionApi, renameSessionApi, addLlmApiKeyApi, removeLlmApiKeyApi } from './api';
import type { SessionData } from './api';
import { generateUUID } from './utils/uuid';
import { type ChatMessage as ExternalChatMessage, type NewChatMessage } from '../types/chat';

// Re-define local interfaces for messages, compatible with the backend stream
export interface BaseMessage {
  id: string;
  type: string;
  content?: string;
}

export interface UserMessage extends BaseMessage {
  type: 'user';
  content: string;
}

export interface AgentResponseMessage extends BaseMessage {
  type: 'agent_response';
  content: string;
}

export interface AgentThoughtMessage extends BaseMessage {
  type: 'agent_thought';
  content: string;
}

export interface ToolCallMessage extends BaseMessage {
  type: 'tool_call';
  toolName: string;
  params: Record<string, unknown>;
}

export interface ToolResultMessage extends BaseMessage {
  type: 'tool_result';
  toolName: string;
  result: Record<string, unknown>;
}

export interface ToolStreamMessage extends BaseMessage {
  type: 'tool_stream';
  data: { content: string };
  contentType?: 'html' | 'markdown' | 'url' | 'text'; // Added for compatibility
}

export interface AgentCanvasOutputMessage extends BaseMessage {
  type: 'agent_canvas_output';
  content: string;
  contentType: 'html' | 'markdown' | 'url' | 'text';
}

export interface ErrorMessage extends BaseMessage {
  type: 'error';
  message: string;
}

export interface CloseMessage extends BaseMessage {
  type: 'close';
}

// Local ChatMessage union type (for internal store use)
export type StoreChatMessage =
  | UserMessage
  | AgentResponseMessage
  | AgentThoughtMessage
  | ToolCallMessage
  | ToolResultMessage
  | ToolStreamMessage
  | AgentCanvasOutputMessage
  | ErrorMessage
  | CloseMessage;

interface Session {
  id: string;
  name: string;
  messages: ExternalChatMessage[]; // Use ChatMessage from types/chat.ts here
  timestamp: number;
}

interface LlmApiKey {
  provider: string;
  key: string;
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
  addLlmApiKey: (provider: string, key: string) => void;
  removeLlmApiKey: (index: number) => void;
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
  
  setTokenStatus: (tokenStatus: boolean) => void;
  setToolCount: (toolCount: number | string) => void;
  setToolCreationEnabled: (toolCreationEnabled: boolean) => void;
  setSessions: (sessions: Session[]) => void;
  setMessages: (messages: ExternalChatMessage[]) => void;
  setActiveSessionId: (id: string | null) => void;

  // Canvas setters
  setCanvasContent: (content: string) => void;
  setCanvasType: (type: 'html' | 'markdown' | 'url' | 'text') => void;
  setIsCanvasVisible: (isVisible: boolean) => void;
  setIsControlPanelVisible: (isVisible: boolean) => void;
  setIsSettingsModalOpen: (isOpen: boolean) => void;
  toggleDarkMode: () => void;
  toggleIsCanvasVisible: () => void;
  clearCanvas: () => void;

  // Session history actions
  saveSession: (name: string) => void;
  loadSession: (id: string) => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, newName: string) => void;

  
  tokenStatus: boolean;
  toolCount: number | string;
  toolCreationEnabled: boolean;
  updateSessionStatus: (status: 'error' | 'unknown' | 'valid') => void;
  startAgent: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  addDebugLog: (log) => set((state) => ({ debugLog: [...state.debugLog, log] })),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, { ...message, id: generateUUID() } as ExternalChatMessage],
    })),
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
    const { addDebugLog, authToken, sessionId, setToolCount, updateSessionStatus, cache, setCache } = get();
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
    }
  },
  agentProgress: 0,
  isProcessing: false,
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
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { isDarkMode: newDarkMode };
  }),
  toggleHighContrastMode: () => set((state) => {
    const newHighContrastMode = !state.isHighContrastMode;
    if (newHighContrastMode) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    return { isHighContrastMode: newHighContrastMode };
  }),

  // LLM API Key Management actions
  addLlmApiKey: (provider: string, key: string) => async () => {
    try {
      await addLlmApiKeyApi(provider, key);
      const llmApiKeys = get().llmApiKeys; // Get current keys
      set({ llmApiKeys: [...llmApiKeys, { provider, key }] });
    } catch (error) {
      console.error("Failed to add LLM API key to backend:", error);
    }
  },
  removeLlmApiKey: (index: number) => async () => {
    try {
      await removeLlmApiKeyApi(index);
      const newKeys = get().llmApiKeys.filter((_, i) => i !== index);
      set({ llmApiKeys: newKeys, activeLlmApiKeyIndex: -1 });
    } catch (error) {
      console.error("Failed to remove LLM API key from backend:", error);
    }
  },
  setActiveLlmApiKey: (index: number) => set(() => {
    return { activeLlmApiKeyIndex: index };
  }),

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
    const { sessionId, messages, sessions } = get();
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
      messages: sessionToSave.messages.map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: 'content' in m ? m.content as string : ''})),
      timestamp: sessionToSave.timestamp,
    };

    try {
      await saveSessionApi(sessionDataToSend);
      const updatedSessions = [...sessions.filter(s => s.id !== sessionId), sessionToSave];
      localStorage.setItem('agenticForgeSessions', JSON.stringify(updatedSessions));
      set({ sessions: updatedSessions });
    } catch (error) {
      console.error("Failed to save session to backend:", error);
    }
  },
  loadSession: (id: string) => async () => {
    try {
      const sessionToLoad = await loadSessionApi(id);
      localStorage.setItem('agenticForgeSessionId', sessionToLoad.id);
      set({
        sessionId: sessionToLoad.id,
        messages: sessionToLoad.messages.map(m => {
          const baseMessage = { id: generateUUID(), content: '' };
          if (m.role === 'user') {
            return { ...baseMessage, type: 'user', content: m.content } as ExternalChatMessage;
          } else if (m.role === 'assistant') {
            // Attempt to map assistant messages to the correct ChatMessage type
            const assistantMessage = JSON.parse(m.content);
            if (assistantMessage.type === 'agent_canvas_output') {
              return { ...baseMessage, type: 'agent_canvas_output', content: assistantMessage.content, contentType: assistantMessage.contentType } as ExternalChatMessage;
            } else if (assistantMessage.type === 'tool_call') {
              return { ...baseMessage, type: 'tool_call', toolName: assistantMessage.toolName, params: assistantMessage.params } as ExternalChatMessage;
            } else if (assistantMessage.type === 'tool_result') {
              return { ...baseMessage, type: 'tool_result', toolName: assistantMessage.toolName, result: { output: assistantMessage.result } } as ExternalChatMessage;
            } else if (assistantMessage.type === 'tool_stream') {
              return { ...baseMessage, type: 'tool_stream', data: assistantMessage.data, contentType: 'text' } as unknown as ExternalChatMessage;
            } else if (assistantMessage.type === 'error') {
              return { ...baseMessage, type: 'error', message: assistantMessage.message } as ExternalChatMessage;
            } else if (assistantMessage.type === 'agent_response') {
              return { ...baseMessage, type: 'agent_response', content: assistantMessage.content } as ExternalChatMessage;
            } else {
              return { ...baseMessage, type: 'agent_thought', content: assistantMessage.content } as ExternalChatMessage; // Default to agent_thought if content exists
            }
          }
          return { ...baseMessage, type: 'error', message: 'Unknown message type' } as ExternalChatMessage; // Fallback for unknown types
        }),
        activeSessionId: sessionToLoad.id,
      });
    } catch (error) {
      console.error("Failed to load session from backend:", error);
    }
  },
  deleteSession: (id: string) => async () => {
    try {
      await deleteSessionApi(id);
      const { sessions, activeSessionId } = get();
      const updatedSessions = sessions.filter(s => s.id !== id);
      localStorage.setItem('agenticForgeSessions', JSON.stringify(updatedSessions));
      let newActiveSessionId = activeSessionId;
      if (newActiveSessionId === id) {
        newActiveSessionId = updatedSessions.length > 0 ? updatedSessions[0].id : null;
        localStorage.setItem('agenticForgeSessionId', newActiveSessionId || '');
      }
      set({ sessions: updatedSessions, activeSessionId: newActiveSessionId });
    } catch (error) {
      console.error("Failed to delete session from backend:", error);
    }
  },
  renameSession: (id: string, newName: string) => async () => {
    try {
      await renameSessionApi(id, newName);
      const { sessions } = get();
      const updatedSessions = sessions.map(s =>
        s.id === id ? { ...s, name: newName } : s
      );
      localStorage.setItem('agenticForgeSessions', JSON.stringify(updatedSessions));
      set({ sessions: updatedSessions });
    } catch (error) {
      console.error("Failed to rename session on backend:", error);
    }
  },

  streamCloseFunc: null,
  tokenStatus: false,
  toolCount: 0,
  toolCreationEnabled: true,
  updateSessionStatus: (status) => set({ sessionStatus: status }),
  toggleIsCanvasVisible: () => set((state) => ({ isCanvasVisible: !state.isCanvasVisible })),
  startAgent: async () => {
    // Placeholder for startAgent logic
    console.log("startAgent called from store (placeholder)");
  },
}));
