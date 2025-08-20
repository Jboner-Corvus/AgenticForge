import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import './ConversationStyles.css';
import type { ChatMessage, ToolCallMessage, ToolResultMessage, ErrorMessage as ErrorMessageType, AgentResponseMessage } from '../types/chat';
import { UserMessage } from './UserMessage';
import { AgentResponseBubble } from './AgentResponseBubble';
import { AgentThoughtBubble } from './AgentThoughtBubble';
import { ToolMessage } from './ToolMessage';
import { ErrorMessage } from './ErrorMessage';

interface ConversationTurn {
  id: string;
  userMessage?: ChatMessage;
  agentThought?: ChatMessage;
  toolCalls: ChatMessage[];
  toolResults: ChatMessage[];
  agentResponse?: ChatMessage;
  errors: ChatMessage[];
  timestamp: number;
}

interface ConversationFlowProps {
  messages: ChatMessage[];
}

export const ConversationFlow: React.FC<ConversationFlowProps> = React.memo(({ messages }) => {
  // Memoization du groupement des messages pour éviter les recalculs inutiles
  const turns = useMemo(() => {
    const groupMessagesByTurn = (messages: ChatMessage[]): ConversationTurn[] => {
    const turns: ConversationTurn[] = [];
    let currentTurn: Partial<ConversationTurn> = {};
    let turnId = 0;

    messages.forEach((message) => {
      const timestamp = message.timestamp || Date.now();

      switch (message.type) {
        case 'user':
          // Nouveau tour utilisateur
          if (currentTurn.userMessage) {
            // Finaliser le tour précédent
            turns.push({
              id: `turn-${turnId++}`,
              toolCalls: [],
              toolResults: [],
              errors: [],
              timestamp: currentTurn.timestamp || Date.now(),
              ...currentTurn,
            } as ConversationTurn);
            currentTurn = {};
          }
          currentTurn.userMessage = message;
          currentTurn.timestamp = timestamp;
          break;

        case 'agent_thought':
          currentTurn.agentThought = message;
          break;

        case 'tool_call':
          if (!currentTurn.toolCalls) currentTurn.toolCalls = [];
          currentTurn.toolCalls.push(message);
          break;

        case 'tool_result':
          if (!currentTurn.toolResults) currentTurn.toolResults = [];
          currentTurn.toolResults.push(message);
          break;

        case 'agent_response':
          currentTurn.agentResponse = message;
          break;

        case 'error':
          if (!currentTurn.errors) currentTurn.errors = [];
          currentTurn.errors.push(message);
          break;
      }
    });

    // Ajouter le dernier tour
    if (currentTurn.userMessage || currentTurn.agentThought || currentTurn.agentResponse) {
      turns.push({
        id: `turn-${turnId}`,
        toolCalls: [],
        toolResults: [],
        errors: [],
        timestamp: currentTurn.timestamp || Date.now(),
        ...currentTurn,
      } as ConversationTurn);
    }

      return turns;
    };

    return groupMessagesByTurn(messages);
  }, [messages]);

  return (
    <div className="space-y-8 p-6">
      {turns.map((turn, turnIndex) => (
        <motion.div
          key={turn.id}
          className="conversation-turn"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: turnIndex * 0.1 }}
        >
          {/* Message utilisateur */}
          {turn.userMessage && turn.userMessage.type === 'user' && (
            <div className="mb-6">
              <UserMessage content={turn.userMessage.content} />
            </div>
          )}

          {/* Réponse de l'agent avec structure claire */}
          {(turn.agentThought || turn.toolCalls.length > 0 || turn.agentResponse) && (
            <motion.div
              className="agent-section bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              {/* Pensée de l'agent */}
              {turn.agentThought && turn.agentThought.type === 'agent_thought' && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    Réflexion
                  </div>
                  <AgentThoughtBubble
                    content={turn.agentThought.content}
                    timestamp={new Date(turn.timestamp).toLocaleTimeString()}
                  />
                </div>
              )}

              {/* Actions (Tool calls + results) */}
              {turn.toolCalls.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    Actions ({turn.toolCalls.length})
                  </div>
                  <div className="space-y-2">
                    {turn.toolCalls.map((toolCall, index) => {
                      const correspondingResult = turn.toolResults[index];
                      return (
                        <motion.div
                          key={toolCall.id}
                          className="tool-interaction bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-600"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          {/* Tool Call */}
                          <div className="mb-2">
                            <ToolMessage message={toolCall as ToolCallMessage} />
                          </div>
                          
                          {/* Tool Result */}
                          {correspondingResult && (
                            <div className="mt-2 pl-4 border-l-2 border-slate-200 dark:border-slate-600">
                              <ToolMessage message={correspondingResult as ToolResultMessage} />
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Erreurs */}
              {turn.errors.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    Erreurs ({turn.errors.length})
                  </div>
                  <div className="space-y-2">
                    {turn.errors.map((error) => (
                      <ErrorMessage key={error.id} content={(error as ErrorMessageType).content} />
                    ))}
                  </div>
                </div>
              )}

              {/* Réponse finale de l'agent */}
              {turn.agentResponse && (
                <div>
                  <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Réponse
                  </div>
                  <AgentResponseBubble
                    content={(turn.agentResponse as AgentResponseMessage).content}
                    id={turn.agentResponse.id}
                    timestamp={new Date(turn.timestamp).toLocaleTimeString()}
                  />
                </div>
              )}
            </motion.div>
          )}

          {/* Séparateur entre tours */}
          {turnIndex < turns.length - 1 && (
            <div className="flex items-center justify-center py-6">
              <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent w-full max-w-xs"></div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
});