// packages/ui/src/App.tsx

import { useCallback, useEffect, useState } from 'react';
import { AppInitializer } from './components/AppInitializer';
import { AgentVisualizer } from './components/AgentVisualizer';
import { ControlPanel } from './components/ControlPanel';
import { Header } from './components/Header';
import { Skeleton } from './components/ui/skeleton';
import { Message } from './components/Message';
import { SettingsModal } from './components/SettingsModal';
import { useAgentStream } from './lib/hooks/useAgentStream';
import { useStore } from './lib/store';
import { Typography } from './components/Typography';
import { Toaster } from './components/ui/sonner';
import { ChatMessage } from './types/chat';

export default function App() {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isControlPanelVisible, setIsControlPanelVisible] = useState(true);

  const messages = useStore((state) => state.messages);
  const input = useStore((state) => state.messageInputValue);
  const setInput = useStore((state) => state.setMessageInputValue);
  const isProcessing = useStore((state) => state.isProcessing);

  const { startAgent } = useAgentStream();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prevMode: boolean) => !prevMode);
  }, []);

  const handleSendMessage = async () => {
    if (input.trim()) {
      await startAgent();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <AppInitializer />
      <Header
        isControlPanelVisible={isControlPanelVisible}
        setIsControlPanelVisible={setIsControlPanelVisible}
        setIsSettingsModalOpen={setIsSettingsModalOpen}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      <div className="flex flex-1 overflow-hidden">
        <div
          className={`transition-all duration-300 ease-in-out ${
            isControlPanelVisible ? 'w-1/4' : 'w-0'
          } overflow-hidden`}
        >
          <ControlPanel />
        </div>

        <div className="flex-1 flex flex-col">
          {isProcessing && (
          <div className="p-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          </div>
          )}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((msg: ChatMessage) => (
              <Message key={msg.id} message={msg} />
            ))}
          </div>
          <div className="p-6 border-t border-border flex items-center">
            <label htmlFor="chat-input" className="sr-only">Type your message</label>
            <input
              id="chat-input"
              name="chat-input"
              type="text"
              className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring dark:bg-card"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
            />
            <button
              className="ml-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
              onClick={handleSendMessage}
            >
              <Typography variant="p" className="font-semibold">Send</Typography>
            </button>
          </div>
        </div>
        <AgentVisualizer />
      </div>
      <Toaster />
    </div>
  );
}