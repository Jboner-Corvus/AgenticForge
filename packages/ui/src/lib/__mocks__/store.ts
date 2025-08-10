import { vi } from 'vitest';
import { create } from 'zustand';
import { AppState } from '../store';

export const mockState: AppState = {
  setMessageInputValue: vi.fn(),
  isProcessing: false,
  messageInputValue: '',
  addDebugLog: vi.fn(),
  addMessage: vi.fn(),
  agentStatus: null,
  toolStatus: '',
  authToken: null,
  browserStatus: 'idle',
  clearDebugLog: vi.fn(),
  clearMessages: vi.fn(),
  codeExecutionEnabled: true,
  debugLog: [],
  messages: [],
  fetchAndDisplayToolCount: vi.fn(),
  jobId: null,
  serverHealthy: true,
  sessionId: 'session-1',
  agentProgress: 0,
  isAuthenticated: false,
  activeCliJobId: null,
  setActiveCliJobId: vi.fn(),
  isLoadingSessions: false,
  isLoadingTools: false,
  isSavingSession: false,
  isDeletingSession: false,
  isRenamingSession: false,
  isAddingLlmApiKey: false,
  isRemovingLlmApiKey: false,
  isSettingActiveLlmApiKey: false,
  isLoadingLeaderboardStats: false,
  canvasContent: '',
  canvasType: 'text',
  isCanvasVisible: false,
  isCanvasPinned: false,
  isCanvasFullscreen: false,
  canvasWidth: 500,
  canvasHistory: [],
  currentCanvasIndex: -1,
  isTodoListVisible: false,
  isControlPanelVisible: true,
  isSettingsModalOpen: false,
  isDarkMode: false,
  isDebugLogVisible: false,
  toggleDebugLogVisibility: vi.fn(),
  llmApiKeys: [],
  activeLlmApiKeyIndex: -1,
  addLlmApiKey: vi.fn(),
  removeLlmApiKey: vi.fn(),
  editLlmApiKey: vi.fn(),
  setActiveLlmApiKey: vi.fn(),
  cache: {},
  setCache: vi.fn(),
  clearCache: vi.fn(),
  leaderboardStats: {
    tokensSaved: 0,
    successfulRuns: 0,
    sessionsCreated: 0,
    apiKeysAdded: 0,
  },
  updateLeaderboardStats: vi.fn(),
  sessions: [
    { id: 'session-1', name: 'Session One', timestamp: Date.now(), status: 'active', messages: [] },
    { id: 'session-2', name: 'Session Two', timestamp: Date.now() - 1000 * 60 * 60, status: 'completed', messages: [] },
  ],
  activeSessionId: 'session-1', // Set an active session for the test
  sessionStatus: 'unknown',
  setAgentStatus: vi.fn(),
  setToolStatus: vi.fn(),
  setAuthToken: vi.fn(),
  setBrowserStatus: vi.fn(),
  setCodeExecutionEnabled: vi.fn(),
  setIsProcessing: vi.fn(),
  setJobId: vi.fn(),
  setServerHealthy: vi.fn(),
  setAgentProgress: vi.fn(),
  setSessionId: vi.fn(),
  setSessionStatus: vi.fn(),
  streamCloseFunc: null,
  setIsLoadingSessions: vi.fn(),
  setIsLoadingTools: vi.fn(),
  setIsSavingSession: vi.fn(),
  setIsDeletingSession: vi.fn(),
  setIsRenamingSession: vi.fn(),
  setIsAddingLlmApiKey: vi.fn(),
  setIsRemovingLlmApiKey: vi.fn(),
  setIsSettingActiveLlmApiKey: vi.fn(),
  setIsLoadingLeaderboardStats: vi.fn(),
  setTokenStatus: vi.fn(),
  setToolCount: vi.fn(),
  setToolCreationEnabled: vi.fn(),
  setSessions: vi.fn(),
  setMessages: vi.fn(),
  setActiveSessionId: vi.fn(),
  toast: vi.fn(),
  setCanvasContent: vi.fn(),
  setCanvasType: vi.fn(),
  setIsCanvasVisible: vi.fn(),
  setCanvasPinned: vi.fn(),
  setCanvasFullscreen: vi.fn(),
  setCanvasWidth: vi.fn(),
  setIsTodoListVisible: vi.fn(),
  resetCanvas: vi.fn(),
  addCanvasToHistory: vi.fn(),
  navigateToCanvas: vi.fn(),
  removeCanvasFromHistory: vi.fn(),
  clearCanvasHistory: vi.fn(),
  setIsControlPanelVisible: vi.fn(),
  setIsSettingsModalOpen: vi.fn(),
  toggleDarkMode: vi.fn(),
  toggleIsCanvasVisible: vi.fn(),
  clearCanvas: vi.fn(),
  currentPage: 'chat',
  setCurrentPage: vi.fn(),
  saveSession: vi.fn(),
  loadSession: vi.fn(),
  deleteSession: vi.fn(),
  deleteAllSessions: vi.fn(),
  renameSession: vi.fn(),
  tokenStatus: true,
  toolCount: 0,
  toolCreationEnabled: true,
  updateSessionStatus: vi.fn(),
  initializeSessionAndMessages: vi.fn(),
};

export const useStore = create<AppState>(() => mockState);

// Function to reset the mock store to its initial state
export const resetMockStore = () => {
  for (const key in mockState) {
    if (Object.prototype.hasOwnProperty.call(mockState, key)) {
      const value = mockState[key as keyof AppState];
      if (typeof value === 'function' && vi.isMockFunction(value)) {
        value.mockClear();
      }
    }
  }
  // Reset specific state properties to their initial values
  mockState.isProcessing = false;
  mockState.messageInputValue = '';
  mockState.sessions = [
    { id: 'session-1', name: 'Session One', timestamp: Date.now(), status: 'active', messages: [] },
    { id: 'session-2', name: 'Session Two', timestamp: Date.now() - 1000 * 60 * 60, status: 'completed', messages: [] },
  ];
  mockState.activeSessionId = 'session-1';
  mockState.sessionId = 'session-1';
  mockState.tokenStatus = false;
  // ... reset other relevant state properties
};
