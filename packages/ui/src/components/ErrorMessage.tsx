import React from 'react';
import type { ErrorMessage as ErrorMessageType } from '../types/chat';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export const ErrorMessage: React.FC<{
  content: ErrorMessageType['content'];
}> = ({ content }) => (
  <motion.div
    className="animate-fade-in"
    role="alert"
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2 }}
  >
    <div className="bg-destructive/15 p-3 rounded-lg border border-destructive/30 flex items-start">
      <AlertTriangle className="h-4 w-4 text-destructive mr-2 mt-0.5 flex-shrink-0" />
      <p className="text-sm text-destructive">{content}</p>
    </div>
  </motion.div>
);
