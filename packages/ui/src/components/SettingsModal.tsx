import React, { useCallback, useState } from 'react';

import { useLanguage } from '../lib/contexts/LanguageContext';
import { useStore } from '../lib/store';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Modal } from './ui/modal';
import { useToast } from '../lib/hooks/useToast';
import { LoadingSpinner } from './LoadingSpinner';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { translations } = useLanguage();
  const setAuthToken = useStore((state) => state.setAuthToken);
  const fetchAndDisplayToolCount = useStore((state) => state.fetchAndDisplayToolCount);
  const addDebugLog = useStore((state) => state.addDebugLog);
  const setToolCount = useStore((state) => state.setToolCount);
  const setTokenStatus = useStore((state) => state.setTokenStatus);
  const isLoadingTools = useStore((state) => state.isLoadingTools);

  const [tokenInputValue, setTokenInputValue] = useState<string>('');

  const { toast } = useToast();

  const handleSaveToken = useCallback(() => {
    const tokenValue = tokenInputValue.trim();
    setAuthToken(tokenValue);
    if (tokenValue) {
      toast({ description: translations.tokenSaved, title: translations.tokenSaved });
      addDebugLog(`[${new Date().toLocaleTimeString()}] ${translations.newTokenSaved}.`);
      fetchAndDisplayToolCount();
    } else {
      toast({ description: translations.tokenRemoved, title: translations.tokenRemoved });
      addDebugLog(`[${new Date().toLocaleTimeString()}] ${translations.tokenDeleted}.`);
      setToolCount(0);
    }
    setTokenStatus(!!tokenValue);
    onClose();
  }, [fetchAndDisplayToolCount, tokenInputValue, addDebugLog, setAuthToken, setToolCount, setTokenStatus, toast, onClose, translations]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={translations.settings}>
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-2">
          <Label className="text-sm" htmlFor="authToken">{translations.authToken}</Label>
          <Input
            autoComplete="off"
            className="w-full bg-input border-border text-foreground placeholder-muted-foreground"
            id="authToken"
            name="authToken"
            onChange={(e) => setTokenInputValue(e.target.value)}
            placeholder={translations.authTokenPlaceholder}
            type="password"
            value={tokenInputValue}
          />
        </div>
        <Button aria-label="Save Token" className="bg-primary hover:bg-accent text-primary-foreground" onClick={handleSaveToken} type="button" disabled={isLoadingTools}>
          {isLoadingTools ? <LoadingSpinner className="mr-2" /> : null}
          {translations.saveToken}
        </Button>
      </div>
    </Modal>
  );
};