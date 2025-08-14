import React from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// TYPES POUR LE SYSTÈME DE PINNING ÉPIQUE
export interface PinPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PinnedComponent {
  id: string;
  name: string;
  type: 'todolist' | 'canvas' | 'chat' | 'header' | 'input' | 'debug';
  isPinned: boolean;
  isVisible: boolean;
  position: PinPosition;
  zIndex: number;
  opacity: number;
  scale: number;
  isMinimized: boolean;
  isMaximized: boolean;
  theme: 'cyberpunk' | 'neon' | 'matrix' | 'galaxy';
  lastActive: number;
}

export interface PinningState {
  // Components registry
  components: Record<string, PinnedComponent>;
  
  // Layout modes
  layoutMode: 'freeform' | 'grid' | 'cascade' | 'battlefield';
  
  // Global settings
  globalOpacity: number;
  snapToGrid: boolean;
  gridSize: number;
  showGrid: boolean;
  autoHide: boolean;
  
  // Actions
  registerComponent: (component: Omit<PinnedComponent, 'lastActive'>) => void;
  updateComponent: (id: string, updates: Partial<PinnedComponent>) => void;
  togglePin: (id: string) => void;
  toggleVisibility: (id: string) => void;
  setPosition: (id: string, position: PinPosition) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  minimizeComponent: (id: string) => void;
  maximizeComponent: (id: string) => void;
  resetComponent: (id: string) => void;
  
  // Layout management
  setLayoutMode: (mode: 'freeform' | 'grid' | 'cascade' | 'battlefield') => void;
  arrangeComponents: () => void;
  saveLayout: (name: string) => void;
  loadLayout: (name: string) => void;
  
  // Presets
  activateBattlefieldMode: () => void;
  activateMinimalMode: () => void;
  activateTheaterMode: () => void;
  
  // Global settings
  setGlobalOpacity: (opacity: number) => void;
  toggleSnapToGrid: () => void;
  setGridSize: (size: number) => void;
  toggleShowGrid: () => void;
  toggleAutoHide: () => void;
}

// POSITIONS PAR DÉFAUT ÉPIQUES
const DEFAULT_POSITIONS: Record<string, PinPosition> = {
  header: { x: 0, y: 0, width: 100, height: 4 }, // % viewport
  todolist: { x: 2, y: 8, width: 25, height: 85 },
  canvas: { x: 35, y: 8, width: 60, height: 70 },
  chat: { x: 30, y: 80, width: 40, height: 15 },
  input: { x: 30, y: 95, width: 40, height: 4 },
  debug: { x: 75, y: 80, width: 23, height: 18 }
};

const DEFAULT_COMPONENTS: Record<string, Omit<PinnedComponent, 'lastActive'>> = {
  header: {
    id: 'header',
    name: '🚀 Header Control',
    type: 'header',
    isPinned: false,
    isVisible: true,
    position: DEFAULT_POSITIONS.header,
    zIndex: 1000,
    opacity: 0.95,
    scale: 1,
    isMinimized: false,
    isMaximized: false,
    theme: 'cyberpunk'
  },
  todolist: {
    id: 'todolist',
    name: '👑 Mission Control',
    type: 'todolist',
    isPinned: false,
    isVisible: false,
    position: DEFAULT_POSITIONS.todolist,
    zIndex: 100,
    opacity: 0.9,
    scale: 1,
    isMinimized: false,
    isMaximized: false,
    theme: 'cyberpunk'
  },
  canvas: {
    id: 'canvas',
    name: '🎮 Epic Canvas',
    type: 'canvas',
    isPinned: false,
    isVisible: false,
    position: DEFAULT_POSITIONS.canvas,
    zIndex: 50,
    opacity: 1,
    scale: 1,
    isMinimized: false,
    isMaximized: false,
    theme: 'cyberpunk'
  },
  chat: {
    id: 'chat',
    name: '💬 Chat Interface',
    type: 'chat',
    isPinned: false,
    isVisible: true,
    position: DEFAULT_POSITIONS.chat,
    zIndex: 75,
    opacity: 0.95,
    scale: 1,
    isMinimized: false,
    isMaximized: false,
    theme: 'cyberpunk'
  },
  input: {
    id: 'input',
    name: '⌨️ Command Input',
    type: 'input',
    isPinned: false,
    isVisible: true,
    position: DEFAULT_POSITIONS.input,
    zIndex: 200,
    opacity: 0.95,
    scale: 1,
    isMinimized: false,
    isMaximized: false,
    theme: 'cyberpunk'
  },
  debug: {
    id: 'debug',
    name: '🔍 Debug Console',
    type: 'debug',
    isPinned: false,
    isVisible: false,
    position: DEFAULT_POSITIONS.debug,
    zIndex: 25,
    opacity: 0.8,
    scale: 1,
    isMinimized: false,
    isMaximized: false,
    theme: 'matrix'
  }
};

