import React from 'react';
import { UserMessage } from './UserMessage';
import { AgentResponseBubble } from './AgentResponseBubble';
import { ToolMessage } from './ToolMessage';
import { AgentThoughtBubble } from './AgentThoughtBubble';
import { ErrorMessage } from './ErrorMessage';
import type { ChatMessage } from '../types/chat';

// Composant wrapper pour styliser les messages dans le flux linéaire
const StyledMessageWrapper: React.FC<{
  children: React.ReactNode;
  type: string;
}> = ({ children, type }) => {
  // Définir des styles cohérents pour chaque type de message
  const getWrapperStyles = () => {
    switch (type) {
      case 'user':
        return 'border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-900/10';
      case 'agent_thought':
        return 'border-l-4 border-purple-500 bg-purple-50/50 dark:bg-purple-900/10';
      case 'tool_call':
        return 'border-l-4 border-orange-500 bg-orange-50/50 dark:bg-orange-900/10';
      case 'tool_result':
        return 'border-l-4 border-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10';
      case 'agent_response':
        return 'border-l-4 border-green-500 bg-green-50/50 dark:bg-green-900/10';
      case 'error':
        return 'border-l-4 border-red-500 bg-red-50/50 dark:bg-red-900/10';
      default:
        return 'border-l-4 border-gray-500 bg-gray-50/50 dark:bg-gray-900/10';
    }
  };

  return (
    <div className={`${getWrapperStyles()} pl-4 py-2 rounded-r-lg`}>
      {children}
    </div>
  );
};

// Composant pour gérer l'affichage intelligent des messages avec détection de doublons
export const Message: React.FC<{ message: ChatMessage }> = ({ message }) => {
  switch (message.type) {
    case 'user':
      return (
        <StyledMessageWrapper type={message.type}>
          <UserMessage content={(message as { content: string }).content} />
        </StyledMessageWrapper>
      );
    case 'agent_response':
      return (
        <StyledMessageWrapper type={message.type}>
          <AgentResponseBubble
            content={(message as { content: string }).content}
            id={message.id}
            timestamp={new Date().toLocaleTimeString()}
          />
        </StyledMessageWrapper>
      );
    case 'tool_call':
      return (
        <StyledMessageWrapper type={message.type}>
          <ToolMessage message={message} />
        </StyledMessageWrapper>
      );
    case 'tool_result':
      return (
        <StyledMessageWrapper type={message.type}>
          <ToolMessage message={message} />
        </StyledMessageWrapper>
      );
    case 'agent_thought':
      return (
        <StyledMessageWrapper type={message.type}>
          <AgentThoughtBubble
            content={(message as { content: string }).content}
            timestamp={new Date(
              (message as { timestamp: number }).timestamp,
            ).toLocaleTimeString()}
          />
        </StyledMessageWrapper>
      );
    case 'error':
      return (
        <StyledMessageWrapper type={message.type}>
          <ErrorMessage content={(message as { content: string }).content} />
        </StyledMessageWrapper>
      );
    case 'agent_canvas_output':
      // This message type is handled by the canvas itself, so we don't render it here.
      return null;
    default:
      // For unhandled message types, display a generic message for debugging
      console.warn(
        `Unhandled message type: ${(message as { type: string }).type}`,
        message,
      );
      return (
        <StyledMessageWrapper type={message.type}>
          <AgentResponseBubble
            content={`[${(message as { type: string }).type}] ${(message as { content?: string }).content || 'No content'}`}
            id={(message as { id: string }).id}
            timestamp={new Date().toLocaleTimeString()}
          />
        </StyledMessageWrapper>
      );
  }
};
