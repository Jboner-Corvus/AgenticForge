import React from 'react';
import type { ErrorMessage as ErrorMessageType } from '../types/chat';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export const ErrorMessage: React.FC<{ content: ErrorMessageType['content'] }> = ({ content }) => (
  <motion.div 
    className="animate-fade-in" 
    role="alert"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="bg-destructive/15 p-4 rounded-xl shadow-lg border border-destructive/30 flex items-start">
      <AlertTriangle className="h-5 w-5 text-destructive mr-2 mt-0.5 flex-shrink-0" />
      <p className="text-sm text-destructive">{content}</p>
    </div>
  </motion.div>
);
