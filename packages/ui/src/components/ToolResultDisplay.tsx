import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface ToolResultDisplayProps {
  result: Record<string, unknown>;
  toolName: string;
}

export const ToolResultDisplay: React.FC<ToolResultDisplayProps> = ({ toolName }) => {
  if (toolName === 'finish') {
    return null;
  }

  return (
    <Card className="bg-secondary border-border text-secondary-foreground my-2 animate-fade-in">
      <CardHeader className="flex flex-row items-center space-x-2 p-2">
        <span className="text-2xl">✅</span>
        <CardTitle className="text-base font-bold">Result from {toolName}</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <p className="text-sm">Tool executed successfully.</p>
      </CardContent>
    </Card>
  );
};
