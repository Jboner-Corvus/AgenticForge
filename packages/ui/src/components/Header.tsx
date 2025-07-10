import { Settings, Menu } from 'lucide-react';
import React, { memo } from 'react';

import { useStore } from '../lib/store';
import { fr } from '../constants/fr';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tooltip } from './ui/tooltip';

interface HeaderProps {
  setIsControlPanelVisible: (visible: boolean) => void;
  setIsSettingsModalOpen: (open: boolean) => void;
  isControlPanelVisible: boolean;
}

export const Header: React.FC<HeaderProps> = memo(({
  setIsControlPanelVisible,
  setIsSettingsModalOpen,
  isControlPanelVisible,
}) => {
  const sessionStatus = useStore((state) => state.sessionStatus);
  const tokenStatus = useStore((state) => state.tokenStatus);

  return (
    <header className="flex items-center justify-between p-4 bg-card border-b border-border">
      <div className="flex items-center space-x-2">
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
        <div className="text-2xl">🐉</div>
        <h1 className="text-xl font-bold">Agentic Forge</h1>
      </div>

      <div className="flex items-center space-x-4">
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
        <Tooltip
          text={`Session: ${
            sessionStatus === 'valid' ? fr.sessionActive : fr.sessionError
          } | Token: ${tokenStatus ? fr.tokenValid : fr.tokenRequired}`}
        >
          <div className="flex items-center space-x-2">
            <Badge
              variant={sessionStatus === 'valid' ? 'default' : 'destructive'}
            >
              {sessionStatus === 'error'
                ? fr.sessionError
                : sessionStatus === 'valid'
                ? fr.sessionActive
                : fr.sessionUnknown}
            </Badge>
            <Badge variant={tokenStatus ? 'default' : 'destructive'}>
              {tokenStatus ? fr.tokenValid : fr.tokenRequired}
            </Badge>
          </div>
        </Tooltip>
      </div>
    </header>
  );
});
