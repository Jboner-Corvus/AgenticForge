import { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { AppInitializer } from './components/AppInitializer';
import { ControlPanel } from './components/ControlPanel';
import { ChatWindow } from './components/ChatWindow';
import { DebugPanel } from './components/DebugPanel';

export default function App() {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isControlPanelVisible, setIsControlPanelVisible] = useState(true);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [debugPanelVisible, setDebugPanelVisible] = useState(false);

  const clearDebugLog = useCallback(() => {
    setDebugLog([]);
  }, []);

  const toggleDebugPanel = useCallback(() => {
    setDebugPanelVisible((prev) => !prev);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <AppInitializer />
      <Header
        isControlPanelVisible={isControlPanelVisible}
        setIsControlPanelVisible={setIsControlPanelVisible}
        setIsSettingsModalOpen={setIsSettingsModalOpen}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      <div className="flex flex-1 overflow-hidden">
        <div
          className={`${
            isControlPanelVisible
              ? 'animate-slide-in-from-left'
              : 'animate-slide-out-to-left'
          } md:block`}
        >
          <ControlPanel />
        </div>

        <ChatWindow />
      </div>

      <DebugPanel
        clearDebugLog={clearDebugLog}
        debugLog={debugLog}
        debugPanelVisible={debugPanelVisible}
        toggleDebugPanel={toggleDebugPanel}
      />
    </div>
  );
}
