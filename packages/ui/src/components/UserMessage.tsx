import React from 'react';
import type { UserMessage as UserMessageType } from '../types/chat';

export const UserMessage: React.FC<{ content: UserMessageType['content'] }> = ({ content }) => (
  <div className="flex justify-end animate-fade-in">
    <div className="bg-primary text-primary-foreground p-3 rounded-2xl max-w-md shadow-lg">
      {content}
    </div>
  </div>
);
