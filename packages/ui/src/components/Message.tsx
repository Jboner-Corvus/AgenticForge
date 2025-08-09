import React from 'react';
import { UserMessage } from './UserMessage';
import { AgentResponseBubble } from './AgentResponseBubble';
import { ToolMessage } from './ToolMessage';
import { AgentThoughtBubble } from './AgentThoughtBubble';
import { ErrorMessage } from './ErrorMessage';
import type { ChatMessage } from '../types/chat';

export const Message: React.FC<{ message: ChatMessage }> = ({ message }) => {
  switch (message.type) {
    case 'user':
      return <UserMessage content={(message as { content: string }).content} />;
    case 'agent_response':
      return <AgentResponseBubble content={(message as { content: string }).content} id={message.id} timestamp={new Date().toLocaleTimeString()} />;
    case 'tool_call':
      return <ToolMessage message={message} />;
    case 'tool_result':
      return <ToolMessage message={message} />;
    case 'agent_thought':
      return <AgentThoughtBubble content={(message as { content: string }).content} timestamp={new Date((message as { timestamp: number }).timestamp).toLocaleTimeString()} />;
    case 'error':
      return <ErrorMessage content={(message as { content: string }).content} />;
    case 'agent_canvas_output':
      // This message type is handled by the canvas itself, so we don't render it here.
      return null;
    default:
      // For unhandled message types, display a generic message for debugging
      console.warn(`Unhandled message type: ${(message as { type: string }).type}`, message);
      return <AgentResponseBubble content={`[${(message as { type: string }).type}] ${(message as { content?: string }).content || 'No content'}`} id={(message as { id: string }).id} timestamp={new Date().toLocaleTimeString()} />;
  }
};