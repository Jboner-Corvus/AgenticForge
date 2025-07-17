import { Settings, PanelLeft, Sun, Moon, Bell, Maximize, Minimize } from 'lucide-react';
import React, { memo, useState, useCallback } from 'react';

import { fr } from '../constants/fr';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

import { Logo } from './Logo';

interface HeaderProps {
  setIsControlPanelVisible: (visible: boolean) => void;
  setIsSettingsModalOpen: (open: boolean) => void;
  isControlPanelVisible: boolean;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const HeaderComponent: React.FC<HeaderProps> = ({
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
    <header className="flex items-center justify-between p-4 bg-gradient-to-r from-background to-secondary/50 border-b border-border">
      <div className="flex items-center space-x-4">
        <Button
          aria-label="Toggle Control Panel"
          onClick={() => setIsControlPanelVisible(!isControlPanelVisible)}
          type="button"
          variant="ghost"
        >
          <PanelLeft />
        </Button>
        <Logo />
      </div>

      <div className="flex items-center space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                onClick={toggleDarkMode}
                type="button"
                variant="ghost"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="Toggle Fullscreen"
                onClick={handleFullscreenToggle}
                type="button"
                variant="ghost"
              >
                {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle Fullscreen</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="Notifications"
                onClick={() => {}}
                type="button"
                variant="ghost"
              >
                <Bell size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{fr.notifications}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="Settings"
                onClick={() => setIsSettingsModalOpen(true)}
                type="button"
                variant="ghost"
              >
                <Settings size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{fr.settings}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
};

export const Header = memo(HeaderComponent);
