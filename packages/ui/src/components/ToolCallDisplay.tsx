import React from 'react';

import { Accordion } from './ui/accordion';
import { Card, CardContent } from './ui/card';

interface ToolCallDisplayProps {
  params: Record<string, unknown>;
  toolName: string;
  timestamp: string;
}

export const ToolCallDisplay: React.FC<ToolCallDisplayProps> = ({ params, toolName, timestamp }) => {
  return (
    <Accordion title={`🛠️ Tool used: ${toolName}`}>
      <Card className="bg-secondary border-border text-secondary-foreground my-2 animate-fade-in">
        <CardContent className="p-2">
          <pre className="text-sm bg-background p-2 rounded-md mt-1">
            {JSON.stringify(params, null, 2)}
          </pre>
          <div className="text-xs text-muted-foreground mt-1">
            {timestamp}
          </div>
        </CardContent>
      </Card>
    </Accordion>
  );
};
