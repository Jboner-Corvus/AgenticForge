import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Wrench } from 'lucide-react';
import { useSessionStore } from '../store/sessionStore';
import type { ThoughtMessage, ToolCallMessage, ToolResultMessage } from '../types/chat';
import { EnhancedAgentThoughtBubble } from './EnhancedAgentThoughtBubble';
import { ActionStatusBubble } from './ActionStatusBubble';

interface ChatActionDisplayProps {
  className?: string;
}

export const ChatActionDisplay: React.FC<ChatActionDisplayProps> = ({ className = '' }) => {
  const messages = useSessionStore((state) => state.messages);
  const [currentThought, setCurrentThought] = useState<ThoughtMessage | null>(null);
  const [actions, setActions] = useState<Array<{id: string, toolName: string, status: string, timestamp: string, params?: Record<string, unknown>, result?: unknown, details?: string}>>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Type guards
  const isThoughtMessage = (message: unknown): message is ThoughtMessage => {
    return Boolean(
      message &&
        typeof message === 'object' &&
        'type' in message &&
        message.type === 'agent_thought'
    );
  };

  const isToolCallMessage = (message: unknown): message is ToolCallMessage => {
    return Boolean(
      message &&
        typeof message === 'object' &&
        'type' in message &&
        message.type === 'tool_call'
    );
  };

  const isToolResultMessage = (message: unknown): message is ToolResultMessage => {
    return Boolean(
      message &&
        typeof message === 'object' &&
        'type' in message &&
        message.type === 'tool_result'
    );
  };

  // Mettre à jour les pensées et actions en fonction des messages
  useEffect(() => {
    // Extraire la dernière pensée
    const thoughtMessages = messages.filter(isThoughtMessage);
    if (thoughtMessages.length > 0) {
      const latestThought = thoughtMessages[thoughtMessages.length - 1];
      setCurrentThought(latestThought);
      setIsVisible(true);
    }

    // Extraire les actions
    const toolActionsMap = new Map<string, any>();
    
    messages.forEach((message, index) => {
      if (isToolCallMessage(message)) {
        const toolMsg = message;
        const actionId = toolMsg.id || `${toolMsg.toolName}-${index}`;
        
        toolActionsMap.set(actionId, {
          id: actionId,
          toolName: toolMsg.toolName || 'Unknown Tool',
          status: 'in_progress',
          timestamp: new Date(
            toolMsg.timestamp || Date.now()
          ).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          params: toolMsg.params,
          details: `Appel de l'outil: ${toolMsg.toolName}`,
        });
      } else if (isToolResultMessage(message)) {
        const resultMsg = message;
        const actionId = resultMsg.id || `${resultMsg.toolName}-${index}`;
        
        // Chercher l'action correspondante
        const existingAction = Array.from(toolActionsMap.values()).find(
          (action) =>
            action.toolName === resultMsg.toolName &&
            action.status === 'in_progress'
        );
        
        if (existingAction) {
          toolActionsMap.set(existingAction.id, {
            ...existingAction,
            status:
              (resultMsg as ToolResultMessage).result &&
              typeof (resultMsg as ToolResultMessage).result === 'object' &&
              'output' in (resultMsg as ToolResultMessage).result
                ? 'completed'
                : 'error',
            result: resultMsg.result,
            timestamp: new Date(
              resultMsg.timestamp || Date.now()
            ).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
            details:
              (resultMsg as ToolResultMessage).result &&
              typeof (resultMsg as ToolResultMessage).result === 'object' &&
              'output' in (resultMsg as ToolResultMessage).result
                ? 'Résultat obtenu avec succès'
                : "Erreur lors de l'exécution",
          });
        } else {
          // Créer une nouvelle entrée pour le résultat
          toolActionsMap.set(actionId, {
            id: actionId,
            toolName: resultMsg.toolName || 'Unknown Tool',
            status:
              (resultMsg as ToolResultMessage).result &&
              typeof (resultMsg as ToolResultMessage).result === 'object' &&
              'output' in (resultMsg as ToolResultMessage).result
                ? 'completed'
                : 'error',
            timestamp: new Date(
              resultMsg.timestamp || Date.now()
            ).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
            result: resultMsg.result,
            details:
              (resultMsg as ToolResultMessage).result &&
              typeof (resultMsg as ToolResultMessage).result === 'object' &&
              'output' in (resultMsg as ToolResultMessage).result
                ? 'Résultat obtenu avec succès'
                : "Erreur lors de l'exécution",
          });
        }
      }
    });
    
    // Convertir en array et garder les actions actives
    const recentActions = Array.from(toolActionsMap.values()).filter(
      action => action.status === 'in_progress' || action.status === 'pending'
    );
    
    setActions(recentActions);
    
    // Afficher si on a des pensées ou des actions actives
    if (thoughtMessages.length > 0 || recentActions.length > 0) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [messages]);

  // Auto-hide après un certain temps si tout est terminé
  useEffect(() => {
    if (isVisible) {
      const allCompleted = actions.every(
        (action) => action.status === 'completed' || action.status === 'error'
      );
      
      if (allCompleted && !currentThought) {
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 10000); // 10 secondes après la fin

        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, actions, currentThought]);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={`mb-4 ${className}`}
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-800/50 border border-blue-200 dark:border-slate-700 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                {currentThought ? (
                  <Sparkles className="w-3 h-3 text-white" />
                ) : (
                  <Wrench className="w-3 h-3 text-white" />
                )}
              </div>
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {currentThought ? 'Nouvelle Réflexion' : 'Actions en cours'}
              </span>
            </div>
            <button
              onClick={handleClose}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-3">
            {currentThought && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <EnhancedAgentThoughtBubble
                  content={currentThought.content}
                  isProminent={true}
                />
              </motion.div>
            )}
            
            {actions.length > 0 && (
              <div className="space-y-2">
                {actions.map((action, index) => (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ActionStatusBubble
                      toolName={action.toolName}
                      status={action.status as any}
                      timestamp={action.timestamp}
                      params={action.params}
                      result={action.result}
                      details={action.details}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};