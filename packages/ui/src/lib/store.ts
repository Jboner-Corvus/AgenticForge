import { create } from 'zustand';

import { getTools } from './api';
import { ChatMessage, NewChatMessage } from '../types/chat';
import { generateUUID } from './utils/uuid';

interface AppState {
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
  messages: ChatMessage[];
  fetchAndDisplayToolCount: () => void;
  isProcessing: boolean;
  jobId: null | string;
  messageInputValue: string;
  serverHealthy: boolean;
  sessionId: null | string;
  agentProgress: number;

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
  setStreamCloseFunc: (func: (() => void) | null) => void;
  setTokenStatus: (tokenStatus: boolean) => void;
  setToolCount: (toolCount: number | string) => void;
  setToolCreationEnabled: (toolCreationEnabled: boolean) => void;
  streamCloseFunc: (() => void) | null;
  tokenStatus: boolean;
  toolCount: number | string;
  toolCreationEnabled: boolean;
  updateSessionStatus: (status: 'error' | 'unknown' | 'valid') => void;
}

export const useStore = create<AppState>((set, get) => ({
  addDebugLog: (log) => set((state) => ({ debugLog: [...state.debugLog, log] })),
  addMessage: (message) =>    set((state) => ({      messages: [...state.messages, { ...message, id: generateUUID() }],    })),
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
    const { addDebugLog, authToken, sessionId, setToolCount, updateSessionStatus } = get();
    if (!authToken || !sessionId) return;
    addDebugLog(`[${new Date().toLocaleTimeString()}] [REQUEST] Récupération de la liste des outils...`);
    try {
      const tools = (await getTools(authToken, sessionId)) as { name: string }[];
      addDebugLog(`[${new Date().toLocaleTimeString()}] [SUCCESS] ${tools.length} outils trouvés.`);
      setToolCount(tools.length);
      updateSessionStatus('valid');
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

  sessionStatus: 'unknown',
  setAgentStatus: (agentStatus) => set({ agentStatus }),
  setToolStatus: (toolStatus) => set({ toolStatus }),
  setAuthToken: (authToken) => set({ authToken }),
  setBrowserStatus: (status) => set({ browserStatus: status }),
  setCodeExecutionEnabled: (codeExecutionEnabled) => set({ codeExecutionEnabled }),
  
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setJobId: (jobId) => set({ jobId }),
  setMessageInputValue: (messageInputValue) => set({ messageInputValue }),
  setServerHealthy: (serverHealthy) => set({ serverHealthy }),
  setSessionId: (sessionId) => set({ sessionId }),
  setSessionStatus: (sessionStatus) => set({ sessionStatus }),
  setStreamCloseFunc: (func) => set({ streamCloseFunc: func }),
  setTokenStatus: (tokenStatus) => set({ tokenStatus }),
  setToolCount: (toolCount) => set({ toolCount }),
  setAgentProgress: (agentProgress) => set({ agentProgress }),
  setToolCreationEnabled: (toolCreationEnabled) => set({ toolCreationEnabled }),
  streamCloseFunc: null,
  tokenStatus: false,
  toolCount: 0,
  toolCreationEnabled: true,
  updateSessionStatus: (status) => set({ sessionStatus: status }),
}));
