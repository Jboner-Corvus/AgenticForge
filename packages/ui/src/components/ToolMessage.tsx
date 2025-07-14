import React from 'react';
import { ToolCallMessage, ToolResultMessage } from '../types/chat';

// This component can display either a tool call or a tool result
type ToolMessageProps =
  | { message: ToolCallMessage }
  | { message: ToolResultMessage };

export const ToolMessage: React.FC<ToolMessageProps> = ({ message }) => {
  const isToolCall = message.type === 'tool_call';
  const toolName = message.toolName;
  const details = isToolCall ? message.params : message.result;
  const title = isToolCall ? 'Tool Call' : 'Tool Result';
  const detailLabel = isToolCall ? 'Params' : 'Result';

  return (
    <div className="my-2">
      <details className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
        <summary className="cursor-pointer text-sm font-medium">
          {title}: {toolName}
        </summary>
        <div className="p-2">
          <pre className="text-xs bg-gray-200 dark:bg-gray-700 p-2 rounded">
            {detailLabel}: {JSON.stringify(details, null, 2)}
          </pre>
        </div>
      </details>
    </div>
  );
};
