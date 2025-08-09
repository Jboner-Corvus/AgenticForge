import React from 'react';
import { Button } from './ui/button';
import { X, AlertTriangle } from 'lucide-react';

interface DebugLogProps {
  logs: string[];
  onClose: () => void;
}

export const DebugLog: React.FC<DebugLogProps> = ({ logs, onClose }) => {
  // Function to determine log type and styling
  const getLogStyle = (log: string) => {
    if (log.includes('🚨') || log.includes('[ERROR]') || log.includes('ERREUR CRITIQUE')) {
      return 'bg-red-100 text-red-900 border border-red-300 font-bold';
    }
    if (log.includes('⚠️') || log.includes('[WARNING]') || log.includes('[WARN]')) {
      return 'bg-yellow-100 text-yellow-900 border border-yellow-300';
    }
    if (log.includes('✅') || log.includes('[SUCCESS]') || log.includes('🎉')) {
      return 'bg-green-100 text-green-900 border border-green-300';
    }
    if (log.includes('🚀') || log.includes('📨') || log.includes('🤖') || log.includes('RÉPONSE AGENT')) {
      return 'bg-blue-100 text-blue-900 border border-blue-300 font-semibold';
    }
    if (log.includes('🔄') || log.includes('[INFO]')) {
      return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
    return 'bg-white text-gray-700 border border-gray-200';
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
      <div className="overflow-y-auto flex-grow p-2 text-xs font-mono bg-gray-50 space-y-1">
        {logs.length === 0 ? (
          <div className="text-gray-500 italic text-center py-4">
            Aucun log pour le moment...
          </div>
        ) : (
          logs.map((log, index) => (
            <div 
              key={index} 
              className={`py-2 px-3 rounded-md ${getLogStyle(log)} transition-colors duration-200`}
            >
              <div className="flex items-start gap-2">
                <span className="text-xs text-gray-500 font-normal min-w-0 flex-shrink-0">
                  {index + 1}
                </span>
                <span className="break-all">{log}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
