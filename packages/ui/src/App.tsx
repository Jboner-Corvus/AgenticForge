// packages/ui/src/App.tsx

import { AppInitializer } from './components/AppInitializer';
import { AnimatePresence } from 'framer-motion';

import { ControlPanel } from './components/ControlPanel';
import { Header } from './components/Header';
import { Message } from './components/Message';
import { SettingsModal } from './components/SettingsModal';
import { useStore } from './lib/store';

import type { ChatMessage } from './types/chat';
import AgentOutputCanvas from './components/AgentOutputCanvas'; // Import the new component

import { UserInput } from './components/UserInput';
import React, { useState, useRef, useEffect } from 'react';
import { generateUUID } from './lib/utils/uuid';
import { Toaster } from './components/ui/toaster';
import { getLeaderboardStats, getLlmApiKeysApi } from './lib/api';

export default function App() {
  const isCanvasVisible = useStore((state) => state.isCanvasVisible);
  const isControlPanelVisible = useStore((state) => state.isControlPanelVisible);
  const setIsControlPanelVisible = useStore((state) => state.setIsControlPanelVisible);
  const isSettingsModalOpen = useStore((state) => state.isSettingsModalOpen);
  const setIsSettingsModalOpen = useStore((state) => state.setIsSettingsModalOpen);
  const isDarkMode = useStore((state) => state.isDarkMode);
  const toggleDarkMode = useStore((state) => state.toggleDarkMode);
  const isHighContrastMode = useStore((state) => state.isHighContrastMode);
  const toggleHighContrastMode = useStore((state) => state.toggleHighContrastMode);
  const messages = useStore((state) => state.messages as ChatMessage[]);
  const setActiveSessionId = useStore((state) => state.setActiveSessionId);
  const setMessages = useStore((state) => state.setMessages);
  const setSessionId = useStore((state) => state.setSessionId);
  const setSessions = useStore((state) => state.setSessions);
  const updateLeaderboardStats = useStore((state) => state.updateLeaderboardStats);
  
  const addLlmApiKey = useStore((state) => state.addLlmApiKey);
  const setActiveLlmApiKey = useStore((state) => state.setActiveLlmApiKey);

  useEffect(() => {
    // Load sessions from local storage on mount (will be replaced by backend fetch later)
    const storedSessions = localStorage.getItem('agenticForgeSessions');
    if (storedSessions) {
      setSessions(JSON.parse(storedSessions));
    }

    // Load leaderboard stats from backend
    const fetchLeaderboard = async () => {
      try {
        const stats = await getLeaderboardStats();
        updateLeaderboardStats(stats);
      } catch (error) {
        console.error("Failed to fetch leaderboard stats:", error);
      }
    };
    fetchLeaderboard();

    // Load LLM API keys from backend
    const fetchLlmApiKeys = async () => {
      try {
        const keys = await getLlmApiKeysApi();
        keys.forEach((llmKey: { provider: string; key: string }) => addLlmApiKey(llmKey.provider, llmKey.key));
        if (keys.length > 0) {
          setActiveLlmApiKey(0);
        }
      } catch (error) {
        console.error("Failed to fetch LLM API keys:", error);
      }
    };
    fetchLlmApiKeys();

    // Set active session from local storage or generate a new one
    let currentSessionId = localStorage.getItem('agenticForgeSessionId');
    if (!currentSessionId) {
      currentSessionId = generateUUID();
      localStorage.setItem('agenticForgeSessionId', currentSessionId);
    }
    setSessionId(currentSessionId);
    setActiveSessionId(currentSessionId);

    // Load messages for the active session
    const storedMessages = localStorage.getItem(`agenticForgeSession_${currentSessionId}_messages`);
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    }

  }, [setSessions, setActiveSessionId, setMessages, setSessionId, updateLeaderboardStats, addLlmApiKey, setActiveLlmApiKey]);

  useEffect(() => {
    // Save current session messages to local storage whenever messages change
    const currentSessionId = useStore.getState().sessionId;
    if (currentSessionId) {
      localStorage.setItem(`agenticForgeSession_${currentSessionId}_messages`, JSON.stringify(messages));
    }
  }, [messages]);

  const [controlPanelWidth, setControlPanelWidth] = useState(300); // Initial width for control panel
  const [canvasWidth, setCanvasWidth] = useState(500); // Initial width for canvas
  const isResizingControlPanel = useRef(false);
  const isResizingCanvas = useRef(false);

  const handleMouseDownControlPanel = (e: React.MouseEvent) => {
    isResizingControlPanel.current = true;
    e.preventDefault();
  };

  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    isResizingCanvas.current = true;
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isResizingControlPanel.current) {
      const newWidth = e.clientX;
      if (newWidth > 100 && newWidth < window.innerWidth / 2) {
        setControlPanelWidth(newWidth);
      }
    } else if (isResizingCanvas.current) {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 100 && newWidth < window.innerWidth / 2) {
        setCanvasWidth(newWidth);
      }
    }
  };

  const handleMouseUp = () => {
    isResizingControlPanel.current = false;
    isResizingCanvas.current = false;
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <AppInitializer />
      <Header
        isControlPanelVisible={isControlPanelVisible}
        setIsControlPanelVisible={setIsControlPanelVisible}
        setIsSettingsModalOpen={setIsSettingsModalOpen}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        isHighContrastMode={isHighContrastMode}
        toggleHighContrastMode={toggleHighContrastMode}
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      <div className="flex flex-1 overflow-hidden">
        {isControlPanelVisible && (
          <div
            className="flex-shrink-0 overflow-hidden relative"
            style={{ width: controlPanelWidth }}
          >
            <ControlPanel />
            <div
              id="control-panel-divider"
              role="separator"
              aria-valuenow={controlPanelWidth}
              aria-valuemin={100}
              aria-valuemax={window.innerWidth / 2}
              aria-controls="control-panel"
              tabIndex={0}
              onMouseDown={handleMouseDownControlPanel}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') {
                  setControlPanelWidth(Math.max(100, controlPanelWidth - 10));
                } else if (e.key === 'ArrowRight') {
                  setControlPanelWidth(Math.min(window.innerWidth / 2, controlPanelWidth + 10));
                }
              }}
              className="absolute top-0 right-0 w-2 h-full cursor-ew-resize bg-border hover:bg-primary transition-colors duration-200"
            />
          </div>
        )}

        {/* Conteneur principal pour la discussion et le canevas */}
        <main className="flex-1 flex overflow-hidden gap-6 p-6">
          
          {/* Section de la discussion (largeur dynamique) */}
          <div className={`flex flex-col h-full transition-all duration-500 ease-in-out flex-grow`}>
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {messages.map((msg: ChatMessage) => (
                  <Message key={msg.id} message={msg} />
                ))}
            </div>
            <div className="p-6 flex items-center">
                <UserInput />
            </div>
          </div>

          {/* Section du Canevas (apparaît et disparaît) */}
          {isCanvasVisible && (
            <div
              className="flex-shrink-0 h-full relative"
              style={{ width: canvasWidth }}
            >
              <AnimatePresence>
                <AgentOutputCanvas />
              </AnimatePresence>
              <div
                id="canvas-divider"
                role="separator"
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
    </div>
  );
}