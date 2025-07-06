import React from 'react';

interface ToolCallCardProps {
  toolName: string;
  params: any;
}

export const ToolCallCard: React.FC<ToolCallCardProps> = ({ toolName, params }) => {
  return (
    <div className="flex items-start space-x-2 p-2 my-2 bg-blue-900/50 rounded-lg">
      <span className="text-2xl">🛠️</span>
      <div>
        <p className="font-bold text-blue-300">{toolName}</p>
        <pre className="text-sm text-gray-300 bg-gray-900 p-2 rounded-md mt-1">
          {JSON.stringify(params, null, 2)}
        </pre>
      </div>
    </div>
  );
};