import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PageType, ToastOptions } from './types';

export interface UIState {
  // Page navigation
  currentPage: PageType;
  
  // Modal states
  isSettingsModalOpen: boolean;
  
  // Panel visibility
  isControlPanelVisible: boolean;
  isDebugLogVisible: boolean;
  isTodoListVisible: boolean;
  
  // Theme
  isDarkMode: boolean;
  
  // Processing states
  isProcessing: boolean;
  agentProgress: number;
  
  // Form states
  messageInputValue: string;
  
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
  
  // Auth
  authToken: string | null;
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
  toggleDebugLogVisibility: () => void;
  toggleDarkMode: () => void;
  
  // Processing
  setIsProcessing: (isProcessing: boolean) => void;
  setAgentProgress: (progress: number) => void;
  
  // Form
  setMessageInputValue: (value: string) => void;
  
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

      // Enhanced Auth Actions
      setAuthTokenAndValidate: async (token: string | null) => {
        if (!token) {
          set({ 
            authToken: null,
            isAuthenticated: false 
          });
          return;
        }

        // Simple validation - just check if token exists
        try {
          // In a real implementation, we would validate the token with the backend
          // For now, we'll just assume it's valid if it's not empty
          if (token.trim() !== '') {
            set({ 
              authToken: token,
              isAuthenticated: true 
            });
          } else {
            set({ 
              authToken: null,
              isAuthenticated: false 
            });
          }
        } catch (error) {
          console.error('Token validation failed:', error);
          set({ 
            authToken: null,
            isAuthenticated: false 
          });
        }
      },

      refreshAuthToken: async () => {
        // For now, we'll just get the token from localStorage
        try {
          const token = localStorage.getItem('authToken');
          if (token) {
            set({ 
              authToken: token,
              isAuthenticated: true 
            });
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
        }
      },

      getValidAuthToken: () => {
        // First check the store
        const storeToken = get().authToken;
        if (storeToken) {
          return storeToken;
        }
        
        // Then check localStorage
        try {
          const localStorageToken = localStorage.getItem('authToken');
          if (localStorageToken) {
            // Update the store with the token from localStorage
            set({ 
              authToken: localStorageToken,
              isAuthenticated: true 
            });
            return localStorageToken;
          }
        } catch (error) {
          console.error('Error getting token from localStorage:', error);
        }
        
        return null;
      },

      // Actions
      setCurrentPage: (currentPage) => set({ currentPage }),
      setIsSettingsModalOpen: (isSettingsModalOpen) => set({ isSettingsModalOpen }),
      setIsControlPanelVisible: (isControlPanelVisible) => set({ isControlPanelVisible }),
      setIsTodoListVisible: (isTodoListVisible) => set({ isTodoListVisible }),
      
      toggleDebugLogVisibility: () => set((state) => ({ 
        isDebugLogVisible: !state.isDebugLogVisible 
      })),
      
      toggleDarkMode: () => set((state) => ({ 
        isDarkMode: !state.isDarkMode 
      })),

      // Processing
      setIsProcessing: (isProcessing) => set({ isProcessing }),
      setAgentProgress: (agentProgress) => set({ agentProgress }),

      // Form
      setMessageInputValue: (messageInputValue) => set({ messageInputValue }),

      // Status
      setAgentStatus: (agentStatus) => set({ agentStatus }),
      setToolStatus: (toolStatus) => set({ toolStatus }),
      setBrowserStatus: (browserStatus) => set({ browserStatus }),
      setServerHealthy: (serverHealthy) => set({ serverHealthy }),
      setTokenStatus: (tokenStatus) => set({ tokenStatus }),
      setToolCount: (toolCount) => set({ toolCount }),
      setToolCreationEnabled: (toolCreationEnabled) => set({ toolCreationEnabled }),
      setCodeExecutionEnabled: (codeExecutionEnabled) => set({ codeExecutionEnabled }),

      // Auth
      setAuthToken: (authToken) => {
        set({ 
          authToken,
          isAuthenticated: !!authToken 
        });
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
        
        set((state) => ({
          debugLog: [...state.debugLog, log]
        }));
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
          errors
        };
      }
    }),
    {
      name: 'agenticforge-ui-store',
      partialize: (state) => ({
        // Persist UI preferences but not temporary states
        currentPage: state.currentPage,
        isControlPanelVisible: state.isControlPanelVisible,
        isDarkMode: state.isDarkMode,
        toolCreationEnabled: state.toolCreationEnabled,
        codeExecutionEnabled: state.codeExecutionEnabled,
        authToken: state.authToken,
        tokenStatus: state.tokenStatus
      })
    }
  )
);