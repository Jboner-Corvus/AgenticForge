
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tool } from '../lib/types';

interface ToolListDisplayProps {
  tools: Tool[];
  timestamp: string;
}

export const ToolListDisplay: React.FC<ToolListDisplayProps> = ({ tools, timestamp }) => {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Available Tools</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <Card key={tool.name}>
              <CardHeader>
                <CardTitle>{tool.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{tool.description}</p>
                {tool.parameters && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold">Parameters:</h4>
                    <pre className="text-xs bg-muted p-2 rounded-md mt-2">
                      {JSON.stringify(tool.parameters, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-xs text-muted-foreground mt-4">
          {timestamp}
        </div>
      </CardContent>
    </Card>
  );
};
