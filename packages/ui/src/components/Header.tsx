// import { useLanguage } from '../lib/contexts/LanguageContext'; // Supprimé: never used
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

import { Logo } from './Logo';
import { ConnectionStatus } from './ConnectionStatus';

// import { Settings, PanelLeft, Sun, Moon, Bell, LayoutDashboard, BarChart, Key, MessageSquare, Bug, Square } from 'lucide-react'; // Supprimé: never used
import { PanelLeft, Sun, Moon, LayoutDashboard, BarChart, Key, MessageSquare, Bug, Crown, Rocket } from 'lucide-react';
import { useCanvasStore } from '../store/canvasStore';

interface HeaderProps {
  setIsControlPanelVisible: (visible: boolean) => void;
  // setIsSettingsModalOpen: (open: boolean) => void; // Supprimé
  isControlPanelVisible: boolean;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setCurrentPage: (page: 'chat' | 'leaderboard' | 'llm-api-keys' | 'oauth') => void;
  toggleDebugLogVisibility: () => void;
  isTodoListVisible: boolean;
  toggleTodoListVisibility: () => void;
}

export function Header({
  setIsControlPanelVisible,
  isControlPanelVisible,
  isDarkMode,
  toggleDarkMode,
  setCurrentPage,
  toggleDebugLogVisibility,
  isTodoListVisible,
  toggleTodoListVisibility,
}: HeaderProps) {
  const isCanvasVisible = useCanvasStore((state) => state.isCanvasVisible);
  const setIsCanvasVisible = useCanvasStore((state) => state.setIsCanvasVisible);

  const handleToggleCanvas = () => {
    setIsCanvasVisible(!isCanvasVisible);
  };

  // Configuration des boutons avec des styles améliorés
  const buttonConfig = [
    {
      icon: isTodoListVisible ? Crown : Rocket,
      onClick: toggleTodoListVisibility,
      label: isTodoListVisible ? "🏆 Masquer Mission Control" : "🚀 Activer Mission Control",
      ariaLabel: "Toggle Epic Todo List",
      active: isTodoListVisible,
      epic: true
    },
    {
      icon: isDarkMode ? Sun : Moon,
      onClick: toggleDarkMode,
      label: isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode",
      ariaLabel: isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode",
      active: false
    },
    {
      icon: LayoutDashboard,
      onClick: handleToggleCanvas,
      label: "Afficher/Masquer le Canevas",
      ariaLabel: "Toggle Canvas",
      active: isCanvasVisible
    },
    {
      icon: MessageSquare,
      onClick: () => setCurrentPage('chat'),
      label: "Chat",
      ariaLabel: "Chat",
      active: false
    },
    {
      icon: BarChart,
      onClick: () => setCurrentPage('leaderboard'),
      label: "Leaderboard",
      ariaLabel: "Leaderboard",
      active: false
    },
    {
      icon: Key,
      onClick: () => setCurrentPage('llm-api-keys'),
      label: "LLM API Keys",
      ariaLabel: "LLM API Keys",
      active: false
    },
    {
      icon: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      onClick: () => setCurrentPage('oauth'),
      label: "OAuth Management",
      ariaLabel: "OAuth Management",
      active: false
    },
    {
      icon: Bug,
      onClick: toggleDebugLogVisibility,
      label: "Debug Log",
      ariaLabel: "Debug Log",
      active: false
    }
  ];

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between p-4 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 shadow-2xl backdrop-blur-sm">
      <div className="flex items-center space-x-4">
        <Button
          aria-label="Toggle Control Panel"
          onClick={() => setIsControlPanelVisible(!isControlPanelVisible)}
          type="button"
          className="bg-gray-800/50 hover:bg-gray-700/50 text-gray-200 border border-gray-700 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
        >
          <PanelLeft className="h-5 w-5" />
        </Button>
        <Logo size="sm" showText={true} />
        <ConnectionStatus />
      </div>

      <div className="flex items-center space-x-1">
        <TooltipProvider delayDuration={0}>
          {buttonConfig.map((button, index) => {
            const Icon = button.icon;
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Button
                    aria-label={button.ariaLabel}
                    onClick={button.onClick}
                    type="button"
                    className={`
                      relative transition-all duration-300 hover:scale-110 
                      h-10 w-10 p-0 mx-1 rounded-xl
                      ${(button as { epic?: boolean }).epic ? 
                        (button.active ? 
                          'bg-gradient-to-r from-cyan-500 to-purple-600 text-white border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/25 animate-pulse' :
                          'bg-gradient-to-r from-gray-800 to-gray-700 text-cyan-400 border border-cyan-500/30 hover:from-cyan-500/20 hover:to-purple-600/20 hover:shadow-lg hover:shadow-cyan-500/20'
                        ) :
                        (button.active ? 
                          'bg-purple-900/50 border-purple-700/50 text-purple-300 shadow-lg' : 
                          'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 border border-gray-700'
                        )
                      }
                    `}
                  >
                    <Icon size={20} />
                    {button.active && (button as { epic?: boolean }).epic && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-gradient-to-r from-cyan-400 to-purple-500"></span>
                      </span>
                    )}
                    {button.active && !(button as { epic?: boolean }).epic && (
                      <span className="absolute top-0 right-0 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent 
                  className="bg-gray-800 text-gray-200 border border-gray-700 rounded-lg shadow-lg"
                  side="bottom"
                >
                  <p>{button.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
          
          </TooltipProvider>
      </div>
    </header>
  );
}