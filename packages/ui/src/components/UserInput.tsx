import { useState } from 'react';
import { useIsProcessing } from '../store/hooks';
import { useAgentStream } from '../lib/hooks/useAgentStream';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Send } from 'lucide-react';
import { useLanguage } from '../lib/contexts/LanguageContext';
import { LoadingSpinner } from './LoadingSpinner';

export const UserInput = () => {
  const { translations } = useLanguage();
  const [inputValue, setInputValue] = useState('');
  const { startAgent } = useAgentStream();
  const isProcessing = useIsProcessing();

  const handleSendMessage = () => {
    if (inputValue.trim() && !isProcessing) {
      startAgent(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="flex items-center gap-4 w-full">
      <div className="relative flex-grow">
        <Textarea
          name="user-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={translations?.typeYourMessage || "Type your message..."}
          className="flex-1 resize-none min-h-[50px] rounded-full py-3 px-6 pr-16 shadow-sm border-border focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ease-in-out"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !isProcessing) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          disabled={false}
          style={{ borderRadius: '30px' }}
        />
        {isProcessing ? (
          <LoadingSpinner className="absolute right-5 top-1/2 -translate-y-1/2" />
        ) : (
          <Button 
            onClick={handleSendMessage} 
            size="icon" 
            disabled={false}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-primary hover:bg-primary/90 h-9 w-9"
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
};