import { useMemo } from 'react';
import { useUIStore } from '../store/uiStore';
import { useSessionStore } from '../store/sessionStore';
import { useCanvasStore } from '../store/canvasStore';

// Optimized selectors to avoid unnecessary re-renders
export const useUIData = () => {
  return useUIStore((state) => ({
    currentPage: state.currentPage,
    isControlPanelVisible: state.isControlPanelVisible,
    isDarkMode: state.isDarkMode,
    isTodoListVisible: state.isTodoListVisible,
    isDebugLogVisible: state.isDebugLogVisible,
  }));
};

export const useSessionData = () => {
  return useSessionStore((state) => ({
    messages: state.messages,
    isLoading: state.isLoadingSessions,
    activeCliJobId: state.sessionId,
  }));
};

export const useCanvasData = () => {
  return useCanvasStore((state) => ({
    isCanvasVisible: state.isCanvasVisible,
    isCanvasPinned: state.isCanvasPinned,
    isCanvasFullscreen: state.isCanvasFullscreen,
    canvasContent: state.canvasContent,
    canvasWidth: state.canvasWidth,
  }));
};

export const useStableActions = () => {
  const uiStore = useUIStore();
  const canvasStore = useCanvasStore();
  
  return useMemo(() => ({
    canvas: {
      toggleCanvasVisible: canvasStore.toggleIsCanvasVisible,
      setCanvasWidth: canvasStore.setCanvasWidth,
    },
    ui: {
      setCurrentPage: uiStore.setCurrentPage,
      toggleControlPanel: () => uiStore.setIsControlPanelVisible(!uiStore.isControlPanelVisible),
      toggleDarkMode: uiStore.toggleDarkMode,
      toggleTodoList: () => uiStore.setIsTodoListVisible(!uiStore.isTodoListVisible),
      toggleDebugLog: uiStore.toggleDebugLogVisibility,
    },
  }), [uiStore, canvasStore]);
};

export const useConditionalRender = (condition: boolean) => {
  return useMemo(() => condition, [condition]);
};