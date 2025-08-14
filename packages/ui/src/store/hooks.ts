// Convenience hooks for accessing individual stores
// Use these instead of useCombinedStore for properties to avoid infinite loops

import { useUIStore } from './uiStore';
import { useCanvasStore } from './canvasStore';
import { useSessionStore } from './sessionStore';
import { useCombinedStore } from './index';

// UI Store hooks
export const useCurrentPage = () => useUIStore(state => state.currentPage);
export const useIsControlPanelVisible = () => useUIStore(state => state.isControlPanelVisible);
export const useIsDebugLogVisible = () => useUIStore(state => state.isDebugLogVisible);
export const useIsTodoListVisible = () => useUIStore(state => state.isTodoListVisible);
export const useIsDarkMode = () => useUIStore(state => state.isDarkMode);
export const useIsProcessing = () => useUIStore(state => state.isProcessing);
export const useAgentProgress = () => useUIStore(state => state.agentProgress);
export const useMessageInputValue = () => useUIStore(state => state.messageInputValue);
export const useAgentStatus = () => useUIStore(state => state.agentStatus);
export const useToolStatus = () => useUIStore(state => state.toolStatus);
export const useBrowserStatus = () => useUIStore(state => state.browserStatus);
export const useServerHealthy = () => useUIStore(state => state.serverHealthy);
export const useIsAuthenticated = () => useUIStore(state => state.isAuthenticated);
export const useTokenStatus = () => useUIStore(state => state.tokenStatus);
export const useToolCount = () => useUIStore(state => state.toolCount);
export const useToolCreationEnabled = () => useUIStore(state => state.toolCreationEnabled);
export const useCodeExecutionEnabled = () => useUIStore(state => state.codeExecutionEnabled);
export const useAuthToken = () => useUIStore(state => state.authToken);
export const useJobId = () => useUIStore(state => state.jobId);
export const useActiveCliJobId = () => useUIStore(state => state.activeCliJobId);
export const useStreamCloseFunc = () => useUIStore(state => state.streamCloseFunc);
export const useDebugLog = () => useUIStore(state => state.debugLog);
export const useIsSettingsModalOpen = () => useUIStore(state => state.isSettingsModalOpen);

// Canvas Store hooks
export const useCanvasContent = () => useCanvasStore(state => state.canvasContent);
export const useCanvasType = () => useCanvasStore(state => state.canvasType);
export const useIsCanvasVisible = () => useCanvasStore(state => state.isCanvasVisible);
export const useIsCanvasPinned = () => useCanvasStore(state => state.isCanvasPinned);
export const useIsCanvasFullscreen = () => useCanvasStore(state => state.isCanvasFullscreen);
export const useCanvasWidth = () => useCanvasStore(state => state.canvasWidth);
export const useCanvasHistory = () => useCanvasStore(state => state.canvasHistory);
export const useCurrentCanvasIndex = () => useCanvasStore(state => state.currentCanvasIndex);

// Session Store hooks
export const useSessionId = () => useSessionStore(state => state.sessionId);
export const useActiveSessionId = () => useSessionStore(state => state.activeSessionId);
export const useSessionStatus = () => useSessionStore(state => state.sessionStatus);
export const useMessages = () => useSessionStore(state => state.messages);
export const useSessions = () => useSessionStore(state => state.sessions);
export const useIsLoadingSessions = () => useSessionStore(state => state.isLoadingSessions);
export const useIsSavingSession = () => useSessionStore(state => state.isSavingSession);
export const useIsDeletingSession = () => useSessionStore(state => state.isDeletingSession);
export const useIsRenamingSession = () => useSessionStore(state => state.isRenamingSession);

// Combined Store hooks - only for actions and LLM state
export const useLlmApiKeys = () => useCombinedStore(state => state.llmApiKeys);
export const useActiveLlmApiKeyIndex = () => useCombinedStore(state => state.activeLlmApiKeyIndex);
export const useIsAddingLlmApiKey = () => useCombinedStore(state => state.isAddingLlmApiKey);
export const useIsRemovingLlmApiKey = () => useCombinedStore(state => state.isRemovingLlmApiKey);
export const useIsSettingActiveLlmApiKey = () => useCombinedStore(state => state.isSettingActiveLlmApiKey);
export const useLeaderboardStats = () => useCombinedStore(state => state.leaderboardStats);
export const useIsLoadingLeaderboardStats = () => useCombinedStore(state => state.isLoadingLeaderboardStats);
export const useIsLoadingTools = () => useCombinedStore(state => state.isLoadingTools);

// Note: useTokenStatus is already defined above at line 23