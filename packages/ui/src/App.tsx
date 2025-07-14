import { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { AppInitializer } from './components/AppInitializer';
import { ControlPanel } from './components/ControlPanel';
import { Message } from './components/Message';
import { ChatMessage } from './types/chat'; // Import ChatMessage type

import { useStore } from './lib/store';
import { LoadingSpinner } from './components/LoadingSpinner';

export default function App() {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isControlPanelVisible, setIsControlPanelVisible] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]); // Use ChatMessage[] for messages
  const [input, setInput] = useState('');

  const isProcessing = useStore((state) => state.isProcessing);
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

  const handleSendMessage = () => {
    if (input.trim()) {
      setMessages((prevMessages) => [...prevMessages, { type: 'user', content: input }]);
      setInput('');
      setTimeout(() => {
        setMessages((prevMessages) => [
          ...prevMessages,
          { type: 'agent_response', content: `Echo: ${input}` },
        ]);
      }, 1000);
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
          {isProcessing && <LoadingSpinner />}
          <div className="flex-1 p-4 overflow-y-auto">
            {messages.map((msg, index) => (
              <Message key={index} message={msg} />
            ))}
          </div>
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center">
            <input
              type="text"
              className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
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
              className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={handleSendMessage}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
