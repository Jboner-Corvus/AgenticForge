import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CanvasHistoryItem } from './types';

export type CanvasType = 'html' | 'markdown' | 'url' | 'text' | 'json' | 'webapp' | 'game' | 'embed' | 'wasm';

export interface CanvasState {
  // Canvas content
  canvasContent: string;
  canvasType: CanvasType;
  
  // Canvas display state
  isCanvasVisible: boolean;
  isCanvasPinned: boolean;
  isCanvasFullscreen: boolean;
  canvasWidth: number;
  
  // Canvas history
  canvasHistory: CanvasHistoryItem[];
  currentCanvasIndex: number;
  
  // Actions
  setCanvasContent: (content: string) => void;
  setCanvasType: (type: CanvasType) => void;
  setIsCanvasVisible: (isVisible: boolean) => void;
  setCanvasPinned: (isPinned: boolean) => void;
  setCanvasFullscreen: (isFullscreen: boolean) => void;
  setCanvasWidth: (width: number) => void;
  
  // Canvas management
  clearCanvas: () => void;
  resetCanvas: () => void;
  toggleIsCanvasVisible: () => void;
  
  // History management
  addCanvasToHistory: (title: string, content: string, type: CanvasType) => void;
  navigateToCanvas: (index: number) => void;
  removeCanvasFromHistory: (index: number) => void;
  clearCanvasHistory: () => void;
  
  // Computed
  hasCanvasContent: () => boolean;
  getCurrentHistoryItem: () => CanvasHistoryItem | null;
  canNavigateBack: () => boolean;
  canNavigateForward: () => boolean;
}

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set, get) => ({
      // Initial state
      canvasContent: '',
      canvasType: 'text',
      isCanvasVisible: false,
      isCanvasPinned: false,
      isCanvasFullscreen: false,
      canvasWidth: 500,
      canvasHistory: [],
      currentCanvasIndex: -1,

      // Basic setters
      setCanvasContent: (canvasContent) => set({ canvasContent }),
      setCanvasType: (canvasType) => set({ canvasType }),
      setIsCanvasVisible: (isCanvasVisible) => set({ isCanvasVisible }),
      setCanvasPinned: (isCanvasPinned) => set({ isCanvasPinned }),
      setCanvasFullscreen: (isCanvasFullscreen) => set({ isCanvasFullscreen }),
      setCanvasWidth: (canvasWidth) => {
        // Constrain canvas width
        const constrainedWidth = Math.max(300, Math.min(1200, canvasWidth));
        set({ canvasWidth: constrainedWidth });
      },

      // Canvas management
      clearCanvas: () => set({
        canvasContent: '',
        canvasType: 'text',
        isCanvasVisible: false,
        isCanvasFullscreen: false
      }),

      resetCanvas: () => set({
        canvasContent: '',
        canvasType: 'text',
        isCanvasVisible: false,
        isCanvasPinned: false,
        isCanvasFullscreen: false,
        canvasWidth: 500
      }),

      toggleIsCanvasVisible: () => set((state) => ({
        isCanvasVisible: !state.isCanvasVisible
      })),

      // History management
      addCanvasToHistory: (title, content, type) => {
        const historyItem: CanvasHistoryItem = {
          id: `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title,
          content,
          type,
          timestamp: Date.now()
        };

        set((state) => {
          // If we're not at the end of history, remove items after current index
          let newHistory = [...state.canvasHistory];
          if (state.currentCanvasIndex < newHistory.length - 1) {
            newHistory = newHistory.slice(0, state.currentCanvasIndex + 1);
          }

          // Add new item
          newHistory.push(historyItem);

          // Limit history to 50 items
          if (newHistory.length > 50) {
            newHistory = newHistory.slice(-50);
          }

          return {
            canvasHistory: newHistory,
            currentCanvasIndex: newHistory.length - 1,
            canvasContent: content,
            canvasType: type,
            isCanvasVisible: true
          };
        });

        console.log(`✅ Canvas added to history: "${title}"`);
      },

      navigateToCanvas: (index) => {
        const state = get();
        if (index >= 0 && index < state.canvasHistory.length) {
          const item = state.canvasHistory[index];
          set({
            currentCanvasIndex: index,
            canvasContent: item.content,
            canvasType: item.type,
            isCanvasVisible: true
          });
          console.log(`✅ Navigated to canvas: "${item.title}"`);
        } else {
          console.warn(`Invalid canvas index: ${index}`);
        }
      },

      removeCanvasFromHistory: (index) => {
        set((state) => {
          if (index < 0 || index >= state.canvasHistory.length) {
            return state;
          }

          const newHistory = [...state.canvasHistory];
          const removedItem = newHistory.splice(index, 1)[0];
          
          let newCurrentIndex = state.currentCanvasIndex;
          
          // Adjust current index if necessary
          if (index === state.currentCanvasIndex) {
            // If we removed the current item, go to previous or next
            if (newHistory.length === 0) {
              newCurrentIndex = -1;
              // Clear canvas if no history left
              return {
                canvasHistory: [],
                currentCanvasIndex: -1,
                canvasContent: '',
                canvasType: 'text' as CanvasType,
                isCanvasVisible: false
              };
            } else if (index > 0) {
              newCurrentIndex = index - 1;
            } else {
              newCurrentIndex = 0;
            }
            
            // Load the new current item
            const newCurrentItem = newHistory[newCurrentIndex];
            set({
              canvasHistory: newHistory,
              currentCanvasIndex: newCurrentIndex,
              canvasContent: newCurrentItem.content,
              canvasType: newCurrentItem.type
            });
          } else if (index < state.currentCanvasIndex) {
            // Adjust index if we removed an item before current
            newCurrentIndex = state.currentCanvasIndex - 1;
          }

          console.log(`✅ Removed canvas from history: "${removedItem.title}"`);
          
          return {
            canvasHistory: newHistory,
            currentCanvasIndex: newCurrentIndex
          };
        });
      },

      clearCanvasHistory: () => {
        set({
          canvasHistory: [],
          currentCanvasIndex: -1,
          canvasContent: '',
          canvasType: 'text',
          isCanvasVisible: false
        });
        console.log('✅ Canvas history cleared');
      },

      // Computed getters
      hasCanvasContent: () => {
        const state = get();
        return state.canvasContent.trim().length > 0;
      },

      getCurrentHistoryItem: () => {
        const state = get();
        if (state.currentCanvasIndex >= 0 && state.currentCanvasIndex < state.canvasHistory.length) {
          return state.canvasHistory[state.currentCanvasIndex];
        }
        return null;
      },

      canNavigateBack: () => {
        const state = get();
        return state.currentCanvasIndex > 0;
      },

      canNavigateForward: () => {
        const state = get();
        return state.currentCanvasIndex < state.canvasHistory.length - 1;
      }
    }),
    {
      name: 'agenticforge-canvas-store',
      partialize: (state) => ({
        // Persist canvas preferences and history
        canvasWidth: state.canvasWidth,
        isCanvasPinned: state.isCanvasPinned,
        canvasHistory: state.canvasHistory.slice(-20), // Keep only last 20 items
        // Don't persist current content or display states
      })
    }
  )
);