import { useStore } from '../lib/store';

// import { useLanguage } from '../lib/contexts/LanguageContext'; // Supprimé: never used
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

// import { Logo } from './Logo'; // Supprimé: never used
import { ConnectionStatus } from './ConnectionStatus';

// import { Settings, PanelLeft, Sun, Moon, Bell, LayoutDashboard, BarChart, Key, MessageSquare, Bug } from 'lucide-react'; // Supprimé: never used
import { PanelLeft, Sun, Moon, LayoutDashboard, BarChart, Key, MessageSquare, Bug } from 'lucide-react';

interface HeaderProps {
  setIsControlPanelVisible: (visible: boolean) => void;
  // setIsSettingsModalOpen: (open: boolean) => void; // Supprimé: never used
  isControlPanelVisible: boolean;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setCurrentPage: (page: 'chat' | 'leaderboard' | 'llm-api-keys' | 'oauth') => void;
  toggleDebugLogVisibility: () => void;
}

export function Header({
  setIsControlPanelVisible,
  // setIsSettingsModalOpen, // Supprimé
  isControlPanelVisible,
  isDarkMode,
  toggleDarkMode,
  setCurrentPage,
  toggleDebugLogVisibility,
}: HeaderProps) {
  // const { translations } = useLanguage(); // Supprimé: never used

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
        <ConnectionStatus />
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
                aria-label="OAuth Management"
                onClick={() => setCurrentPage('oauth')}
                type="button"
                variant="ghost"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>OAuth Management</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="Debug Log"
                onClick={toggleDebugLogVisibility}
                type="button"
                variant="ghost"
              >
                <Bug size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Debug Log</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
}