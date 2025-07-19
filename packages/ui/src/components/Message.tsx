import React from 'react';
import { UserMessage } from './UserMessage';
import { AgentResponseBubble } from './AgentResponseBubble';
import { ToolMessage } from './ToolMessage';
import { AgentThoughtBubble } from './AgentThoughtBubble';
import { ErrorMessage } from './ErrorMessage';
import { ChatMessage } from '../types/chat';

export const Message: React.FC<{ message: ChatMessage }> = ({ message }) => {
  switch (message.type) {
    case 'user':
      return <UserMessage content={message.content} />;
    case 'agent_response':
      return <AgentResponseBubble content={message.content} id={message.id} timestamp={new Date().toLocaleTimeString()} />;
    case 'tool_call':
      return <ToolMessage message={message} />;
    case 'tool_result':
      return <ToolMessage message={message} />;
    case 'agent_thought':
      return <AgentThoughtBubble content={message.content} />;
    case 'error':
      return <ErrorMessage content={message.content} />;
    default:
      // Ensures that we handle all message types, or TypeScript will complain.
      
      return null;
  }
};
