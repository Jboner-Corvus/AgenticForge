import React from 'react';
import { UserMessage as UserMessageType } from '../types/chat';

export const UserMessage: React.FC<{ content: UserMessageType['content'] }> = ({ content }) => (
  <div className="flex justify-end">
    <div className="bg-blue-500 text-white p-3 rounded-lg max-w-md">
      {content}
    </div>
  </div>
);
