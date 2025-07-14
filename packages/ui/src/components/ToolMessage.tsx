import React from 'react';
import { ToolStartMessage, ToolResultMessage } from '../types/chat';

export const ToolMessage: React.FC<{ toolName: ToolStartMessage['data']['name'] | ToolResultMessage['toolName']; toolArgs?: ToolStartMessage['data']['args']; toolResult?: ToolResultMessage['result'] }> = ({ toolName, toolArgs, toolResult }) => (
  <div className="my-2">
    <details className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
      <summary className="cursor-pointer text-sm font-medium">
        Tool: {toolName}
      </summary>
      <div className="p-2">
        {toolArgs !== undefined && <pre className="text-xs bg-gray-200 dark:bg-gray-700 p-2 rounded">Args: {JSON.stringify(toolArgs, null, 2)}</pre>}
        {toolResult !== undefined && <pre className="text-xs bg-gray-200 dark:bg-gray-700 p-2 rounded">Result: {JSON.stringify(toolResult, null, 2)}</pre>}
      </div>
    </details>
  </div>
);
