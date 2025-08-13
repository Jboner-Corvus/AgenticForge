import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePinningStore, useInitializePinning } from '../store/pinningStore';
import { useCombinedStore as useStore } from '../store';
import EpicCanvas from './EpicCanvas';
import { EpicTodoListPanel } from './TodoList/EpicTodoListPanel';
import { UserInput } from './UserInput';
import { HeaderContainer } from './HeaderContainer';
import { ChatMessagesContainer } from './ChatMessagesContainer';

// COMPOSANT WRAPPER ÉPIQUE POUR GÉRER LE PINNING
interface PinnableComponentProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

const PinnableComponent: React.FC<PinnableComponentProps> = ({ id, children, className = '' }) => {
  const component = usePinningStore((state) => state.components[id]);
  const updateComponent = usePinningStore((state) => state.updateComponent);
  const bringToFront = usePinningStore((state) => state.bringToFront);

  if (!component || !component.isPinned || !component.isVisible) {
    return null;
  }

  const handleMouseDown = () => {
    bringToFront(id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: component.opacity,
        scale: component.scale,
        x: `${component.position.x}vw`,
        y: `${component.position.y}vh`,
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className={`fixed ${className}`}
      style={{
        width: `${component.position.width}vw`,
        height: `${component.position.height}vh`,
        zIndex: component.zIndex,
        pointerEvents: 'auto'
      }}
      onMouseDown={handleMouseDown}
      drag={component.isPinned}
      dragMomentum={false}
      onDragEnd={(_event, info) => {
        const newX = Math.max(0, Math.min(95, component.position.x + (info.offset.x / window.innerWidth) * 100));
        const newY = Math.max(0, Math.min(95, component.position.y + (info.offset.y / window.innerHeight) * 100));
        
        updateComponent(id, {
          position: {
            ...component.position,
            x: newX,
            y: newY
          }
        });
      }}
    >
      {children}
    </motion.div>
  );
};

// MANAGER PRINCIPAL ÉPIQUE
export const EpicLayoutManager: React.FC = () => {
  // Initialisation du système de pinning
  useInitializePinning();
  
  const components = usePinningStore((state) => state.components);
  const layoutMode = usePinningStore((state) => state.layoutMode);
  const showGrid = usePinningStore((state) => state.showGrid);
  const gridSize = usePinningStore((state) => state.gridSize);
  const globalOpacity = usePinningStore((state) => state.globalOpacity);
  
  // Store states
  const isCanvasVisible = useStore((state) => state.isCanvasVisible);
  const canvasContent = useStore((state) => state.canvasContent);
  const isTodoListVisible = useStore((state) => state.isTodoListVisible);
  const currentPage = useStore((state) => state.currentPage);
  const updatingRef = useRef(false);

  // Auto-update component visibility based on store states
  useEffect(() => {
    if (updatingRef.current) return; // Prevent recursive updates
    
    updatingRef.current = true;
    
    const updateComponent = usePinningStore.getState().updateComponent;
    const { components } = usePinningStore.getState();
    
    // Only update if values actually changed to prevent infinite loops
    const updates = [
      { id: 'canvas', isVisible: isCanvasVisible || !!canvasContent },
      { id: 'todolist', isVisible: isTodoListVisible },
      { id: 'chat', isVisible: currentPage === 'chat' },
      { id: 'input', isVisible: currentPage === 'chat' }
    ];
    
    updates.forEach(({ id, isVisible }) => {
      const currentComponent = components[id];
      if (currentComponent?.isVisible !== isVisible) {
        updateComponent(id, { isVisible });
      }
    });
    
    updatingRef.current = false;
  }, [isCanvasVisible, canvasContent, isTodoListVisible, currentPage]);

  // GRILLE ÉPIQUE
  const GridOverlay = () => {
    if (!showGrid) return null;
    
    const lines = [];
    const cols = Math.floor(100 / (gridSize / window.innerWidth * 100));
    const rows = Math.floor(100 / (gridSize / window.innerHeight * 100));
    
    // Lignes verticales
    for (let i = 0; i <= cols; i++) {
      lines.push(
        <div
          key={`v-${i}`}
          className="absolute top-0 bottom-0 w-px bg-cyan-500/20"
          style={{ left: `${(i * 100) / cols}%` }}
        />
      );
    }
    
    // Lignes horizontales
    for (let i = 0; i <= rows; i++) {
      lines.push(
        <div
          key={`h-${i}`}
          className="absolute left-0 right-0 h-px bg-cyan-500/20"
          style={{ top: `${(i * 100) / rows}%` }}
        />
      );
    }
    
    return (
      <div className="fixed inset-0 pointer-events-none z-0">
        {lines}
      </div>
    );
  };

  // INDICATEUR DE MODE ÉPIQUE
  const LayoutModeIndicator = () => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 right-4 z-[9999] bg-black/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-cyan-500/30"
    >
      <div className="flex items-center gap-2 text-cyan-400 text-sm font-mono">
        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
        <span>LAYOUT: {layoutMode.toUpperCase()}</span>
        {layoutMode === 'battlefield' && (
          <span className="text-red-400 font-bold">⚔️ COMBAT MODE</span>
        )}
      </div>
    </motion.div>
  );

  return (
    <>
      {/* GRILLE */}
      <GridOverlay />
      
      {/* INDICATEUR DE MODE */}
      {layoutMode !== 'freeform' && <LayoutModeIndicator />}
      
      {/* OVERLAY GLOBAL OPACITY */}
      {globalOpacity < 1 && (
        <div 
          className="fixed inset-0 bg-black pointer-events-none z-[1000]"
          style={{ opacity: 1 - globalOpacity }}
        />
      )}

      {/* COMPOSANTS PINNÉS ÉPIQUES */}
      <AnimatePresence>
        {/* HEADER PINNÉ */}
        <PinnableComponent 
          id="header" 
          className="backdrop-blur-sm bg-black/80 border-b border-cyan-500/30 rounded-lg"
        >
          <HeaderContainer />
        </PinnableComponent>

        {/* TODOLIST PINNÉE */}
        <PinnableComponent 
          id="todolist"
          className="backdrop-blur-sm rounded-2xl"
        >
          <EpicTodoListPanel />
        </PinnableComponent>

        {/* CANVAS PINNÉ */}
        <PinnableComponent 
          id="canvas"
          className="backdrop-blur-sm rounded-2xl"
        >
          <EpicCanvas />
        </PinnableComponent>

        {/* CHAT PINNÉ */}
        <PinnableComponent 
          id="chat"
          className="backdrop-blur-sm bg-black/80 border border-cyan-500/30 rounded-2xl overflow-hidden"
        >
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              <ChatMessagesContainer />
            </div>
          </div>
        </PinnableComponent>

        {/* INPUT PINNÉ */}
        <PinnableComponent 
          id="input"
          className="backdrop-blur-sm bg-black/80 border border-cyan-500/30 rounded-2xl p-4"
        >
          <UserInput />
        </PinnableComponent>
      </AnimatePresence>

      {/* DEBUG INFO (DEV ONLY) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-2 text-xs text-cyan-400 font-mono border border-cyan-500/30 z-[9998]">
          <div>PINNED: {Object.values(components).filter(c => c.isPinned).length}</div>
          <div>VISIBLE: {Object.values(components).filter(c => c.isVisible).length}</div>
          <div>MODE: {layoutMode}</div>
          <div>GRID: {showGrid ? 'ON' : 'OFF'}</div>
          <div>OPACITY: {(globalOpacity * 100).toFixed(0)}%</div>
        </div>
      )}
    </>
  );
};