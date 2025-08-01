import React from 'react';
import type { AgentResponseMessage as AgentMessageType } from '../types/chat';

export const AgentMessage: React.FC<{ content: AgentMessageType['content'] }> = ({ content }) => (
  <div className="flex justify-start">
    <div className="bg-gray-200 text-black p-3 rounded-lg max-w-md">
      {content}
    </div>
  </div>
);
