import { useState } from 'react';
import { useStore, AppState } from '../lib/store';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Paperclip, Send } from 'lucide-react';
import { useLanguage } from '../lib/contexts/LanguageContext';

export const UserInput = () => {
  const { translations } = useLanguage();
  const [inputValue, setInputValue] = useState('');
  const startAgent = useStore((state: AppState) => state.startAgent);
  const setMessageInputValue = useStore((state: AppState) => state.setMessageInputValue);
  const isProcessing = useStore((state: AppState) => state.isProcessing);

  const handleSendMessage = () => {
    if (inputValue.trim() && !isProcessing) {
      setMessageInputValue(inputValue);
      startAgent();
      setInputValue('');
    }
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <Button variant="ghost" size="icon" disabled={isProcessing}>
        <Paperclip className="h-5 w-5" />
      </Button>
      <Textarea
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={translations.typeYourMessage}
        className="flex-1 resize-none min-h-[60px] rounded-full py-3 px-6 shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ease-in-out"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !isProcessing) {
            e.preventDefault();
            handleSendMessage();
          }
        }}
        disabled={isProcessing}
        style={{ borderRadius: '30px' }}
      />
      <Button onClick={handleSendMessage} size="icon" disabled={isProcessing || !inputValue.trim()}>
        <Send className="h-5 w-5" />
      </Button>
    </div>
  );
};