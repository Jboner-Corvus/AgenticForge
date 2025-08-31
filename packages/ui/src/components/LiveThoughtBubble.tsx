import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, Clipboard, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

interface LiveThoughtBubbleProps {
  content: string;
  timestamp?: string;
  isStreaming?: boolean;
  isLatest?: boolean;
}

export const LiveThoughtBubble: React.FC<LiveThoughtBubbleProps> = ({
  content,
  timestamp,
  isStreaming = false,
  isLatest = false,
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isTyping, setIsTyping] = useState(isStreaming);

  // Animation de frappe pour le streaming
  useEffect(() => {
    if (isStreaming && isLatest) {
      setIsTyping(true);
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex < content.length) {
          setDisplayedContent(content.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          setIsTyping(false);
          clearInterval(interval);
        }
      }, 30);

      return () => clearInterval(interval);
    } else {
      setDisplayedContent(content);
      setIsTyping(false);
    }
  }, [content, isStreaming, isLatest]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  return (
    <motion.div
      className={`bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-950/40 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 group relative overflow-hidden ${
        isLatest
          ? 'ring-2 ring-purple-400 dark:ring-purple-500 shadow-lg shadow-purple-500/30 dark:shadow-purple-500/20'
          : ''
      }`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      {/* Animated background elements */}
      <div className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-br from-purple-300 to-indigo-300 dark:from-purple-800/30 dark:to-indigo-800/30 rounded-full opacity-20 blur-xl"></div>
      <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-gradient-to-br from-indigo-300 to-purple-300 dark:from-indigo-800/30 dark:to-purple-800/30 rounded-full opacity-20 blur-xl"></div>

      {/* Particles effect for latest thought */}
      {isLatest && (
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-purple-400 dark:bg-purple-300 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      <div className="flex items-start gap-3 relative z-10">
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
          {isTyping ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : (
            <Brain className="w-4 h-4 text-white" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                {isTyping ? 'Réflexion en cours...' : 'Réflexion'}
              </span>
              {isLatest && (
                <Sparkles className="w-3 h-3 text-yellow-500 animate-pulse" />
              )}
              {isStreaming && (
                <div className="flex space-x-1">
                  <div
                    className="w-1 h-1 bg-purple-500 rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  ></div>
                  <div
                    className="w-1 h-1 bg-purple-500 rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  ></div>
                  <div
                    className="w-1 h-1 bg-purple-500 rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  ></div>
                </div>
              )}
            </div>

            <motion.div
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-md bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                onClick={handleCopy}
              >
                <Clipboard className="h-3 w-3" />
              </Button>
            </motion.div>
          </div>

          <div className="text-sm text-purple-900 dark:text-purple-100 leading-relaxed font-mono whitespace-pre-wrap">
            {displayedContent}
            {isTyping && (
              <motion.span
                className="inline-block w-2 h-4 bg-purple-500 ml-1"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            )}
          </div>

          {timestamp && (
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-2 font-medium flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${isTyping ? 'bg-purple-500 animate-pulse' : 'bg-purple-400'}`}
              ></div>
              {timestamp}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
