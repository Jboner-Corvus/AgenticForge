import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PageType, ToastOptions } from './types';
import { clientConfig } from '../config';

export interface UIState {
  // Page navigation
  currentPage: PageType;

  // Modal states
  isSettingsModalOpen: boolean;

  // Panel visibility
  isControlPanelVisible: boolean;
  isDebugLogVisible: boolean;
  isTodoListVisible: boolean;
  isUnifiedTodoListVisible: boolean;

  // Theme
  isDarkMode: boolean;

  // Processing states
  isProcessing: boolean;
  agentProgress: number;

  // Form states
  messageInputValue: string;
  selectedSystemPrompt: string;

  // Token usage stats
  latestTokenStats: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    timestamp: number | null;
  } | null;

  // Status indicators
  agentStatus: string | null;
  toolStatus: string;
  browserStatus: string;
  serverHealthy: boolean;
  isAuthenticated: boolean;
  tokenStatus: boolean;
  toolCount: number | string;
  toolCreationEnabled: boolean;
  codeExecutionEnabled: boolean;

  // Backend Authentication (pour l'accès à l'API Agent MCP)
  // IMPORTANT: Ceci n'est PAS un token LLM !
  authToken: string | null; // Token d'authentification backend
  jobId: string | null;
  activeCliJobId: string | null;

  // Stream management
  streamCloseFunc: (() => void) | null;

  // Debug
  debugLog: string[];

  // Enhanced Auth Actions
  setAuthTokenAndValidate: (token: string | null) => Promise<void>;
  refreshAuthToken: () => Promise<void>;
  getValidAuthToken: () => string | null;

  // Actions
  setCurrentPage: (page: PageType) => void;
  setIsSettingsModalOpen: (isOpen: boolean) => void;
  setIsControlPanelVisible: (isVisible: boolean) => void;
  setIsTodoListVisible: (isVisible: boolean) => void;
  setIsUnifiedTodoListVisible: (isVisible: boolean) => void;
  toggleDebugLogVisibility: () => void;
  toggleDarkMode: () => void;

  // Processing
  setIsProcessing: (isProcessing: boolean) => void;
  setAgentProgress: (progress: number) => void;

  // Form
  setMessageInputValue: (value: string) => void;
  setSelectedSystemPrompt: (prompt: string) => void;

  // Token stats
  setLatestTokenStats: (
    stats: {
      input_tokens: number;
      output_tokens: number;
      total_tokens: number;
      timestamp: number | null;
    } | null,
  ) => void;
  fetchLatestTokenStats: () => Promise<void>;

  // Status
  setAgentStatus: (status: string | null) => void;
  setToolStatus: (status: string) => void;
  setBrowserStatus: (status: string) => void;
  setServerHealthy: (healthy: boolean) => void;
  setTokenStatus: (status: boolean) => void;
  setToolCount: (count: number | string) => void;
  setToolCreationEnabled: (enabled: boolean) => void;
  setCodeExecutionEnabled: (enabled: boolean) => void;

  // Auth
  setAuthToken: (token: string | null) => void;
  setJobId: (jobId: string | null) => void;
  setActiveCliJobId: (jobId: string | null) => void;

  // Debug
  addDebugLog: (log: string) => void;
  clearDebugLog: () => void;

  // Toast (to be implemented)
  toast: (options: ToastOptions) => void;

  // Computed
  getSystemStatus: () => {
    healthy: boolean;
    authenticated: boolean;
    processing: boolean;
    errors: string[];
  };
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentPage: 'chat',
      isSettingsModalOpen: false,
      isControlPanelVisible: false,
      isDebugLogVisible: false,
      isTodoListVisible: false,
      isUnifiedTodoListVisible: true,
      isDarkMode: false,
      isProcessing: false,
      agentProgress: 0,
      messageInputValue: '',
      selectedSystemPrompt: 'coder',
      latestTokenStats: null,
      agentStatus: null,
      toolStatus: '',
      browserStatus: 'idle',
      serverHealthy: false,
      isAuthenticated: false,
      tokenStatus: false,
      toolCount: 0,
      toolCreationEnabled: false,
      codeExecutionEnabled: true,
      authToken:
        clientConfig.AUTH_TOKEN && clientConfig.AUTH_TOKEN.trim() !== ''
          ? clientConfig.AUTH_TOKEN
          : null, // Token backend depuis config
      jobId: null,
      activeCliJobId: null,
      streamCloseFunc: null,
      debugLog: [],

      // Enhanced Auth Actions
      setAuthTokenAndValidate: async (token: string | null) => {
        console.log(
          '🔐 [UIStore] Setting BACKEND auth token (not LLM key):',
          token?.substring(0, 30) + '...',
        );

        if (!token) {
          set({
            authToken: null,
            isAuthenticated: false,
          });
          // Remove from localStorage
          try {
            localStorage.removeItem('backendAuthToken');
          } catch (error) {
            console.warn(
              'Failed to remove backend token from localStorage:',
              error,
            );
          }
          return;
        }

        // Simple validation - just check if token exists and is not empty
        try {
          // In a real implementation, we would validate the token with the backend
          // For now, we'll just assume it's valid if it's not empty
          if (token && token.trim() !== '') {
            set({
              authToken: token,
              isAuthenticated: true,
            });
            // Save backend token to localStorage with clear name
            try {
              localStorage.setItem('backendAuthToken', token);
              console.log(
                '✅ [UIStore] Backend auth token saved to localStorage',
              );
            } catch (error) {
              console.warn(
                'Failed to save backend token to localStorage:',
                error,
              );
            }
          } else {
            set({
              authToken: null,
              isAuthenticated: false,
            });
            // Remove from localStorage if token is empty
            try {
              localStorage.removeItem('backendAuthToken');
            } catch (error) {
              console.warn(
                'Failed to remove backend token from localStorage:',
                error,
              );
            }
          }
        } catch (error) {
          console.error('Backend token validation failed:', error);
          set({
            authToken: null,
            isAuthenticated: false,
          });
        }
      },

      refreshAuthToken: async () => {
        console.log('🔄 [UIStore] Refreshing BACKEND auth token...');
        try {
          // Priorité: localStorage > config
          const storedToken = localStorage.getItem('backendAuthToken');
          if (storedToken) {
            console.log('✅ [UIStore] Found backend token in localStorage');
            set({
              authToken: storedToken,
              isAuthenticated: true,
            });
          } else if (
            clientConfig.AUTH_TOKEN &&
            clientConfig.AUTH_TOKEN.trim() !== ''
          ) {
            // Fallback to the default token from config
            console.log('✅ [UIStore] Using backend token from config');
            set({
              authToken: clientConfig.AUTH_TOKEN,
              isAuthenticated: true,
            });
            // Save it to localStorage for next time
            try {
              localStorage.setItem('backendAuthToken', clientConfig.AUTH_TOKEN);
            } catch (e) {
              console.warn('Could not save config token to localStorage:', e);
            }
          } else {
            console.warn('⚠️ [UIStore] No backend auth token found');
          }
        } catch (error) {
          console.error('Backend token refresh failed:', error);
        }
      },

      getValidAuthToken: () => {
        console.log('🔍 [UIStore] Getting valid BACKEND auth token...');

        // First check the store
        const storeToken = get().authToken;
        if (storeToken) {
          console.log('✅ [UIStore] Using backend token from store');
          return storeToken;
        }

        // Then check localStorage with correct key
        try {
          const localStorageToken = localStorage.getItem('backendAuthToken');
          if (localStorageToken) {
            console.log(
              '✅ [UIStore] Found backend token in localStorage, updating store',
            );
            // Update the store with the token from localStorage
            set({
              authToken: localStorageToken,
              isAuthenticated: true,
            });
            return localStorageToken;
          }
        } catch (error) {
          console.error(
            'Error getting backend token from localStorage:',
            error,
          );
        }

        // Finally, fallback to the default token from config
        if (clientConfig.AUTH_TOKEN && clientConfig.AUTH_TOKEN.trim() !== '') {
          console.log(
            '✅ [UIStore] Using backend token from config as fallback',
          );
          set({
            authToken: clientConfig.AUTH_TOKEN,
            isAuthenticated: true,
          });
          // Try to save it for next time
          try {
            localStorage.setItem('backendAuthToken', clientConfig.AUTH_TOKEN);
          } catch (e) {
            console.warn('Could not save config token to localStorage:', e);
          }
          return clientConfig.AUTH_TOKEN;
        }

        console.warn(
          '⚠️ [UIStore] No valid backend auth token found anywhere!',
        );
        return null;
      },

      // Actions
      setCurrentPage: (currentPage) => set({ currentPage }),
      setIsSettingsModalOpen: (isSettingsModalOpen) =>
        set({ isSettingsModalOpen }),
      setIsControlPanelVisible: (isControlPanelVisible) =>
        set({ isControlPanelVisible }),
      setIsTodoListVisible: (isTodoListVisible) => set({ isTodoListVisible }),
      setIsUnifiedTodoListVisible: (isUnifiedTodoListVisible) =>
        set({ isUnifiedTodoListVisible }),

      toggleDebugLogVisibility: () =>
        set((state) => ({
          isDebugLogVisible: !state.isDebugLogVisible,
        })),

      toggleDarkMode: () =>
        set((state) => ({
          isDarkMode: !state.isDarkMode,
        })),

      // Processing
      setIsProcessing: (isProcessing) => set({ isProcessing }),
      setAgentProgress: (agentProgress) => set({ agentProgress }),

      // Form
      setMessageInputValue: (messageInputValue) => set({ messageInputValue }),
      setSelectedSystemPrompt: (selectedSystemPrompt) =>
        set({ selectedSystemPrompt }),

      // Token stats
      setLatestTokenStats: (latestTokenStats) => set({ latestTokenStats }),
      fetchLatestTokenStats: async () => {
        try {
          const { getLatestTokenStats } = await import('../lib/api');
          const authToken = get().getValidAuthToken();
          const stats = await getLatestTokenStats(authToken);
          set({ latestTokenStats: stats });
        } catch (error) {
          console.error('Failed to fetch token stats:', error);
        }
      },

      // Status
      setAgentStatus: (agentStatus) => set({ agentStatus }),
      setToolStatus: (toolStatus) => set({ toolStatus }),
      setBrowserStatus: (browserStatus) => set({ browserStatus }),
      setServerHealthy: (serverHealthy) => set({ serverHealthy }),
      setTokenStatus: (tokenStatus) => set({ tokenStatus }),
      setToolCount: (toolCount) => set({ toolCount }),
      setToolCreationEnabled: (toolCreationEnabled) =>
        set({ toolCreationEnabled }),
      setCodeExecutionEnabled: (codeExecutionEnabled) =>
        set({ codeExecutionEnabled }),

      // Backend Auth (for Agent MCP API access)
      setAuthToken: (authToken) => {
        console.log(
          '🔐 [UIStore] Setting backend auth token:',
          authToken?.substring(0, 30) + '...',
        );
        set({
          authToken: authToken && authToken.trim() !== '' ? authToken : null,
          isAuthenticated: !!(authToken && authToken.trim() !== ''),
        });
        // Save to localStorage with clear naming
        if (authToken && authToken.trim() !== '') {
          try {
            localStorage.setItem('backendAuthToken', authToken);
          } catch (error) {
            console.warn(
              'Failed to save backend token to localStorage:',
              error,
            );
          }
        } else {
          try {
            localStorage.removeItem('backendAuthToken');
          } catch (error) {
            console.warn(
              'Failed to remove backend token from localStorage:',
              error,
            );
          }
        }
      },

      setJobId: (jobId) => set({ jobId }),
      setActiveCliJobId: (activeCliJobId) => set({ activeCliJobId }),

      // Debug
      addDebugLog: (log) => {
        // Defensive check for undefined logs
        if (log === undefined || log === null || log === 'undefined') {
          console.warn('Attempted to log undefined/null value:', log);
          return;
        }

        // Filter out repetitive logs to reduce spam
        const shouldSkipLog =
          log.includes('Token loaded from cookie') ||
          log.includes('Interface initialized') ||
          log.includes('Session retrieved') ||
          log.includes('Checking server health') ||
          log.includes('Server status: Online') ||
          log.includes('VERBOSE');

        if (shouldSkipLog) {
          return; // Skip repetitive logs
        }

        set((state) => {
          const newLogs = [...state.debugLog, log];
          // Keep only the last 50 logs to prevent memory issues and lag
          return {
            debugLog: newLogs.slice(-50),
          };
        });
      },

      clearDebugLog: () => set({ debugLog: [] }),

      // Toast placeholder (can be implemented with actual toast library)
      toast: (options) => {
        console.log('Toast:', options);
        // TODO: Implement with actual toast library
      },

      // Computed
      getSystemStatus: () => {
        const state = get();
        const errors = [];

        if (!state.serverHealthy) errors.push('Server unhealthy');
        if (!state.isAuthenticated) errors.push('Not authenticated');
        if (state.agentStatus === 'error') errors.push('Agent error');

        return {
          healthy: state.serverHealthy && state.isAuthenticated,
          authenticated: state.isAuthenticated,
          processing: state.isProcessing,
          errors,
        };
      },
    }),
    {
      name: 'agentmcp-ui-store',
      partialize: (state) => ({
        // Persist UI preferences but not temporary states
        currentPage: state.currentPage,
        isControlPanelVisible: state.isControlPanelVisible,
        isDarkMode: state.isDarkMode,
        toolCreationEnabled: state.toolCreationEnabled,
        codeExecutionEnabled: state.codeExecutionEnabled,
        authToken: state.authToken,
        tokenStatus: state.tokenStatus,
        selectedSystemPrompt: state.selectedSystemPrompt,
      }),
    },
  ),
);
