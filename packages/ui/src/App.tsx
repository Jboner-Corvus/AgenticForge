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
import { Toaster } from './components/ui/toaster';
import AgentOutputCanvas from './components/AgentOutputCanvas';
import { HeaderContainer } from './components/HeaderContainer';
import { SettingsModalContainer } from './components/SettingsModalContainer';
import { ChatMessagesContainer } from './components/ChatMessagesContainer';
import { LeaderboardPage } from './components/LeaderboardPage';
import { LlmApiKeyManagementPage } from './components/LlmApiKeyManagementPage';
import { OAuthManagementPage } from './components/OAuthManagementPage';
import { useStore } from './lib/store';
import { DebugLogContainer } from './components/DebugLogContainer';
import SubAgentCLIView from './components/SubAgentCLIView';
import { Eye } from 'lucide-react';


export default function App() {
  const isCanvasVisible = useStore((state) => state.isCanvasVisible);
  const isControlPanelVisible = useStore((state) => state.isControlPanelVisible);
  const currentPage = useStore((state) => state.currentPage);
  const isCanvasPinned = useStore((state) => state.isCanvasPinned);
  const isCanvasFullscreen = useStore((state) => state.isCanvasFullscreen);
  const activeCliJobId = useStore((state) => state.activeCliJobId);
  const canvasWidth = useStore((state) => state.canvasWidth);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { translations } = useLanguage();
  
  const { controlPanelWidth, handleMouseDownCanvas } = useResizablePanel(300, 500);

  // Hook pour ajuster la largeur du canvas lors du redimensionnement de la fenêtre
  useEffect(() => {
    const handleResize = () => {
      const maxCanvasWidth = Math.min(800, window.innerWidth * 0.6);
      if (canvasWidth > maxCanvasWidth) {
        useStore.getState().setCanvasWidth(maxCanvasWidth);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [canvasWidth]);

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
        return <LeaderboardPage />;
      case 'llm-api-keys':
        return <LlmApiKeyManagementPage />;
      case 'oauth':
        return <OAuthManagementPage />;
      default:
        return null;
    }
  };

  return (
    <LanguageProvider>
      <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden">
          <AppInitializer />
          <HeaderContainer />
          <Suspense fallback={<div>Loading Settings...</div>}>
            <SettingsModalContainer />
          </Suspense>

        <div className="flex flex-1 overflow-hidden min-w-0">
          {isControlPanelVisible && (
            <div
              className="flex-shrink-0 overflow-hidden relative"
              style={{ width: controlPanelWidth, minWidth: '250px', maxWidth: '400px' }}
            >
              <ControlPanel />
              
            </div>
          )}

          {/* Conteneur principal pour la discussion et le canevas */}
          <main className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 flex overflow-hidden min-w-0">
              <div className="flex-1 min-w-0 overflow-hidden">
                {renderMainContent()}
              </div>

              {/* Bouton flottant pour ouvrir le canevas */}
              {currentPage === 'chat' && !isCanvasVisible && !isCanvasPinned && (
                <button
                  onClick={() => useStore.getState().setIsCanvasVisible(true)}
                  className="absolute right-4 bottom-24 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full p-3 shadow-lg transition-all duration-300 z-10"
                  aria-label="Ouvrir le canevas"
                >
                  <Eye className="h-5 w-5" />
                </button>
              )}

              {/* Section du Canevas (apparaît et disparaît) */}
              {(() => {
                console.log('🎨 [App] Canvas visibility check:', { isCanvasVisible, isCanvasPinned, currentPage, isCanvasFullscreen });
                return (isCanvasVisible || isCanvasPinned) && currentPage === 'chat' && !isCanvasFullscreen;
              })() && (
                <div
                  className="flex-shrink-0 h-full relative border-l-2 border-cyan-500/20"
                  style={{ 
                    width: canvasWidth, 
                    minWidth: '300px', 
                    maxWidth: `${Math.min(800, window.innerWidth * 0.6)}px`
                  }}
                >
                  <AnimatePresence>
                    <Suspense fallback={<div>Loading Canvas...</div>}>
                      <AgentOutputCanvas />
                    </Suspense>
                  </AnimatePresence>
                  <div
                    id="canvas-divider"
                    role={translations.separator}
                    aria-valuenow={canvasWidth}
                    aria-valuemin={300}
                    aria-valuemax={window.innerWidth * 0.6}
                    aria-controls="agent-output-canvas"
                    tabIndex={0}
                    onMouseDown={handleMouseDownCanvas}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowLeft') {
                        const newWidth = Math.min(window.innerWidth * 0.6, canvasWidth + 10);
                        useStore.getState().setCanvasWidth(newWidth);
                      } else if (e.key === 'ArrowRight') {
                        const newWidth = Math.max(300, canvasWidth - 10);
                        useStore.getState().setCanvasWidth(newWidth);
                      }
                    }}
                    className="absolute top-0 left-0 w-2 h-full cursor-ew-resize bg-border hover:bg-primary transition-colors duration-200 z-10"
                  />
                </div>
              )}
              
              {/* Canvas en mode plein écran */}
              {isCanvasFullscreen && (
                <div className="fixed inset-0 z-50">
                  <AnimatePresence>
                    <Suspense fallback={<div>Loading Canvas...</div>}>
                      <AgentOutputCanvas />
                    </Suspense>
                  </AnimatePresence>
                </div>
              )}
            </div>

            {activeCliJobId && (
              <div className="mt-4">
                <SubAgentCLIView jobId={activeCliJobId} />
              </div>
            )}
          </main>
        </div>
        <Toaster />
        <DebugLogContainer />
        <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
        
        
      </div>
    </LanguageProvider>
  );
}