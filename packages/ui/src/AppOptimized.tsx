// Optimized App component with performance improvements
import React, { useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LanguageProvider } from './lib/contexts/LanguageProvider';
import { AppInitializer } from './components/AppInitializer';

// Optimized imports
import { 
  MemoizedHeader,
  MemoizedControlPanel,
  MemoizedChatMessages,
  MemoizedUserInput
} from './components/optimized/MemoizedComponents';

import { 
  LazyLeaderboardPage, 
  LazyLlmKeyManager, 
  LazyOAuthPage,
  LazyLayoutManager,
  LazyEnhancedTodoPanel,
  LazyCanvas,
  LazyAgentCanvas,
  LazyWrapper
} from './components/optimized/LazyComponents';

// Store hooks
import {
  useUIData,
  useSessionData,
  useCanvasData,
  useStableActions,
  useConditionalRender
} from './hooks/useOptimizedStore';

// Additional imports
import { LoginModal } from './components/LoginModal';
import { SettingsModalContainer } from './components/SettingsModalContainer';
import SubAgentCLIView from './components/SubAgentCLIView';
import { DebugLogContainer } from './components/DebugLogContainer';
import { Eye } from 'lucide-react';
import { useResizablePanel } from './lib/hooks/useResizablePanel';
import { usePinningStore } from './store/pinningStore';
import { measurePerformance, logMemoryUsage } from './utils/codeCleanup';

// Performance monitoring component
const PerformanceMonitor: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Log initial memory usage
    logMemoryUsage('App Mount');
    
    // Monitor memory usage every 30 seconds in development
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        logMemoryUsage('Runtime');
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, []);

  return <>{children}</>;
};

