import React from 'react';
import type { UserMessage as UserMessageType } from '../types/chat';
import { motion } from 'framer-motion';

export const UserMessage: React.FC<{ content: UserMessageType['content'] }> = ({ content }) => (
  <div className="flex justify-end">
    <motion.div 
      className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-2xl max-w-md shadow-lg"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="message-content">{content}</div>
    </motion.div>
  </div>
);
