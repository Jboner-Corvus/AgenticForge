import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Paperclip, Send } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../lib/store';

export const UserInput = () => {
  const [inputValue, setInputValue] = useState('');
  const startAgent = useStore((state) => state.startAgent);
  const setMessageInputValue = useStore((state) => state.setMessageInputValue);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      setMessageInputValue(inputValue);
      startAgent();
      setInputValue('');
    }
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <Button variant="ghost" size="icon">
        <Paperclip className="h-5 w-5" />
      </Button>
      <Textarea
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 resize-none min-h-[60px] rounded-full py-3 px-6 shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ease-in-out"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
          }
        }}
        style={{ borderRadius: '30px' }}
      />
      <Button onClick={handleSendMessage} size="icon">
        <Send className="h-5 w-5" />
      </Button>
    </div>
  );
};