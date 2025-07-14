import { Settings, Menu, Sun, Moon, Bell, Maximize, Minimize } from 'lucide-react';
import React, { memo, useState, useCallback } from 'react';

import { fr } from '../constants/fr';
import { Button } from './ui/button';
import { Tooltip } from './ui/tooltip';

import { Logo } from './Logo';

interface HeaderProps {
  setIsControlPanelVisible: (visible: boolean) => void;
  setIsSettingsModalOpen: (open: boolean) => void;
  isControlPanelVisible: boolean;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = memo(({
  setIsControlPanelVisible,
  setIsSettingsModalOpen,
  isControlPanelVisible,
  isDarkMode,
  toggleDarkMode,
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const handleFullscreenToggle = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  }, []);

  return (
    <header className="flex items-center justify-between p-4 bg-card border-b border-border">
      <div className="flex items-center space-x-4">
        <div className="md:hidden">
          <Button
            aria-label="Toggle Control Panel"
            onClick={() => setIsControlPanelVisible(!isControlPanelVisible)}
            type="button"
            variant="ghost"
          >
            <Menu />
          </Button>
        </div>
        <Logo />
      </div>

      <div className="flex items-center space-x-4">
        <Tooltip text={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
          <Button
            aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            onClick={toggleDarkMode}
            type="button"
            variant="ghost"
          >
            {isDarkMode ? <Sun /> : <Moon />}
          </Button>
        </Tooltip>
        <Tooltip text="Toggle Fullscreen">
          <Button
            aria-label="Toggle Fullscreen"
            onClick={handleFullscreenToggle}
            type="button"
            variant="ghost"
          >
            {isFullScreen ? <Minimize /> : <Maximize />}
          </Button>
        </Tooltip>
        <Tooltip text={fr.settings}>
          <Button
            aria-label="Settings"
            onClick={() => setIsSettingsModalOpen(true)}
            type="button"
            variant="ghost"
          >
            <Settings />
          </Button>
        </Tooltip>
        {/* Placeholder for notifications */}
        <Button variant="ghost" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
});
