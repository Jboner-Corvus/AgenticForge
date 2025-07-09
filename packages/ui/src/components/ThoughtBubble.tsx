import React from 'react';

import { Card, CardContent } from './ui/card';

interface ThoughtBubbleProps {
  content: string;
}

export const ThoughtBubble: React.FC<ThoughtBubbleProps> = ({ content }) => {
  return (
    <Card className="bg-secondary border-border text-secondary-foreground my-2 animate-fade-in">
      <CardContent className="p-2 flex items-center space-x-2">
        <span className="text-2xl">🧠</span>
        <p>{content}</p>
      </CardContent>
    </Card>
  );
};
