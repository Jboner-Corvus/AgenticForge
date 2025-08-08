// packages/ui/src/App.tsx

import { LoginModal } from './components/LoginModal';
import { LanguageProvider } from './lib/contexts/LanguageProvider';
import { useLanguage } from './lib/contexts/LanguageContext';

import { AppInitializer } from './components/AppInitializer';
import { AnimatePresence } from 'framer-motion';

import { ControlPanel } from './components/ControlPanel';
import { UserInput } from './components/UserInput';
import { Suspense, useState } from 'react';
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


export default function App() {
  const isCanvasVisible = useStore((state) => state.isCanvasVisible);
  const isControlPanelVisible = useStore((state) => state.isControlPanelVisible);
  const currentPage = useStore((state) => state.currentPage);
  const isCanvasPinned = useStore((state) => state.isCanvasPinned);
  const activeCliJobId = useStore((state) => state.activeCliJobId);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { translations } = useLanguage();
  

  const { controlPanelWidth, canvasWidth, setCanvasWidth, handleMouseDownCanvas } = useResizablePanel(300, 500);

  const renderMainContent = () => {
    switch (currentPage) {
      case 'chat':
        return (
          <div className="flex flex-col h-full w-full">
            <div className="flex-grow overflow-y-auto">
              <ChatMessagesContainer />
            </div>
            <div className="p-spacious flex items-center sticky bottom-0 bg-background border-t border-border">
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
      <div className="min-h-screen flex flex-col bg-background text-foreground">
          <AppInitializer />
          <HeaderContainer />
          <Suspense fallback={<div>Loading Settings...</div>}>
            <SettingsModalContainer />
          </Suspense>

        <div className="flex flex-1 overflow-hidden">
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
            <div className="flex-1 flex overflow-hidden">
              {renderMainContent()}

              {/* Section du Canevas (apparaît et disparaît) */}
              {(isCanvasVisible || isCanvasPinned) && currentPage === 'chat' && (
                <div
                  className="flex-shrink-0 h-full relative"
                  style={{ width: canvasWidth, minWidth: '300px', maxWidth: '600px' }}
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
                    aria-valuemin={100}
                    aria-valuemax={window.innerWidth / 2}
                    aria-controls="agent-output-canvas"
                    tabIndex={0}
                    onMouseDown={handleMouseDownCanvas}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowLeft') {
                        setCanvasWidth(Math.min(window.innerWidth / 2, canvasWidth + 10));
                      } else if (e.key === 'ArrowRight') {
                        setCanvasWidth(Math.max(100, canvasWidth - 10));
                      }
                    }}
                    className="absolute top-0 left-0 w-2 h-full cursor-ew-resize bg-border hover:bg-primary transition-colors duration-200"
                  />
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