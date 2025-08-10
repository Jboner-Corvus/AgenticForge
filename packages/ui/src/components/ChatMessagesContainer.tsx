
import { Message } from './Message';
import { useStore } from '../lib/store';
import type { ChatMessage } from '../types/chat';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Rocket, Key, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { useLanguage } from '../lib/contexts/LanguageContext';

export function ChatMessagesContainer() {
  const messages = useStore((state) => state.messages as ChatMessage[]);
  const debugLog = useStore((state) => state.debugLog);
  const containerRef = useRef<HTMLDivElement>(null);
  const { authToken, llmApiKeys, setCurrentPage } = useStore();
  const { translations } = useLanguage();

  const isConfigMissing = !authToken || llmApiKeys.length === 0;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, debugLog]);

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto space-y-4 p-4 bg-gradient-to-b from-background to-secondary/10"
    >
      <AnimatePresence>
        {isConfigMissing && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            layout
          >
            <Alert className="bg-blue-50 border-blue-400 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300">
              <Rocket className="h-4 w-4" />
              <AlertTitle>{translations.welcomeTitle}</AlertTitle>
              <AlertDescription>
                {translations.welcomeMessage}
                <div className="mt-4 flex gap-4">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage('oauth')} className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    {translations.setupAuthToken}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage('llm-api-keys')} className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    {translations.setupLLMKeys}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
        {messages.map((msg: ChatMessage) => (
          <motion.div
            key={msg.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            whileHover={{ y: -2 }}
          >
            <Message message={msg} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
