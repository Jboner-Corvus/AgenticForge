import React from 'react';
import type { AgentResponseMessage as AgentMessageType } from '../types/chat';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export const AgentMessage: React.FC<{ content: AgentMessageType['content'] }> = ({ content }) => (
  <div className="flex justify-start items-end space-x-2">
    <Avatar className="h-8 w-8">
      <AvatarImage src="/logo.svg" alt="Agent Avatar" />
      <AvatarFallback>A</AvatarFallback>
    </Avatar>
    <div className="bg-muted text-foreground p-3 rounded-xl max-w-md break-words shadow-md">
      {content}
    </div>
  </div>
);
