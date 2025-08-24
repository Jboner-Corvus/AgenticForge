import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap } from 'lucide-react';

interface TypingIndicatorProps {
  variant?: 'classic' | 'pinned';
  message?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  variant = 'classic',
  message = "L'assistant réfléchit..."
}) => {
  const containerStyles = variant === 'pinned'
    ? 'bg-black/60 border border-cyan-500/30'
    : 'bg-background/95 border border-border';

  const accentColor = variant === 'pinned' ? 'text-cyan-400' : 'text-primary';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`${containerStyles} backdrop-blur-sm rounded-2xl p-4 mx-4 mb-4 shadow-lg`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar de l'assistant */}
        <div className={`p-2 rounded-full ${variant === 'pinned' ? 'bg-cyan-500/20' : 'bg-primary/20'}`}>
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className={`h-4 w-4 ${accentColor}`} />
          </motion.div>
        </div>

        {/* Message et animation de frappe */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">AgenticForge Assistant</span>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Zap className={`h-3 w-3 ${accentColor}`} />
            </motion.div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{message}</span>
            
            {/* Animation des points */}
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                  className={`w-1 h-1 rounded-full ${
                    variant === 'pinned' ? 'bg-cyan-400' : 'bg-primary'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};