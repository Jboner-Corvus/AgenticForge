import React from 'react';
import { Brain, Clipboard } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';

interface ThoughtBubbleProps {
  content: string;
  timestamp?: string;
}

export const AgentThoughtBubble: React.FC<ThoughtBubbleProps> = ({ content, timestamp }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  return (
    <motion.div
      className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 group"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">
              Réflexion
            </span>
            <motion.div
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-md"
                onClick={handleCopy}
              >
                <Clipboard className="h-3 w-3" />
              </Button>
            </motion.div>
          </div>
          <div className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed font-mono whitespace-pre-wrap">
            {content}
          </div>
          {timestamp && (
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
              {timestamp}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};