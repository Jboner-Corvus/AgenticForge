import { create } from 'zustand';
import { DisplayableItem } from './types';
import { getTools } from './api';

interface AppState {
  isProcessing: boolean;
  sessionId: string | null;
  authToken: string | null;
  serverHealthy: boolean;
  debugPanelVisible: boolean;
  toolCreationEnabled: boolean;
  codeExecutionEnabled: boolean;
  displayItems: DisplayableItem[];
  debugLog: string[];
  toolCount: number | string;
  sessionStatus: 'error' | 'unknown' | 'valid';
  tokenStatus: boolean;
  messageInputValue: string;
  jobId: string | null;
  streamCloseFunc: (() => void) | null;

  setIsProcessing: (isProcessing: boolean) => void;
  setSessionId: (sessionId: string | null) => void;
  setAuthToken: (authToken: string | null) => void;
  setServerHealthy: (serverHealthy: boolean) => void;
  setDebugPanelVisible: (debugPanelVisible: boolean) => void;
  setToolCreationEnabled: (toolCreationEnabled: boolean) => void;
  setCodeExecutionEnabled: (codeExecutionEnabled: boolean) => void;
  addDisplayItem: (item: DisplayableItem) => void;
  clearDisplayItems: () => void;
  addDebugLog: (log: string) => void;
  clearDebugLog: () => void;
  setToolCount: (toolCount: number | string) => void;
  setSessionStatus: (sessionStatus: 'error' | 'unknown' | 'valid') => void;
  setTokenStatus: (tokenStatus: boolean) => void;
  setMessageInputValue: (messageInputValue: string) => void;
  setJobId: (jobId: string | null) => void;
  setStreamCloseFunc: (func: (() => void) | null) => void;
  updateSessionStatus: (status: 'error' | 'unknown' | 'valid') => void;
  fetchAndDisplayToolCount: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  isProcessing: false,
  sessionId: null,
  authToken: null,
  serverHealthy: false,
  debugPanelVisible: true,
  toolCreationEnabled: true,
  codeExecutionEnabled: true,
  displayItems: [],
  debugLog: [],
  toolCount: 0,
  sessionStatus: 'unknown',
  tokenStatus: false,
  messageInputValue: '',
  jobId: null,
  streamCloseFunc: null,

  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setSessionId: (sessionId) => set({ sessionId }),
  setAuthToken: (authToken) => set({ authToken }),
  setServerHealthy: (serverHealthy) => set({ serverHealthy }),
  setDebugPanelVisible: (debugPanelVisible) => set({ debugPanelVisible }),
  setToolCreationEnabled: (toolCreationEnabled) => set({ toolCreationEnabled }),
  setCodeExecutionEnabled: (codeExecutionEnabled) => set({ codeExecutionEnabled }),
  addDisplayItem: (item) => set((state) => ({ displayItems: [...state.displayItems, item] })),
  clearDisplayItems: () => set({ displayItems: [] }),
  addDebugLog: (log) => set((state) => ({ debugLog: [...state.debugLog, log] })),
  clearDebugLog: () => set({ debugLog: [] }),
  setToolCount: (toolCount) => set({ toolCount }),
  setSessionStatus: (sessionStatus) => set({ sessionStatus }),
  setTokenStatus: (tokenStatus) => set({ tokenStatus }),
  setMessageInputValue: (messageInputValue) => set({ messageInputValue }),
  setJobId: (jobId) => set({ jobId }),
  setStreamCloseFunc: (func) => set({ streamCloseFunc: func }),
  updateSessionStatus: (status) => set({ sessionStatus: status }),
  fetchAndDisplayToolCount: async () => {
    const { authToken, sessionId, addDebugLog, setToolCount, updateSessionStatus } = get();
    if (!authToken || !sessionId) return;
    addDebugLog(`[${new Date().toLocaleTimeString()}] [REQUEST] Récupération de la liste des outils...`);
    try {
      const tools = await getTools(authToken, sessionId) as { name: string }[];
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
}));