// Main content renderer with memoization
const MainContentRenderer: React.FC = React.memo(() => {
  const { currentPage } = useUIData();
  const { messages, isLoading } = useSessionData();

  const content = useMemo(() => {
    return measurePerformance('MainContent Render', () => {
      switch (currentPage) {
        case 'chat':
          return (
            <div className="flex flex-col h-full w-full min-w-0">
              <div className="flex-grow overflow-y-auto min-h-0">
                <ErrorBoundary componentName="ChatMessages">
                  <MemoizedChatMessages 
                    messages={messages} 
                    isProcessing={isLoading}
                    className="h-full"
                  />
                </ErrorBoundary>
              </div>
              <div className="p-4 flex items-center sticky bottom-0 bg-background border-t border-border flex-shrink-0">
                <ErrorBoundary componentName="UserInput">
                  <MemoizedUserInput
                    value=""
                    onChange={() => {}}
                    onSubmit={() => {}}
                  />
                </ErrorBoundary>
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
          return <div>Page not found</div>;
      }
    });
  }, [currentPage, messages, isLoading]);

  return <>{content}</>;
});

MainContentRenderer.displayName = 'MainContentRenderer';

// App component
export default function AppOptimized() {
  // Optimized store selections
  const uiState = useUIData();
  const canvasState = useCanvasData();
  const sessionState = useSessionData();
  const actions = useStableActions();

  // Pinning store
  const layoutMode = usePinningStore((state) => state.layoutMode);
  const components = usePinningStore((state) => state.components);
  const hasPinnedComponents = useMemo(() => 
    Object.values(components).some(c => c.isPinned && c.isVisible),
    [components]
  );

  // Panel management
  const { controlPanelWidth, handleMouseDownCanvas } = useResizablePanel(300);

  // Conditional rendering flags
  const showClassicLayout = useConditionalRender(layoutMode !== 'battlefield');
  const showCanvas = useConditionalRender(
    (canvasState.isCanvasVisible || canvasState.isCanvasPinned) && 
    uiState.currentPage === 'chat' && 
    !canvasState.isCanvasFullscreen && 
    !components.canvas?.isPinned
  );
  const showEpicCanvas = useConditionalRender(
    (canvasState.isCanvasFullscreen || components.canvas?.isMaximized) && 
    (!!canvasState.canvasContent || canvasState.isCanvasVisible)
  );

  // Window resize handler with optimization
  useEffect(() => {
    const handleResize = () => {
      measurePerformance('Window Resize Handler', () => {
        if (typeof window !== 'undefined') {
          const maxCanvasWidth = Math.min(800, window.innerWidth * 0.6);
          const currentCanvasWidth = canvasState.canvasWidth;
          if (currentCanvasWidth > maxCanvasWidth) {
            actions.canvas.setCanvasWidth?.(maxCanvasWidth);
          }
        }
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [actions.canvas, canvasState.canvasWidth]);

  return (
    <PerformanceMonitor>
      <LanguageProvider>
        <ErrorBoundary componentName="App" onError={(error, info) => {
          console.error('App-level error:', error, info);
        }}>
          <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden relative">
            {/* App Initializer */}
            <ErrorBoundary componentName="AppInitializer">
              <AppInitializer />
            </ErrorBoundary>

            {/* Header */}
            <ErrorBoundary componentName="Header">
              <MemoizedHeader
                isControlPanelVisible={uiState.isControlPanelVisible}
                isDarkMode={uiState.isDarkMode}
                isTodoListVisible={uiState.isTodoListVisible}
                onToggleControlPanel={() => {}}
                onToggleDarkMode={() => {}}
                onToggleTodoList={() => {}}
                onToggleDebugLog={() => {}}
                onPageChange={() => {}}
              />
            </ErrorBoundary>

            {/* Settings Modal */}
            <LazyWrapper fallback={<div>Loading settings...</div>}>
              <ErrorBoundary componentName="SettingsModal">
                <SettingsModalContainer />
              </ErrorBoundary>
            </LazyWrapper>

            {/* Epic Pinning System */}
            {hasPinnedComponents && (
              <ErrorBoundary componentName="EpicLayoutManager">
                <LazyLayoutManager />
              </ErrorBoundary>
            )}

            {/* Classic Layout */}
            {showClassicLayout && (
              <div className={`flex flex-1 overflow-hidden min-w-0 ${layoutMode === 'battlefield' ? 'opacity-20 pointer-events-none' : ''}`}>
                {/* Control Panel */}
                {uiState.isControlPanelVisible && (
                  <ErrorBoundary componentName="ControlPanel">
                    <MemoizedControlPanel
                      width={controlPanelWidth}
                      isVisible={uiState.isControlPanelVisible}
                      className="border-r border-border"
                    />
                  </ErrorBoundary>
                )}

                {/* Todo List - Classic version when not pinned */}
                {!components.todolist?.isPinned && uiState.isTodoListVisible && (
                  <ErrorBoundary componentName="TodoList">
                    <LazyEnhancedTodoPanel />
                  </ErrorBoundary>
                )}

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 flex overflow-hidden min-w-0">
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <ErrorBoundary componentName="MainContent">
                        <MainContentRenderer />
                      </ErrorBoundary>
                    </div>

                    {/* Canvas Toggle Button */}
                    {uiState.currentPage === 'chat' && 
                     !canvasState.isCanvasVisible && 
                     !canvasState.isCanvasPinned && 
                     !components.canvas?.isPinned && (
                      <button
                        onClick={() => actions.canvas.toggleCanvasVisible?.()}
                        className="absolute right-4 bottom-24 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full p-3 shadow-lg transition-all duration-300 z-10"
                        aria-label="Open Canvas"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    )}

                    {/* Classic Canvas */}
                    {showCanvas && (
                      <div
                        className="flex-shrink-0 h-full relative border-l-2 border-cyan-500/20"
                        style={{
                          width: canvasState.canvasWidth,
                          minWidth: '300px',
                          maxWidth: `${Math.min(800, typeof window !== 'undefined' ? window.innerWidth * 0.6 : 600)}px`
                        }}
                      >
                        <ErrorBoundary componentName="AgentCanvas">
                          <LazyAgentCanvas />
                        </ErrorBoundary>
                        
                        {/* Canvas Resize Handle */}
                        <div
                          id="canvas-divider"
                          role="separator"
                          tabIndex={0}
                          onMouseDown={handleMouseDownCanvas}
                          className="absolute top-0 left-0 w-2 h-full cursor-ew-resize bg-border hover:bg-primary transition-colors duration-200 z-10"
                        />
                      </div>
                    )}
                  </div>

                  {/* CLI View */}
                  {sessionState.activeCliJobId && (
                    <div className="mt-4">
                      <ErrorBoundary componentName="SubAgentCLI">
                        <LazyWrapper>
                          <SubAgentCLIView jobId={sessionState.activeCliJobId} />
                        </LazyWrapper>
                      </ErrorBoundary>
                    </div>
                  )}
                </main>
              </div>
            )}

            {/* Epic Canvas Fullscreen */}
            {showEpicCanvas && (
              <div className="fixed inset-0 z-50">
                <AnimatePresence>
                  <ErrorBoundary componentName="EpicCanvasFullscreen">
                    <LazyCanvas />
                  </ErrorBoundary>
                </AnimatePresence>
              </div>
            )}

            {/* Debug Log */}
            <ErrorBoundary componentName="DebugLog">
              <LazyWrapper>
                <DebugLogContainer />
              </LazyWrapper>
            </ErrorBoundary>

            {/* Login Modal */}
            <ErrorBoundary componentName="LoginModal">
              <LoginModal 
                isOpen={false} 
                onClose={() => {}} 
              />
            </ErrorBoundary>
          </div>
        </ErrorBoundary>
      </LanguageProvider>
    </PerformanceMonitor>
  );
}