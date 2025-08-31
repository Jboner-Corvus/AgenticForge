import React from 'react';
import type { ThoughtMessage } from '../types/chat';
import { EnhancedAgentThoughtBubble } from './EnhancedAgentThoughtBubble';
import { useThoughtHighlight } from '../lib/hooks/useThoughtHighlight';

interface ThoughtDisplayProps {
  thought: ThoughtMessage;
  timestamp?: string;
}

export const ThoughtDisplay: React.FC<ThoughtDisplayProps> = ({
  thought,
  timestamp,
}) => {
  const isImportant = useThoughtHighlight(thought.content);

  return (
    <EnhancedAgentThoughtBubble
      content={thought.content}
      timestamp={timestamp}
      isProminent={isImportant}
    />
  );
};
