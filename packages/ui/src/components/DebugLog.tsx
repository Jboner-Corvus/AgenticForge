import React from 'react';
import { Button } from './ui/button';
import { X, AlertTriangle, RefreshCw, Trash2, Server, Key, Shield, Database } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { useSessionStore } from '../store/sessionStore';
import { useLLMKeysStore } from '../store/llmKeysStore';

interface DebugLogProps {
  logs: string[];
  onClose: () => void;
}

export const DebugLog: React.FC<DebugLogProps> = ({ logs, onClose }) => {
  // États des stores pour les infos de debug
  const authToken = useUIStore((state) => state.authToken);
  const sessionId = useSessionStore((state) => state.sessionId);
  const serverHealthy = useUIStore((state) => state.serverHealthy);
  const keys = useLLMKeysStore((state) => state.keys);
  const { fetchKeys, clearError } = useLLMKeysStore();
  const clearDebugLog = useUIStore((state) => state.clearDebugLog);

  const clearAllStores = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  const forceRefreshKeys = () => {
    clearError();
    fetchKeys();
  };

  const removeDuplicatesManually = () => {
    const keysStore = useLLMKeysStore.getState();
    const uniqueKeysMap = new Map();
    
    keysStore.keys.forEach(key => {
      const uniqueIdentifier = `${key.providerId}-${key.keyName}-${key.keyValue}`;
      
      if (!uniqueKeysMap.has(uniqueIdentifier)) {
        uniqueKeysMap.set(uniqueIdentifier, key);
      } else {
        const existingKey = uniqueKeysMap.get(uniqueIdentifier);
        if ((key.createdAt || '') > (existingKey.createdAt || '')) {
          uniqueKeysMap.set(uniqueIdentifier, key);
        }
      }
    });
    
    const uniqueKeys = Array.from(uniqueKeysMap.values());
    console.log(`Déduplication: ${keysStore.keys.length} -> ${uniqueKeys.length} clés`);
    useLLMKeysStore.setState({ keys: uniqueKeys });
  };

  // Calcul des doublons
  const uniqueIdentifiers = new Set();
  const realDuplicateCount = keys.reduce((count, key) => {
    const identifier = `${key.providerId}-${key.keyName}-${key.keyValue}`;
    if (uniqueIdentifiers.has(identifier)) {
      return count + 1;
    }
    uniqueIdentifiers.add(identifier);
    return count;
  }, 0);
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
    <div className="fixed bottom-0 right-0 w-full max-w-2xl h-1/2 bg-background border-t border-l border-border shadow-lg z-50 flex flex-col">
      <div className="flex justify-between items-center p-3 border-b border-border bg-gray-50">
        <h3 className="font-semibold flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />
          Debug Panel & Logs
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Section Debug Info */}
      <div className="p-3 bg-gray-100 border-b border-border">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-500" />
            <span className="text-xs">Token: {authToken ? '✅' : '❌'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-green-500" />
            <span className="text-xs">Session: {sessionId ? '✅' : '❌'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-purple-500" />
            <span className="text-xs">Server: {serverHealthy ? '✅' : '❌'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-orange-500" />
            <span className="text-xs">Keys: {keys.length} {realDuplicateCount > 0 && `(${realDuplicateCount} doublons)`}</span>
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button 
            size="sm" 
            onClick={forceRefreshKeys}
            className="text-xs bg-blue-600 hover:bg-blue-500"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh Keys
          </Button>
          
          <Button 
            size="sm" 
            onClick={clearDebugLog}
            className="text-xs bg-orange-600 hover:bg-orange-500"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear Logs
          </Button>
          
          {realDuplicateCount > 0 && (
            <Button 
              size="sm" 
              onClick={removeDuplicatesManually}
              className="text-xs bg-yellow-600 hover:bg-yellow-500"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Remove Duplicates
            </Button>
          )}
          
          <Button 
            size="sm" 
            onClick={clearAllStores}
            className="text-xs bg-red-600 hover:bg-red-500"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear All & Reload
          </Button>
        </div>
      </div>
      
      {/* Section Logs */}
      <div className="overflow-y-auto flex-grow p-2 text-xs font-mono bg-gray-50 space-y-1">
        <div className="flex justify-between items-center mb-2 p-2 bg-white rounded border">
          <span className="text-xs text-gray-600">
            📋 {logs.length} logs affichés (limité à 50 max)
          </span>
          <span className="text-xs text-gray-500">
            Auto-filtrés: logs répétitifs masqués
          </span>
        </div>
        
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
