import { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { AppInitializer } from './components/AppInitializer';
import { ControlPanel } from './components/ControlPanel';
import { ChatWindow } from './components/ChatWindow';

import { useStore } from './lib/store';
import { LoadingSpinner } from './components/LoadingSpinner';

export default function App() {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isControlPanelVisible, setIsControlPanelVisible] = useState(true);
  
  
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

        <div className="flex-1">
          {isProcessing && <LoadingSpinner />}
          <ChatWindow />
        </div>
      </div>

      
    </div>
  );
}
