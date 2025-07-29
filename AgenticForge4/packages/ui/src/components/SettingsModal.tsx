import React, { useCallback, useState } from 'react';

import { fr } from '../constants/fr';
import { useStore } from '../lib/store';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Modal } from './ui/modal';
import { useToast } from '../lib/hooks/useToast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const setAuthToken = useStore((state) => state.setAuthToken);
  const fetchAndDisplayToolCount = useStore((state) => state.fetchAndDisplayToolCount);
  const addDebugLog = useStore((state) => state.addDebugLog);
  const setToolCount = useStore((state) => state.setToolCount);
  const setTokenStatus = useStore((state) => state.setTokenStatus);

  const [tokenInputValue, setTokenInputValue] = useState<string>('');
  const { toast } = useToast();

  const handleSaveToken = useCallback(() => {
    const tokenValue = tokenInputValue.trim();
    setAuthToken(tokenValue);
    if (tokenValue) {
      toast({ description: fr.tokenSaved, title: fr.tokenSaved });
      addDebugLog(`[${new Date().toLocaleTimeString()}] ${fr.newTokenSaved}.`);
      fetchAndDisplayToolCount();
    } else {
      toast({ description: fr.tokenRemoved, title: fr.tokenRemoved });
      addDebugLog(`[${new Date().toLocaleTimeString()}] ${fr.tokenDeleted}.`);
      setToolCount(0);
    }
    setTokenStatus(!!tokenValue);
    onClose();
  }, [fetchAndDisplayToolCount, tokenInputValue, addDebugLog, setAuthToken, setToolCount, setTokenStatus, toast, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={fr.settings}>
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-2">
          <Label className="text-sm" htmlFor="authToken">{fr.authToken}</Label>
          <Input
            aria-label="Authentication Token Input"
            className="w-full bg-input border-border text-foreground placeholder-muted-foreground"
            id="authToken"
            onChange={(e) => setTokenInputValue(e.target.value)}
            placeholder={fr.authTokenPlaceholder}
            type="password"
            value={tokenInputValue}
          />
        </div>
        <Button aria-label="Save Token" className="bg-primary hover:bg-accent text-primary-foreground" onClick={handleSaveToken} type="button">{fr.saveToken}</Button>
      </div>
    </Modal>
  );
};
