import React, { useState } from 'react';
import {
  Brain,
  Clipboard,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';

interface EnhancedThoughtBubbleProps {
  content: string;
  timestamp?: string;
  isProminent?: boolean;
}

export const EnhancedAgentThoughtBubble: React.FC<
  EnhancedThoughtBubbleProps
> = ({ content, timestamp, isProminent = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);

  // Tronquer le contenu si trop long
  const isLongContent = content.length > 300;
  const displayContent = showFullContent
    ? content
    : isExpanded
      ? content
      : content.substring(0, 300) + (content.length > 300 ? '...' : '');

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  // Special styling for prominent thoughts
  const prominentClasses = isProminent
    ? 'ring-2 ring-blue-400 dark:ring-blue-500 shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20'
    : '';

  return (
    <motion.div
      className={`bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 group relative overflow-hidden ${prominentClasses}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
    >
      {/* Animated background elements */}
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-200 dark:bg-blue-900/30 rounded-full opacity-20 blur-xl"></div>
      <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-blue-300 dark:bg-blue-800/30 rounded-full opacity-20 blur-xl"></div>

      <div className="flex items-start gap-3 relative z-10">
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                Réflexion
              </span>
              {isProminent && (
                <Sparkles className="w-3 h-3 text-yellow-500 animate-pulse" />
              )}
            </div>
            <div className="flex items-center gap-1">
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

              {isLongContent && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-md bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                  onClick={() => setShowFullContent(!showFullContent)}
                >
                  {showFullContent ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
          </div>
          <div className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed font-mono whitespace-pre-wrap">
            {displayContent}
            {!showFullContent && isLongContent && !isExpanded && (
              <Button
                variant="link"
                className="p-0 h-auto text-blue-600 dark:text-blue-400"
                onClick={() => setIsExpanded(true)}
              >
                Voir plus
              </Button>
            )}
            {showFullContent && isLongContent && (
              <Button
                variant="link"
                className="p-0 h-auto text-blue-600 dark:text-blue-400"
                onClick={() => setShowFullContent(false)}
              >
                Voir moins
              </Button>
            )}
          </div>
          {timestamp && (
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              {timestamp}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
