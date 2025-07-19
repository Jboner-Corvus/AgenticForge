import React from 'react';
import { UserMessage as UserMessageType } from '../types/chat';

export const UserMessage: React.FC<{ content: UserMessageType['content'] }> = ({ content }) => (
  <div className="flex justify-end animate-fade-in">
    <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-md shadow-md">
      {content}
    </div>
  </div>
);
