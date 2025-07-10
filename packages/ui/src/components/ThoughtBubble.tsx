import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Lightbulb } from 'lucide-react';

interface ThoughtBubbleProps {
  content: string;
}

export const ThoughtBubble: React.FC<ThoughtBubbleProps> = ({ content }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpansion = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <Card
      className="bg-muted border-border text-muted-foreground my-2 animate-fade-in cursor-pointer hover:bg-accent"
      onClick={toggleExpansion}
    >
      <CardContent className="p-2 flex items-center space-x-2">
        <Lightbulb className="h-5 w-5 text-yellow-500" />
        {isExpanded ? (
          <p className="text-sm">{content}</p>
        ) : (
          <p className="text-sm italic">L'agent réfléchit... (cliquer pour voir)</p>
        )}
      </CardContent>
    </Card>
  );
};