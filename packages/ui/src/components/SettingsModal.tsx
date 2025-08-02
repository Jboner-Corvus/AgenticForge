import React, { useCallback, useState, useEffect } from 'react';

import { useLanguage } from '../lib/contexts/LanguageContext';
import { useStore } from '../lib/store';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
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
  const [llmProvider, setLlmProvider] = useState<string>('');
  const [llmModelName, setLlmModelName] = useState<string>('');
  const [llmApiKey, setLlmApiKey] = useState<string>('');

  const LLM_PROVIDERS = [
    { value: 'gemini', label: 'Gemini' },
    { value: 'openai', label: 'OpenAI' },
    { value: 'mistral', label: 'Mistral' },
    { value: 'huggingface', label: 'Hugging Face' },
    { value: 'grok', label: 'Grok' },
  ];

  const LLM_MODELS: { [key: string]: { value: string; label: string }[] } = {
    gemini: [
      { value: 'gemini-pro', label: 'Gemini Pro' },
      { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    ],
    openai: [
      { value: 'gpt-4o', label: 'GPT-4o' },
      { value: 'gpt-4o-mini', label: 'GPT-4o-mini' },
    ],
    mistral: [
      { value: 'mistral-small-latest', label: 'Mistral Small Latest' },
      { value: 'mistral-medium-latest', label: 'Mistral Medium Latest' },
      { value: 'mistral-large-latest', label: 'Mistral Large Latest' },
      { value: 'codestral-latest', label: 'Codestral Latest' },
      { value: 'magistral-medium-latest', label: 'Magistral Medium Latest' },
    ],
    huggingface: [
      { value: 'Qwen/Qwen2-7B-Instruct', label: 'Qwen2-7B-Instruct' },
      { value: 'mistralai/Mistral-7B-Instruct-v0.2', label: 'Mistral-7B-Instruct-v0.2' },
      { value: 'Kimi-K2', label: 'Kimi-K2' },
    ],
    grok: [
      { value: 'grok-3', label: 'Grok-3' },
      { value: 'grok-4', label: 'Grok-4' },
    ],
  };
  const { toast } = useToast();

  useEffect(() => {
    const storedLlmConfig = localStorage.getItem('llmConfig');
    if (storedLlmConfig) {
      const { provider, model, apiKey } = JSON.parse(storedLlmConfig);
      setLlmProvider(provider || '');
      setLlmModelName(model || '');
      setLlmApiKey(apiKey || '');
    }
  }, []);

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
            aria-label="Authentication Token Input"
            className="w-full bg-input border-border text-foreground placeholder-muted-foreground"
            id="authToken"
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

      <div className="flex flex-col space-y-4 mt-6">
        <h3 className="text-lg font-semibold">{translations.llmConfiguration}</h3>
        <div className="flex items-center space-x-2">
          <Label className="text-sm" htmlFor="llmProvider">{translations.llmProvider}</Label>
          <Select onValueChange={setLlmProvider} value={llmProvider}>
            <SelectTrigger className="w-full bg-input border-border text-foreground">
              <SelectValue placeholder={translations.selectLlmProvider} />
            </SelectTrigger>
            <SelectContent>
              {LLM_PROVIDERS.map((provider) => (
                <SelectItem key={provider.value} value={provider.value}>
                  {provider.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {llmProvider && LLM_MODELS[llmProvider] && (
          <div className="flex items-center space-x-2">
            <Label className="text-sm" htmlFor="llmModelName">{translations.llmModel}</Label>
            <Select onValueChange={setLlmModelName} value={llmModelName}>
              <SelectTrigger className="w-full bg-input border-border text-foreground">
                <SelectValue placeholder={translations.selectLlmModel} />
              </SelectTrigger>
              <SelectContent>
                {LLM_MODELS[llmProvider].map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))
              }</SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Label className="text-sm" htmlFor="llmApiKey">{translations.llmApiKey}</Label>
          <Input
            aria-label="LLM API Key Input"
            className="w-full bg-input border-border text-foreground placeholder-muted-foreground"
            id="llmApiKey"
            onChange={(e) => setLlmApiKey(e.target.value)}
            placeholder={translations.llmApiKeyPlaceholder}
            type="password"
            value={llmApiKey}
          />
        </div>

        <Button aria-label="Save LLM Settings" className="bg-primary hover:bg-accent text-primary-foreground" onClick={() => {
          localStorage.setItem('llmConfig', JSON.stringify({ provider: llmProvider, model: llmModelName, apiKey: llmApiKey }));
          toast({ description: translations.llmSettingsSaved, title: translations.llmSettingsSaved });
          onClose();
        }} type="button">{translations.saveLlmSettings}</Button>
      </div>
    </Modal>
  );
};
