
import React, { memo, useState, useCallback } from 'react';
import { useStore } from '../lib/store';

import { fr } from '../constants/fr';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

import { Logo } from './Logo';

import { Settings, PanelLeft, Sun, Moon, Bell, Maximize, Minimize, LayoutDashboard, Contrast } from 'lucide-react';
interface HeaderProps {
  setIsControlPanelVisible: (visible: boolean) => void;
  setIsSettingsModalOpen: (open: boolean) => void;
  isControlPanelVisible: boolean;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isHighContrastMode: boolean;
  toggleHighContrastMode: () => void;
}

const HeaderComponent: React.FC<HeaderProps> = ({
  setIsControlPanelVisible,
  setIsSettingsModalOpen,
  isControlPanelVisible,
  isDarkMode,
  toggleDarkMode,
  toggleHighContrastMode,
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
    <header className="sticky top-0 z-50 flex items-center justify-between p-4 bg-gradient-to-r from-background to-secondary/50 border-b border-border shadow-md">
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
                aria-label="Toggle Canvas"
                onClick={() => useStore.getState().setIsCanvasVisible(!useStore.getState().isCanvasVisible)}
                type="button"
                variant="ghost"
              >
                <LayoutDashboard size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Afficher/Masquer le Canevas</p>
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
                aria-label="Toggle High Contrast Mode"
                onClick={toggleHighContrastMode}
                type="button"
                variant="ghost"
              >
                <Contrast size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle High Contrast Mode</p>
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
