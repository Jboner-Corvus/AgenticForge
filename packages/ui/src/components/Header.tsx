
import { useStore } from '../lib/store';

import { useLanguage } from '../lib/contexts/LanguageContext';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

import { Logo } from './Logo';

import { Settings, PanelLeft, Sun, Moon, Bell, LayoutDashboard, BarChart, Key, MessageSquare } from 'lucide-react';

interface HeaderProps {
  setIsControlPanelVisible: (visible: boolean) => void;
  setIsSettingsModalOpen: (open: boolean) => void;
  isControlPanelVisible: boolean;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isHighContrastMode: boolean;
  toggleHighContrastMode: () => void;
  setCurrentPage: (page: 'chat' | 'leaderboard' | 'llm-api-keys') => void;
}

export function Header({
  setIsControlPanelVisible,
  setIsSettingsModalOpen,
  isControlPanelVisible,
  isDarkMode,
  toggleDarkMode,
  isHighContrastMode,
  toggleHighContrastMode,
  setCurrentPage,
}: HeaderProps) {
  const { translations } = useLanguage();

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
                aria-label={isHighContrastMode ? "Disable High Contrast" : "Enable High Contrast"}
                onClick={toggleHighContrastMode}
                type="button"
                variant="ghost"
              >
                <span className="sr-only">{isHighContrastMode ? "Disable High Contrast" : "Enable High Contrast"}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a9 9 0 0 0-9 9 9 9 0 0 0 9 9 9 9 0 0 0 9-9 9 9 0 0 0-9-9z" />
                  <path d="M12 8v8" />
                  <path d="M8 12h8" />
                </svg>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isHighContrastMode ? "Disable High Contrast" : "Enable High Contrast"}</p>
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
                aria-label="Chat"
                onClick={() => setCurrentPage('chat')}
                type="button"
                variant="ghost"
              >
                <MessageSquare size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Chat</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="Leaderboard"
                onClick={() => setCurrentPage('leaderboard')}
                type="button"
                variant="ghost"
              >
                <BarChart size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Leaderboard</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="LLM API Keys"
                onClick={() => setCurrentPage('llm-api-keys')}
                type="button"
                variant="ghost"
              >
                <Key size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>LLM API Keys</p>
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
              <p>{translations.notifications}</p>
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
              <p>{translations.settings}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
};
