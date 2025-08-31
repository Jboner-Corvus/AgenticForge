import React from 'react';
import { motion } from 'framer-motion';
import {
  Wrench,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  Clipboard,
} from 'lucide-react';
import { Button } from './ui/button';

interface ActionStatusBubbleProps {
  toolName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  timestamp: string;
  params?: Record<string, unknown>;
  result?: unknown;
  details?: string;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'pending':
      return {
        icon: Wrench,
        color: 'orange',
        bgClass: 'bg-orange-50 dark:bg-orange-950/30',
        borderClass: 'border-orange-200 dark:border-orange-800',
        iconBgClass: 'bg-orange-600',
        textClass: 'text-orange-700 dark:text-orange-300',
        label: 'En attente',
        dotClass: 'bg-orange-500',
      };
    case 'in_progress':
      return {
        icon: Loader2,
        color: 'blue',
        bgClass: 'bg-blue-50 dark:bg-blue-950/30',
        borderClass: 'border-blue-200 dark:border-blue-800',
        iconBgClass: 'bg-blue-600',
        textClass: 'text-blue-700 dark:text-blue-300',
        label: 'En cours...',
        dotClass: 'bg-blue-500 animate-pulse',
      };
    case 'completed':
      return {
        icon: CheckCircle,
        color: 'green',
        bgClass: 'bg-green-50 dark:bg-green-950/30',
        borderClass: 'border-green-200 dark:border-green-800',
        iconBgClass: 'bg-green-600',
        textClass: 'text-green-700 dark:text-green-300',
        label: 'Terminé',
        dotClass: 'bg-green-500',
      };
    case 'error':
      return {
        icon: AlertCircle,
        color: 'red',
        bgClass: 'bg-red-50 dark:bg-red-950/30',
        borderClass: 'border-red-200 dark:border-red-800',
        iconBgClass: 'bg-red-600',
        textClass: 'text-red-700 dark:text-red-300',
        label: 'Erreur',
        dotClass: 'bg-red-500',
      };
    default:
      return {
        icon: Wrench,
        color: 'gray',
        bgClass: 'bg-gray-50 dark:bg-gray-950/30',
        borderClass: 'border-gray-200 dark:border-gray-800',
        iconBgClass: 'bg-gray-600',
        textClass: 'text-gray-700 dark:text-gray-300',
        label: 'Inconnu',
        dotClass: 'bg-gray-500',
      };
  }
};

export const ActionStatusBubble: React.FC<ActionStatusBubbleProps> = ({
  toolName,
  status,
  timestamp,
  params,
  result,
  details,
}) => {
  const [showDetails, setShowDetails] = React.useState(false);
  const config = getStatusConfig(status);
  const Icon = config.icon;

  // Helper function to safely convert result to string
  const formatResult = (result: unknown): string => {
    if (result === null || result === undefined) {
      return '';
    }
    if (typeof result === 'string') {
      return result;
    }
    try {
      return JSON.stringify(result, null, 2);
    } catch (error) {
      return String(result);
    }
  };

  const handleCopy = () => {
    const content = {
      tool: toolName,
      status,
      timestamp,
      ...(params ? { params } : {}),
      ...(result ? { result } : {}),
      ...(details ? { details } : {}),
    };
    navigator.clipboard.writeText(JSON.stringify(content, null, 2));
  };

  return (
    <motion.div
      className={`${config.bgClass} ${config.borderClass} border rounded-xl p-4 group relative overflow-hidden`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={{ y: -1, transition: { duration: 0.2 } }}
    >
      {/* Background decoration */}
      <div
        className={`absolute -top-4 -right-4 w-24 h-24 bg-${config.color}-200 dark:bg-${config.color}-900/30 rounded-full opacity-20 blur-xl`}
      ></div>

      <div className="flex items-start gap-3 relative z-10">
        <div
          className={`flex-shrink-0 w-8 h-8 ${config.iconBgClass} rounded-lg flex items-center justify-center shadow-md`}
        >
          <Icon
            className={`w-4 h-4 text-white ${status === 'in_progress' ? 'animate-spin' : ''}`}
          />
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium ${config.textClass} uppercase tracking-wide`}
              >
                {toolName}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full bg-white/50 dark:bg-slate-800/50 ${config.textClass}`}
              >
                {config.label}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {(params || result || details) && (
                <motion.div
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-md"
                    onClick={() => setShowDetails(!showDetails)}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </motion.div>
              )}

              <motion.div
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-md"
                  onClick={handleCopy}
                >
                  <Clipboard className="h-3 w-3" />
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Action details */}
          {showDetails && (params || result || details) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3"
            >
              {details && (
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {details}
                </div>
              )}

              {params && Object.keys(params).length > 0 && (
                <div className="mb-2">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Paramètres:
                  </div>
                  <pre className="text-xs bg-white/50 dark:bg-slate-800/50 p-2 rounded border overflow-x-auto">
                    {JSON.stringify(params, null, 2)}
                  </pre>
                </div>
              )}

              {result !== undefined && result !== null && (
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Résultat:
                  </div>
                  <pre className="text-xs bg-white/50 dark:bg-slate-800/50 p-2 rounded border overflow-x-auto">
                    {String(formatResult(result))}
                  </pre>
                </div>
              )}
            </motion.div>
          )}

          {/* Timestamp */}
          <div
            className={`text-xs ${config.textClass} mt-2 font-medium flex items-center gap-2`}
          >
            <span className={`w-2 h-2 rounded-full ${config.dotClass}`}></span>
            {timestamp}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
