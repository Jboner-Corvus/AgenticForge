import React from 'react';

import { Accordion } from './ui/accordion';
import { Card, CardContent } from './ui/card';

interface ToolCallCardProps {
  params: Record<string, unknown>;
  toolName: string;
}

export const ToolCallCard: React.FC<ToolCallCardProps> = ({ params, toolName }) => {
  return (
    <Accordion title={`🛠️ Tool used: ${toolName}`}>
      <Card className="bg-secondary border-border text-secondary-foreground my-2 animate-fade-in">
        <CardContent className="p-2">
          <pre className="text-sm bg-background p-2 rounded-md mt-1">
            {JSON.stringify(params, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </Accordion>
  );
};
