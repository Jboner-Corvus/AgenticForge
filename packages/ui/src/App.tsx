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
import SubAgentCLIView from './components/SubAgentCLIView'; // Import the new component

import TaskCounter from './components/TaskCounter';
import './components/TaskCounter.css';


export default function App() {
  const isCanvasVisible = useStore((state) => state.isCanvasVisible);
  const isControlPanelVisible = useStore((state) => state.isControlPanelVisible);
  const currentPage = useStore((state) => state.currentPage);
  const isCanvasPinned = useStore((state) => state.isCanvasPinned);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { translations } = useLanguage();
  const [delegatedJobId, setDelegatedJobId] = useState<string | null>(null);
  

  const { controlPanelWidth, canvasWidth, setCanvasWidth, handleMouseDownCanvas } = useResizablePanel(300, 500);

  const handleDelegateClick = () => {
    // In a real scenario, this would be triggered by the agent's response
    // For now, we just set a dummy job ID to test the UI
    const dummyJobId = 'c8a9-4f2c-8b1e-3a6d7f8c9b0a'; // Replace with a real one for testing if needed
    setDelegatedJobId(dummyJobId);
  };

  const renderMainContent = () => {
    switch (currentPage) {
      case 'chat':
        return (
          <div className={`flex flex-col h-full transition-all duration-500 ease-in-out flex-grow`}>
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
          <TaskCounter completedTasks={22} totalTasks={53} />
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
          <main className="flex-1 overflow-hidden p-spacious flex flex-col">
            <div className="flex-1 overflow-hidden">
              {renderMainContent()}
            </div>

            {/* Test button for delegation */}
            <button onClick={handleDelegateClick} className="my-2 p-2 bg-blue-600 text-white rounded">
              Test Delegate Task
            </button>

            {delegatedJobId && (
              <div className="mt-4">
                <SubAgentCLIView jobId={delegatedJobId} />
              </div>
            )}

            {/* Section du Canevas (apparaît et disparaît) */}
            {(isCanvasVisible || isCanvasPinned) && (
              <div
                className="flex-shrink-0 h-full relative mt-6"
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

          </main>
        </div>
        <Toaster />
        <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      </div>
    </LanguageProvider>
  );
}