// packages/ui/src/App.tsx

import { LoginModal } from './components/LoginModal';
import { LanguageProvider } from './lib/contexts/LanguageProvider';
import { useLanguage } from './lib/contexts/LanguageContext';

import { AppInitializer } from './components/AppInitializer';
import { AnimatePresence } from 'framer-motion';

import { ControlPanel } from './components/ControlPanel';
import { UserInput } from './components/UserInput';
import { Suspense, useState, useEffect } from 'react';
import { useResizablePanel } from './lib/hooks/useResizablePanel';
import { HeaderContainer } from './components/HeaderContainer';
import { SettingsModalContainer } from './components/SettingsModalContainer';
import { ChatMessagesContainer } from './components/ChatMessagesContainer';
import { usePinningStore } from './store/pinningStore';
import { Eye } from 'lucide-react';
import { VersionDisplay } from './components/VersionDisplay';
// Lazy imports pour optimiser le bundle
import { 
  LazyLeaderboardPage, 
  LazyLlmKeyManager, 
  LazyOAuthPage,
  LazyLayoutManager,
  LazyEnhancedTodoPanel,
  LazyCanvas,
  LazyAgentCanvas,
  LazyDebugLogContainer,
  LazySubAgentCLIView
} from './components/optimized/LazyComponents';
// Import du store unifié
import { useCombinedStore as useStore } from './store';
import {
  useCurrentPage,
  useIsControlPanelVisible,
  useIsCanvasVisible,
  useIsCanvasPinned,
  useIsCanvasFullscreen,
  useCanvasWidth,
  useCanvasContent,
  useActiveCliJobId
} from './store/hooks';


