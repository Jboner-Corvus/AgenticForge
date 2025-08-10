import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

interface ThoughtBubbleProps {
  content: string;
  timestamp?: string;
}

export const AgentThoughtBubble: React.FC<ThoughtBubbleProps> = ({ content, timestamp }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpansion = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
    >
      <Card
        className="bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 text-amber-800 animate-fade-in cursor-pointer hover:from-yellow-100 hover:to-amber-100 rounded-2xl shadow-md transition-all duration-300 overflow-hidden"
        onClick={toggleExpansion}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleExpansion();
          }
        }}
      >
        <CardContent className="p-4 flex items-start space-x-3">
          <div className="bg-yellow-100 rounded-full p-2 flex-shrink-0">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-sm ${isExpanded ? 'max-h-96 overflow-y-auto pr-2' : 'line-clamp-2'}`}>
              {isExpanded ? (
                <p className="whitespace-pre-wrap break-words">{content}</p>
              ) : (
                <p className="italic">The agent is thinking... (click to expand)</p>
              )}
            </div>
            {timestamp && (
              <div className="text-xs text-amber-600 mt-2 flex items-center">
                <span className="w-2 h-2 rounded-full bg-yellow-400 mr-2"></span>
                {timestamp}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};