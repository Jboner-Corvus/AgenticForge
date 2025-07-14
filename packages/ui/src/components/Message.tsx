import React from 'react';
import { UserMessage } from './UserMessage';
import { AgentMessage } from './AgentMessage';
import { ToolMessage } from './ToolMessage';
import { ThoughtMessage } from './ThoughtMessage';
import { ErrorMessage } from './ErrorMessage';
import { ChatMessage } from '../types/chat';

export const Message: React.FC<{ message: ChatMessage }> = ({ message }) => {
  switch (message.type) {
    case 'user':
      return <UserMessage content={message.content} />;
    case 'agent_response':
      return <AgentMessage content={message.content} />;
    case 'tool.start':
      return <ToolMessage toolName={message.data.name} toolArgs={message.data.args} />;
    case 'tool_result':
      return <ToolMessage toolName={message.toolName} toolResult={message.result} />;
    case 'agent_thought':
      return <ThoughtMessage content={message.content} />;
    case 'error':
        return <ErrorMessage content={message.content} />;
    default:
      return null;
  }
};