export default function App() {
  // Use individual store hooks to avoid infinite loops
  const currentPage = useCurrentPage();
  const isControlPanelVisible = useIsControlPanelVisible();
  const isCanvasVisible = useIsCanvasVisible();
  const isCanvasPinned = useIsCanvasPinned();
  const isCanvasFullscreen = useIsCanvasFullscreen();
  const canvasWidth = useCanvasWidth();
  const canvasContent = useCanvasContent();
  const activeCliJobId = useActiveCliJobId();
  
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { translations } = useLanguage();

  // Pinning store states
  const layoutMode = usePinningStore((state) => state.layoutMode);
  const components = usePinningStore((state) => state.components);
  const hasPinnedComponents = Object.values(components).some(c => c.isPinned && c.isVisible);
  
  const { controlPanelWidth, handleMouseDownCanvas, setCanvasWidth } = useResizablePanel(300);

  // Hook pour ajuster la largeur du canvas lors du redimensionnement de la fenêtre
  const setCanvasWidthStore = useStore((state) => state.setCanvasWidth);
  const initializeSessionAndMessages = useStore((state) => state.initializeSessionAndMessages);

  useEffect(() => {
    initializeSessionAndMessages();
  }, [initializeSessionAndMessages]);
  
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        const maxCanvasWidth = Math.min(800, window.innerWidth * 0.6);
        const currentCanvasWidth = canvasWidth;
        if (currentCanvasWidth > maxCanvasWidth) {
          setCanvasWidthStore(maxCanvasWidth);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [canvasWidth, setCanvasWidthStore]);

  const renderMainContent = () => {
    switch (currentPage) {
      case 'chat':
        return (
          <div className="flex flex-col h-full w-full min-w-0">
            <div className="flex-grow overflow-y-auto min-h-0">
              <ChatMessagesContainer />
            </div>
            <div className="p-spacious flex items-center sticky bottom-0 bg-background border-t border-border flex-shrink-0">
                <UserInput />
            </div>
          </div>
        );
      case 'leaderboard':
        return <LazyLeaderboardPage />;
      case 'llm-api-keys':
        return <LazyLlmKeyManager />;
      case 'oauth':
        return <LazyOAuthPage />;
      default:
        return null;
    }
  };

  return (
    <LanguageProvider>
      <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden relative">
        <AppInitializer />
        <HeaderContainer />
        <Suspense fallback={<div>Loading Settings...</div>}>
          <SettingsModalContainer />
        </Suspense>

        {/* SYSTÈME ÉPIQUE DE PINNING - Affiché si des composants sont pinnés */}
        {hasPinnedComponents && <LazyLayoutManager />}

        {/* LAYOUT CLASSIQUE - Masqué si en mode battlefield */}
        <div className={`flex flex-1 overflow-hidden min-w-0 ${layoutMode === 'battlefield' ? 'opacity-20 pointer-events-none' : ''}`}>
          {isControlPanelVisible && (
            <div
              className="flex-shrink-0 overflow-hidden relative"
              style={{ width: controlPanelWidth, minWidth: '250px', maxWidth: '400px' }}
            >
              <ControlPanel />
            </div>
          )}

          {/* Todo List Panel - Version classique (masquée si pinnée) */}
          {!components.todolist?.isPinned && <LazyEnhancedTodoPanel />}

          {/* Conteneur principal pour la discussion et le canevas */}
          <main className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 flex overflow-hidden min-w-0">
              <div className="flex-1 min-w-0 overflow-hidden">
                {renderMainContent()}
              </div>

              {/* Bouton flottant pour ouvrir le canevas */}
              {currentPage === 'chat' && !isCanvasVisible && !isCanvasPinned && !components.canvas?.isPinned && (
                <button
                  onClick={() => useStore.getState().setIsCanvasVisible(true)}
                  className="absolute right-4 bottom-24 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full p-3 shadow-lg transition-all duration-300 z-10"
                  aria-label="Ouvrir le canevas"
                >
                  <Eye className="h-5 w-5" />
                </button>
              )}

              {/* Section du Canvas CLASSIQUE - masquée si pinnée */}
              {(isCanvasVisible || isCanvasPinned) && currentPage === 'chat' && !isCanvasFullscreen && !components.canvas?.isPinned && (
                <div
                  className="flex-shrink-0 h-full relative border-l-2 border-cyan-500/20"
                  style={{ 
                    width: canvasWidth, 
                    minWidth: '300px', 
                    maxWidth: `${Math.min(800, typeof window !== 'undefined' ? window.innerWidth * 0.6 : 600)}px`
                  }}
                >
                  <AnimatePresence>
                    <LazyAgentCanvas />
                  </AnimatePresence>
                  <div
                    id="canvas-divider"
                    role={translations.separator}
                    aria-valuenow={canvasWidth}
                    aria-valuemin={300}
                    aria-valuemax={typeof window !== 'undefined' ? window.innerWidth * 0.6 : 600}
                    aria-controls="agent-output-canvas"
                    tabIndex={0}
                    onMouseDown={handleMouseDownCanvas}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowLeft') {
                        const maxCanvasWidth = typeof window !== 'undefined' ? window.innerWidth * 0.6 : 600;
                        const newWidth = Math.min(maxCanvasWidth, canvasWidth + 10);
                        setCanvasWidth(newWidth);
                      } else if (e.key === 'ArrowRight') {
                        const newWidth = Math.max(300, canvasWidth - 10);
                        setCanvasWidth(newWidth);
                      }
                    }}
                    className="absolute top-0 left-0 w-2 h-full cursor-ew-resize bg-border hover:bg-primary transition-colors duration-200 z-10"
                  />
                </div>
              )}
              
              {/* Canvas ÉPIQUE en mode plein écran - remplace l'ancien canvas */}
              {(isCanvasFullscreen || components.canvas?.isMaximized) && (canvasContent || isCanvasVisible) && (
                <div className="fixed inset-0 z-50">
                  <AnimatePresence>
                    <LazyCanvas />
                  </AnimatePresence>
                </div>
              )}
            </div>

            {activeCliJobId && (
              <div className="mt-4">
                <LazySubAgentCLIView jobId={activeCliJobId} />
              </div>
            )}
          </main>
        </div>
        
        <LazyDebugLogContainer />
        <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
        <VersionDisplay />
      </div>
    </LanguageProvider>
  );
}