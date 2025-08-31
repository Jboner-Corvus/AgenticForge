import React from 'react';
import type { UserMessage as UserMessageType } from '../types/chat';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';

export const UserMessage: React.FC<{ content: UserMessageType['content'] }> = ({
  content,
}) => (
  <motion.div
    className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-3 rounded-lg max-w-2xl border border-blue-500/20"
    initial={{ opacity: 0, x: 10, scale: 0.98 }}
    animate={{ opacity: 1, x: 0, scale: 1 }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
  >
    <div className="flex items-start gap-2">
      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center border border-blue-500/30">
        <User className="w-3 h-3 text-white" />
      </div>
      <div className="message-content text-sm leading-relaxed font-medium">
        {content}
      </div>
    </div>
  </motion.div>
);
