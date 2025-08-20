import React from 'react';
import type { UserMessage as UserMessageType } from '../types/chat';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';

export const UserMessage: React.FC<{ content: UserMessageType['content'] }> = ({ content }) => (
  <div className="flex justify-end items-start gap-3 mb-6">
    <motion.div 
      className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 rounded-2xl max-w-2xl shadow-sm border border-blue-500/20"
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="message-content text-sm leading-relaxed font-medium">
        {content}
      </div>
    </motion.div>
    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center border-2 border-blue-500/30">
      <User className="w-4 h-4 text-white" />
    </div>
  </div>
);
