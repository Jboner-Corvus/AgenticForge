import React, { useState } from 'react';
import type { ToolCallMessage, ToolResultMessage } from '../types/chat';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Code,
  Terminal,
  FileText,
  Search,
  Globe,
  Settings,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader,
} from 'lucide-react';
import { motion } from 'framer-motion';

// This component can display either a tool call or a tool result
type ToolMessageProps =
  | { message: ToolCallMessage }
  | { message: ToolResultMessage };

const getToolIcon = (toolName: string) => {
  const iconMap: {
    [key: string]: React.ComponentType<{ className?: string }>;
  } = {
    executeShellCommand: Terminal,
    readFile: FileText,
    writeFile: FileText,
    browser: Globe,
    listFiles: Search,
    manage_todo_list: CheckCircle,
    displayCanvas: Settings,
  };

  return iconMap[toolName] || Code;
};

const formatToolDescription = (
  toolName: string,
  isCall: boolean,
  params?: unknown,
  result?: unknown,
) => {
  if (isCall) {
    switch (toolName) {
      case 'executeShellCommand':
        return `Exécution de la commande: ${(params as Record<string, unknown>)?.command || 'commande inconnue'}`;
      case 'readFile':
        return `Lecture du fichier: ${(params as Record<string, unknown>)?.path || 'fichier inconnu'}`;
      case 'writeFile':
        return `Écriture dans le fichier: ${(params as Record<string, unknown>)?.path || 'fichier inconnu'}`;
      case 'browser':
        return `Navigation vers: ${(params as Record<string, unknown>)?.url || 'URL inconnue'}`;
      case 'listFiles':
        return `Liste des fichiers dans: ${(params as Record<string, unknown>)?.path || 'dossier inconnu'}`;
      case 'manage_todo_list':
        return `Gestion des tâches: ${(params as Record<string, unknown>)?.action || 'action inconnue'}`;
      case 'displayCanvas':
        return `Affichage dans le canvas: ${(params as Record<string, unknown>)?.contentType || 'contenu inconnu'}`;
      case 'finish':
        return `Finalisation de la réponse`;
      default:
        return `Appel de l'outil: ${toolName}`;
    }
  } else {
    // Tool result - Special handling for finish tool with FinishToolSignal
    const error = (result as Record<string, unknown>)?.error;
    if (
      error &&
      typeof error === 'object' &&
      (error as Record<string, unknown>)?.name === 'FinishToolSignal'
    ) {
      return `Réponse finalisée avec succès`;
    }
    if (error || (result as Record<string, unknown>)?.erreur) {
      return `Erreur lors de l'exécution`;
    }
    return `Résultat obtenu avec succès`;
  }
};

const getStatusInfo = (isCall: boolean, result?: unknown) => {
  if (isCall) {
    return {
      icon: Loader,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      status: 'En cours...',
    };
  }

  if (
    (result as Record<string, unknown>)?.error ||
    (result as Record<string, unknown>)?.erreur
  ) {
    return {
      icon: AlertCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      status: 'Erreur',
    };
  }

  return {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    status: 'Terminé',
  };
};

// Fonction pour tronquer les résultats longs
const truncateResult = (result: unknown, maxLength: number = 500): string => {
  if (result === null || result === undefined) {
    return '';
  }

  let resultString: string;
  if (typeof result === 'string') {
    resultString = result;
  } else {
    try {
      resultString = JSON.stringify(result, null, 2);
    } catch (error) {
      resultString = String(result);
    }
  }

  if (resultString.length <= maxLength) {
    return resultString;
  }

  return resultString.substring(0, maxLength) + '...';
};

export const ToolMessage: React.FC<ToolMessageProps> = ({ message }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullResult, setShowFullResult] = useState(false);
  const isToolCall = message.type === 'tool_call';
  const toolName = message.toolName;
  const description = formatToolDescription(
    toolName,
    isToolCall,
    isToolCall ? message.params : undefined,
    isToolCall ? undefined : message.result,
  );
  const {
    icon: StatusIcon,
    color: statusColor,
    bgColor,
    status,
  } = getStatusInfo(isToolCall, isToolCall ? undefined : message.result);
  const ToolIcon = getToolIcon(toolName);

  // Tronquer le résultat si trop long
  const resultString =
    !isToolCall && message.result
      ? JSON.stringify(message.result, null, 2)
      : '';
  const isLongResult = resultString.length > 500;
  const displayResult = showFullResult
    ? resultString
    : truncateResult(!isToolCall && message.result ? message.result : ''); // Fix the type error

  return (
    <motion.div
      className="animate-fade-in"
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`${bgColor} border border-border/50 rounded-lg shadow-sm overflow-hidden`}
      >
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="bg-background/50 rounded-md p-1 flex-shrink-0">
                <ToolIcon className="h-3 w-3 text-foreground/70" />
              </div>
              <span className="text-foreground/90 truncate text-sm">
                {description}
              </span>
              <StatusIcon className={`h-3 w-3 ${statusColor} flex-shrink-0`} />
              <span
                className={`text-xs ${statusColor} font-medium flex-shrink-0`}
              >
                {status}
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-foreground/60 hover:text-foreground/90 transition-colors flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          </CardTitle>
          <div className="flex items-center text-xs text-foreground/60 mt-1">
            <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
            <span>{new Date().toLocaleTimeString()}</span>
            <span className="mx-1">•</span>
            <span className="font-mono truncate text-xs">{toolName}</span>
          </div>
        </CardHeader>

        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="p-3 pt-0">
              <div className="text-xs text-foreground/70 mb-1">
                Détails techniques:
              </div>
              <div className="max-h-40 overflow-y-auto pr-1">
                <pre className="text-xs bg-background/50 p-2 rounded-md overflow-x-auto border border-border/30 font-mono text-foreground/80 whitespace-pre-wrap break-words">
                  {isLongResult && !showFullResult ? (
                    <>
                      {displayResult}
                      <button
                        onClick={() => setShowFullResult(true)}
                        className="text-blue-500 hover:text-blue-700 ml-2"
                      >
                        Voir plus
                      </button>
                    </>
                  ) : isLongResult && showFullResult ? (
                    <>
                      {displayResult}
                      <button
                        onClick={() => setShowFullResult(false)}
                        className="text-blue-500 hover:text-blue-700 ml-2"
                      >
                        Voir moins
                      </button>
                    </>
                  ) : (
                    displayResult
                  )}
                </pre>
              </div>
            </CardContent>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
};
