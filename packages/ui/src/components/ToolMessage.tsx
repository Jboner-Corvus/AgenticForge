import React from 'react';
import type { ToolCallMessage, ToolResultMessage } from '../types/chat';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Code } from 'lucide-react';

// This component can display either a tool call or a tool result
type ToolMessageProps =
  | { message: ToolCallMessage }
  | { message: ToolResultMessage };

export const ToolMessage: React.FC<ToolMessageProps> = ({ message }) => {
  const isToolCall = message.type === 'tool_call';
  const toolName = message.toolName;
  const details = isToolCall ? message.params : message.result;
  const title = isToolCall ? 'Tool Call' : 'Tool Result';
  const detailLabel = isToolCall ? 'Parameters' : 'Result';

  return (
    <div className="my-4 animate-fade-in">
      <Card className="bg-muted/50 border-border rounded-xl shadow-sm">
        <CardHeader className="p-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <Code className="h-4 w-4 mr-2" />
            {title}: {toolName}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="text-xs text-muted-foreground mb-2">{detailLabel}:</div>
          <pre className="text-xs bg-background p-2 rounded-md overflow-x-auto">
            {JSON.stringify(details, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};
