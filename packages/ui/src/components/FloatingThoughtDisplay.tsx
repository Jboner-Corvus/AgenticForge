import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { useSessionStore } from '../store/sessionStore';
import type { ThoughtMessage } from '../types/chat';
import { EnhancedAgentThoughtBubble } from './EnhancedAgentThoughtBubble';

export const FloatingThoughtDisplay: React.FC = () => {
  const messages = useSessionStore((state) => state.messages);
  const [currentThought, setCurrentThought] = useState<ThoughtMessage | null>(
    null,
  );
  const [isVisible, setIsVisible] = useState(false);

  // Get the most recent thought message
  useEffect(() => {
    const thoughtMessages = messages.filter(
      (msg): msg is ThoughtMessage => msg.type === 'agent_thought',
    );

    if (thoughtMessages.length > 0) {
      const latestThought = thoughtMessages[thoughtMessages.length - 1];
      setCurrentThought(latestThought);
      setIsVisible(true);

      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      setCurrentThought(null);
      setIsVisible(false);
    }
  }, [messages]);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!currentThought) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-4 right-4 z-50 max-w-md w-full"
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          <div className="relative">
            <div className="absolute -top-2 -left-2 w-full h-full bg-blue-500/20 rounded-xl blur-lg"></div>
            <div className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border border-blue-200 dark:border-blue-800 rounded-xl shadow-2xl shadow-blue-500/30 dark:shadow-blue-900/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Nouvelle Réflexion
                  </span>
                </div>
                <button
                  onClick={handleClose}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <EnhancedAgentThoughtBubble
                content={currentThought.content}
                isProminent={true}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};