import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Lightbulb } from 'lucide-react';

interface ThoughtBubbleProps {
  content: string;
  timestamp?: string;
}

export const AgentThoughtBubble: React.FC<ThoughtBubbleProps> = ({ content, timestamp }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpansion = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <Card
      className="bg-muted/30 border-border text-muted-foreground my-2 animate-fade-in cursor-pointer hover:bg-muted/60"
      onClick={toggleExpansion}
    >
      <CardContent className="p-2 flex items-center space-x-2">
        <Lightbulb className="h-5 w-5 text-yellow-500" />
        <div className="flex-1">
          {isExpanded ? (
            <p className="text-sm">{content}</p>
          ) : (
            <p className="text-sm italic">The agent is thinking... (click to expand)</p>
          )}
          {timestamp && (
            <div className="text-xs text-muted-foreground mt-1">
              {timestamp}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};