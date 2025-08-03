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
import { useStore } from './lib/store';


export default function App() {
  const isCanvasVisible = useStore((state) => state.isCanvasVisible);
  const isControlPanelVisible = useStore((state) => state.isControlPanelVisible);
  const currentPage = useStore((state) => state.currentPage);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { translations } = useLanguage();
  

  const { controlPanelWidth, canvasWidth, setCanvasWidth, handleMouseDownCanvas } = useResizablePanel(300, 500);

  const renderMainContent = () => {
    switch (currentPage) {
      case 'chat':
        return (
          <div className={`flex flex-col h-full transition-all duration-500 ease-in-out flex-grow`}>
            <ChatMessagesContainer />
            <div className="p-6 flex items-center">
                <UserInput />
            </div>
          </div>
        );
      case 'leaderboard':
        return <LeaderboardPage />;
      case 'llm-api-keys':
        return <LlmApiKeyManagementPage />;
      default:
        return null;
    }
  };

  return (
    <LanguageProvider>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <AppInitializer />
        <HeaderContainer setIsLoginModalOpen={setIsLoginModalOpen} />
        <Suspense fallback={<div>Loading Settings...</div>}>
          <SettingsModalContainer />
        </Suspense>

        <div className="flex flex-1 overflow-hidden">
          {isControlPanelVisible && (
            <div
              className="flex-shrink-0 overflow-hidden relative"
              style={{ width: controlPanelWidth }}
            >
              <ControlPanel />
              
            </div>
          )}

          {/* Conteneur principal pour la discussion et le canevas */}
          <main className="grid grid-cols-1 md:grid-cols-2 flex-1 overflow-hidden gap-6 p-6">
            {renderMainContent()}

            {/* Section du Canevas (apparaît et disparaît) */}
            {isCanvasVisible && (
              <div
                className="flex-shrink-0 h-full relative"
                style={{ width: canvasWidth }}
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

          </main>
        </div>
        <Toaster />
        <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      </div>
    </LanguageProvider>
  );
}