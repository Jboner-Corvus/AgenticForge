// packages/ui/src/App.tsx

import { LoginModal } from './components/LoginModal';
import { LanguageProvider } from './lib/contexts/LanguageProvider';
import { useLanguage } from './lib/contexts/LanguageContext';
import { SessionIdProvider } from './components/SessionIdProvider';
import { AuthManager } from './components/AuthManager';

import { AppInitializer } from './components/AppInitializer';
import { AnimatePresence } from 'framer-motion';

import { ControlPanel } from './components/ControlPanel';
import { Suspense, useState, useEffect } from 'react';
import { useResizablePanel } from './lib/hooks/useResizablePanel';
import { HeaderContainer } from './components/HeaderContainer';
import { SettingsModalContainer } from './components/SettingsModalContainer';
import { ChatContainer } from './components/ChatContainer';
import { usePinningStore } from './store/pinningStore';
// Lazy imports pour optimiser le bundle
import {
  LazyLeaderboardPage,
  LazyLlmKeyManager,
  LazyOAuthPage,
  LazyLayoutManager,
  LazyCanvas,
  LazyAgentCanvas,
  LazyDebugLogContainer,
  LazySubAgentCLIView,
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
  useActiveCliJobId,
  useIsDarkMode,
} from './store/hooks';

// Import du nouveau composant UnifiedTodoListPanel
import { UnifiedTodoListPanel } from './components/UnifiedTodoListPanel';
import { PlaywrightLiveMonitor } from './components/PlaywrightLiveMonitor';

export default function App() {
  console.log('🔥🔥🔥 [DEBUG] App component loading!');
  console.log('🚀 [APP] JavaScript is executing!');
  console.log('📊 [APP] Current timestamp:', Date.now());
  console.log('🌐 [APP] Window location:', window.location.href);

  // Use individual store hooks to avoid infinite loops
  const currentPage = useCurrentPage();
  const isControlPanelVisible = useIsControlPanelVisible();
  const isCanvasVisible = useIsCanvasVisible();
  const isCanvasPinned = useIsCanvasPinned();
  const isCanvasFullscreen = useIsCanvasFullscreen();
  const canvasWidth = useCanvasWidth();
  const canvasContent = useCanvasContent();
  const activeCliJobId = useActiveCliJobId();
  const isDarkMode = useIsDarkMode();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { translations } = useLanguage();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(isDarkMode ? 'light' : 'dark');
    root.classList.add(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Pinning store states
  const components = usePinningStore((state) => state.components);
  const hasPinnedComponents = Object.values(components).some(
    (c) => c.isPinned && c.isVisible,
  );

  const { controlPanelWidth, handleMouseDownCanvas, setCanvasWidth } =
    useResizablePanel(300);

  // Hook pour ajuster la largeur du canvas lors du redimensionnement de la fenêtre
  const setCanvasWidthStore = useStore((state) => state.setCanvasWidth);
  const initializeSessionAndMessages = useStore(
    (state) => state.initializeSessionAndMessages,
  );

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
          <ChatContainer variant="classic" showShadow={true} enhanced={true} />
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
      <SessionIdProvider>
        <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden relative">
          <AppInitializer />
          {/* Header always pinned at the top - outside the scrollable area */}
          <div className="shrink-0">
            <HeaderContainer />
            <UnifiedTodoListPanel />
          </div>
          <Suspense fallback={<div>Loading Settings...</div>}>
            <SettingsModalContainer />
          </Suspense>
          {/* SYSTÈME ÉPIQUE DE PINNING - Affiché si des composants sont pinnés */}
          {hasPinnedComponents && <LazyLayoutManager />}
          {/* LAYOUT CLASSIQUE - Masqué si en mode battlefield */}
          <div className="flex flex-1 overflow-hidden">
            {isControlPanelVisible && (
              <div
                className="flex-shrink-0 overflow-hidden relative"
                style={{
                  width: controlPanelWidth,
                  minWidth: '250px',
                  maxWidth: '400px',
                }}
              >
                <ControlPanel />
              </div>
            )}

            {/* Conteneur principal pour la discussion et le canevas */}
            <main className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 min-w-0 flex flex-col">
                  {/* Main content area with flex layout */}
                  <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {renderMainContent()}
                  </div>
                </div>

                {/* Section du Canvas CLASSIQUE - masquée si pinnée */}
                {(isCanvasVisible || isCanvasPinned) &&
                  currentPage === 'chat' &&
                  !isCanvasFullscreen &&
                  !components.canvas?.isPinned && (
                    <div
                      className="flex-shrink-0 h-full relative border-l-2 border-cyan-500/20"
                      style={{
                        width: canvasWidth,
                        minWidth: '300px',
                        maxWidth: `${Math.min(800, typeof window !== 'undefined' ? window.innerWidth * 0.6 : 600)}px`,
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
                        aria-valuemax={
                          typeof window !== 'undefined'
                            ? window.innerWidth * 0.6
                            : 600
                        }
                        aria-controls="agent-output-canvas"
                        tabIndex={0}
                        onMouseDown={handleMouseDownCanvas}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowLeft') {
                            const maxCanvasWidth =
                              typeof window !== 'undefined'
                                ? window.innerWidth * 0.6
                                : 600;
                            const newWidth = Math.min(
                              maxCanvasWidth,
                              canvasWidth + 10,
                            );
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
                {(isCanvasFullscreen || components.canvas?.isMaximized) &&
                  (canvasContent || isCanvasVisible) && (
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
          <LoginModal
            isOpen={isLoginModalOpen}
            onClose={() => setIsLoginModalOpen(false)}
          />
          <AuthManager
            showStatusIndicator={true}
            indicatorPosition="bottom-right"
            onAuthError={() =>
              console.log("🔐 Système d'authentification activé")
            }
          />

          {/* Playwright Live Monitor for browser automation events */}
          <PlaywrightLiveMonitor jobId={activeCliJobId || undefined} />
        </div>
      </SessionIdProvider>
    </LanguageProvider>
  );
}