export const usePinningStore = create<PinningState>()(
  persist(
    (set, get) => ({
      // Initial state
      components: {},
      layoutMode: 'freeform',
      globalOpacity: 1,
      snapToGrid: false,
      gridSize: 20,
      showGrid: false,
      autoHide: false,
      
      // Component management
      registerComponent: (component) => {
        set((state) => ({
          components: {
            ...state.components,
            [component.id]: { ...component, lastActive: Date.now() }
          }
        }));
      },
      
      updateComponent: (id, updates) => {
        set((state) => {
          if (!state.components[id]) return state;
          return {
            components: {
              ...state.components,
              [id]: {
                ...state.components[id],
                ...updates,
                lastActive: Date.now()
              }
            }
          };
        });
      },
      
      togglePin: (id) => {
        const component = get().components[id];
        if (!component) return;
        
        get().updateComponent(id, { 
          isPinned: !component.isPinned,
          // Quand on pin, on force la visibilité
          isVisible: !component.isPinned ? true : component.isVisible
        });
      },
      
      toggleVisibility: (id) => {
        const component = get().components[id];
        if (!component) return;
        
        get().updateComponent(id, { 
          isVisible: !component.isVisible,
          // Si on cache, on unpin automatiquement
          isPinned: !component.isVisible ? component.isPinned : false
        });
      },
      
      setPosition: (id, position) => {
        const { snapToGrid, gridSize } = get();
        
        // Snap to grid if enabled
        const finalPosition = snapToGrid ? {
          x: Math.round(position.x / gridSize) * gridSize,
          y: Math.round(position.y / gridSize) * gridSize,
          width: Math.round(position.width / gridSize) * gridSize,
          height: Math.round(position.height / gridSize) * gridSize,
        } : position;
        
        get().updateComponent(id, { position: finalPosition });
      },
      
      bringToFront: (id) => {
        const maxZ = Math.max(...Object.values(get().components).map(c => c.zIndex));
        get().updateComponent(id, { zIndex: maxZ + 1 });
      },
      
      sendToBack: (id) => {
        const minZ = Math.min(...Object.values(get().components).map(c => c.zIndex));
        get().updateComponent(id, { zIndex: Math.max(1, minZ - 1) });
      },
      
      minimizeComponent: (id) => {
        get().updateComponent(id, { 
          isMinimized: true, 
          isMaximized: false,
          scale: 0.3,
          opacity: 0.7
        });
      },
      
      maximizeComponent: (id) => {
        get().updateComponent(id, { 
          isMinimized: false, 
          isMaximized: true,
          scale: 1,
          opacity: 1,
          position: { x: 5, y: 10, width: 90, height: 85 }
        });
      },
      
      resetComponent: (id) => {
        const defaultComponent = DEFAULT_COMPONENTS[id];
        if (defaultComponent) {
          get().updateComponent(id, {
            position: defaultComponent.position,
            scale: 1,
            opacity: defaultComponent.opacity,
            isMinimized: false,
            isMaximized: false
          });
        }
      },
      
      // Layout management
      setLayoutMode: (mode) => {
        set({ layoutMode: mode });
        get().arrangeComponents();
      },
      
      arrangeComponents: () => {
        const { layoutMode, components } = get();
        const visibleComponents = Object.values(components).filter(c => c.isVisible);
        
        switch (layoutMode) {
          case 'grid':
            // Arrange in grid pattern
            visibleComponents.forEach((component, index) => {
              const cols = Math.ceil(Math.sqrt(visibleComponents.length));
              const row = Math.floor(index / cols);
              const col = index % cols;
              const width = 90 / cols;
              const height = 80 / Math.ceil(visibleComponents.length / cols);
              
              get().setPosition(component.id, {
                x: 5 + (col * width),
                y: 10 + (row * height),
                width: width - 2,
                height: height - 2
              });
            });
            break;
            
          case 'cascade':
            // Cascade windows
            visibleComponents.forEach((component, index) => {
              get().setPosition(component.id, {
                x: 10 + (index * 5),
                y: 15 + (index * 5),
                width: 60,
                height: 50
              });
            });
            break;
            
          case 'battlefield':
            // Strategic positioning for all-visible mode
            Object.keys(DEFAULT_POSITIONS).forEach((id) => {
              if (components[id]) {
                get().updateComponent(id, {
                  isVisible: true,
                  isPinned: true,
                  position: DEFAULT_POSITIONS[id]
                });
              }
            });
            break;
        }
      },
      
      saveLayout: (name) => {
        const layout = {
          name,
          components: get().components,
          layoutMode: get().layoutMode,
          timestamp: Date.now()
        };
        localStorage.setItem(`pinning_layout_${name}`, JSON.stringify(layout));
      },
      
      loadLayout: (name) => {
        try {
          const saved = localStorage.getItem(`pinning_layout_${name}`);
          if (saved) {
            const layout = JSON.parse(saved);
            set({ 
              components: layout.components,
              layoutMode: layout.layoutMode
            });
          }
        } catch (error) {
          console.error('Failed to load layout:', error);
        }
      },
      
      // Presets épiques
      activateBattlefieldMode: () => {
        // Mode combat : tout visible et pinned
        Object.keys(DEFAULT_COMPONENTS).forEach((id) => {
          get().updateComponent(id, {
            isVisible: true,
            isPinned: true,
            position: DEFAULT_POSITIONS[id],
            opacity: 0.9,
            scale: 1,
            isMinimized: false,
            isMaximized: false
          });
        });
        set({ layoutMode: 'battlefield' });
      },
      
      activateMinimalMode: () => {
        // Mode minimal : que l'essentiel
        Object.keys(DEFAULT_COMPONENTS).forEach((id) => {
          const isEssential = ['header', 'chat', 'input'].includes(id);
          get().updateComponent(id, {
            isVisible: isEssential,
            isPinned: false,
            opacity: isEssential ? 0.95 : 0.7,
            scale: isEssential ? 1 : 0.8
          });
        });
        set({ layoutMode: 'freeform' });
      },
      
      activateTheaterMode: () => {
        // Mode théâtre : canvas + controls essentiels
        Object.keys(DEFAULT_COMPONENTS).forEach((id) => {
          const isTheater = ['header', 'canvas'].includes(id);
          get().updateComponent(id, {
            isVisible: isTheater,
            isPinned: isTheater,
            opacity: isTheater ? 1 : 0.5,
            scale: id === 'canvas' ? 1.1 : 0.9
          });
        });
        
        // Maximize canvas for theater
        get().updateComponent('canvas', {
          isMaximized: true,
          position: { x: 10, y: 8, width: 80, height: 80 }
        });
        
        set({ layoutMode: 'freeform' });
      },
      
      // Global settings
      setGlobalOpacity: (opacity) => set({ globalOpacity: opacity }),
      toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
      setGridSize: (size) => set({ gridSize: size }),
      toggleShowGrid: () => set((state) => ({ showGrid: !state.showGrid })),
      toggleAutoHide: () => set((state) => ({ autoHide: !state.autoHide }))
    }),
    {
      name: 'agenticforge-pinning-store',
      partialize: (state) => ({
        components: state.components,
        layoutMode: state.layoutMode,
        globalOpacity: state.globalOpacity,
        snapToGrid: state.snapToGrid,
        gridSize: state.gridSize,
        showGrid: state.showGrid,
        autoHide: state.autoHide
      })
    }
  )
);

// HOOK D'INITIALISATION
export const useInitializePinning = () => {
  const registerComponent = usePinningStore((state) => state.registerComponent);
  const components = usePinningStore((state) => state.components);
  
  React.useEffect(() => {
    // Register default components if not already registered
    Object.entries(DEFAULT_COMPONENTS).forEach(([id, component]) => {
      if (!components[id]) {
        registerComponent(component);
      }
    });
  }, [registerComponent, components]);
};