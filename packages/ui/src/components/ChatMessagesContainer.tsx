
import { Message } from './Message';
import { useStore } from '../lib/store';
import type { ChatMessage } from '../types/chat';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

export function ChatMessagesContainer() {
  const messages = useStore((state) => state.messages as ChatMessage[]);
  const debugLog = useStore((state) => state.debugLog);
  const containerRef = useRef<HTMLDivElement>(null);

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

      {debugLog.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-8 p-4 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-xl border border-red-300 dark:border-red-700 shadow-lg"
        >
          <h3 className="font-semibold mb-2 flex items-center">
            <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
            Error Log
          </h3>
          <ul className="list-disc list-inside space-y-1">
            {debugLog.map((log, index) => (
              <li key={index} className="text-sm py-1 px-2 bg-red-200/30 dark:bg-red-800/30 rounded-md">
                {log}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}
