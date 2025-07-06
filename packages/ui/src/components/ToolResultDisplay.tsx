import React from 'react';

interface ToolResultDisplayProps {
  toolName: string;
  result: any;
}

export const ToolResultDisplay: React.FC<ToolResultDisplayProps> = ({ toolName, result }) => {
  return (
    <div className="flex items-start space-x-2 p-2 my-2 bg-green-900/50 rounded-lg">
      <span className="text-2xl">✅</span>
      <div>
        <p className="font-bold text-green-300">Result from {toolName}</p>
        <pre className="text-sm text-gray-300 bg-gray-900 p-2 rounded-md mt-1">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
};