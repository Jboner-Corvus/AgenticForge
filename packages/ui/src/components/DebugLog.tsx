import React from 'react';
import { Button } from './ui/button';
import { X, AlertTriangle } from 'lucide-react';

interface DebugLogProps {
  logs: string[];
  onClose: () => void;
}

export const DebugLog: React.FC<DebugLogProps> = ({ logs, onClose }) => {
  // Function to determine if a log entry is an error
  const isErrorLog = (log: string) => {
    return log.includes('[ERROR]') || log.includes('Error:') || log.includes('error');
  };

  return (
    <div className="fixed bottom-0 right-0 w-full max-w-lg h-1/3 bg-background border-t border-l border-border shadow-lg z-50 flex flex-col">
      <div className="flex justify-between items-center p-2 border-b border-border bg-gray-50">
        <h3 className="font-semibold flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />
          Debug Log
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="overflow-y-auto flex-grow p-2 text-xs font-mono bg-gray-50">
        {logs.map((log, index) => (
          <div 
            key={index} 
            className={`py-1 px-2 rounded mb-1 ${
              isErrorLog(log) 
                ? 'bg-red-100 text-red-800 border border-red-200' 
                : 'bg-white border border-gray-200'
            }`}
          >
            {log}
          </div>
        ))}
      </div>
    </div>
  );
};
