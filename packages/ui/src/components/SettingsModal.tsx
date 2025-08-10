import React, { useCallback, useState } from 'react';

import { useLanguage } from '../lib/contexts/LanguageContext';
import { useStore } from '../lib/store';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Modal } from './ui/modal';
import { LoadingSpinner } from './LoadingSpinner';
import { Switch } from './ui/switch';

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
  const isCanvasPinned = useStore((state) => state.isCanvasPinned);
  const setCanvasPinned = useStore((state) => state.setCanvasPinned);
  const canvasWidth = useStore((state) => state.canvasWidth);
  const setCanvasWidth = useStore((state) => state.setCanvasWidth);

  const [tokenInputValue, setTokenInputValue] = useState<string>('');
  const [tempCanvasWidth, setTempCanvasWidth] = useState<number>(canvasWidth);


  const handleSaveToken = useCallback(() => {
    const tokenValue = tokenInputValue.trim();
    setAuthToken(tokenValue);
    if (tokenValue) {
      addDebugLog(`[${new Date().toLocaleTimeString()}] ${translations.newTokenSaved}.`);
      fetchAndDisplayToolCount();
    } else {
      addDebugLog(`[${new Date().toLocaleTimeString()}] ${translations.tokenDeleted}.`);
      setToolCount(0);
    }
    setTokenStatus(!!tokenValue);
    onClose();
  }, [fetchAndDisplayToolCount, tokenInputValue, addDebugLog, setAuthToken, setToolCount, setTokenStatus, onClose, translations]);

  const handleSaveCanvasSettings = useCallback(() => {
    setCanvasWidth(tempCanvasWidth);
  }, [tempCanvasWidth, setCanvasWidth]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={translations.settings}>
      <div className="flex flex-col space-y-6">
        {/* Auth Token Section */}
        <div className="flex flex-col space-y-4">
          <h3 className="text-lg font-medium">Authentification</h3>
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

        {/* Canvas Settings Section */}
        <div className="flex flex-col space-y-4">
          <h3 className="text-lg font-medium">Paramètres du Canevas</h3>
          <div className="flex items-center justify-between">
            <Label className="text-sm" htmlFor="canvasPinned">
              Épingler le canevas par défaut
            </Label>
            <Switch
              id="canvasPinned"
              checked={isCanvasPinned}
              onCheckedChange={setCanvasPinned}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Label className="text-sm" htmlFor="canvasWidth">
              Largeur du canevas (px)
            </Label>
            <Input
              id="canvasWidth"
              type="number"
              min="300"
              max="1200"
              value={tempCanvasWidth}
              onChange={(e) => setTempCanvasWidth(Number(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">
              ({canvasWidth}px actuel)
            </span>
          </div>
          
          <Button 
            aria-label="Save Canvas Settings" 
            className="bg-primary hover:bg-accent text-primary-foreground" 
            onClick={handleSaveCanvasSettings} 
            type="button"
          >
            Enregistrer les paramètres du canevas
          </Button>
        </div>
      </div>
    </Modal>
  );
};