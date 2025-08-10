
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
            <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 text-blue-900 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-600 dark:text-blue-200 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <Rocket className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-lg font-semibold">{translations.welcomeTitle}</AlertTitle>
              </div>
              <AlertDescription className="space-y-4">
                <p className="text-sm">{translations.welcomeMessage}</p>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage('oauth')} 
                    className="flex items-center gap-2 bg-white/80 hover:bg-white dark:bg-blue-900/40 dark:hover:bg-blue-900/60 border-blue-200 hover:border-blue-300 dark:border-blue-700 transition-all duration-200"
                  >
                    <Key className="h-4 w-4" />
                    <span className="font-medium">{translations.setupAuthToken}</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage('llm-api-keys')} 
                    className="flex items-center gap-2 bg-white/80 hover:bg-white dark:bg-indigo-900/40 dark:hover:bg-indigo-900/60 border-indigo-200 hover:border-indigo-300 dark:border-indigo-700 transition-all duration-200"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="font-medium">{translations.setupLLMKeys}</span>
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
