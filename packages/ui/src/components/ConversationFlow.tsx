import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './ConversationStyles.css';
import type { ChatMessage } from '../types/chat';
import { memo } from 'react';
import { Message } from './Message';

export const ConversationFlow: React.FC<{ messages: any[] }> = ({ messages }) => {
  return (
    <div className="space-y-4 p-4">
      <ConversationFlowContent messages={messages} />
    </div>
  );
};

const ConversationFlowContent: React.FC<{ messages: any[] }> = memo(({ messages }) => {
  const [displayedMessages, setDisplayedMessages] = useState<any[]>([]);
  
  useEffect(() => {
    // Filtrer les messages pour éviter les doublons et gérer l'affichage intelligent
    const uniqueMessages: ChatMessage[] = [];
    const seenIds = new Set<string>();
    
    messages.forEach(message => {
      // Toujours afficher les messages utilisateur, réponses et erreurs
      if (['user', 'agent_response', 'error'].includes(message.type)) {
        if (!seenIds.has(message.id)) {
          uniqueMessages.push(message);
          seenIds.add(message.id);
        }
      }
      // Pour les pensées et actions, on peut appliquer une logique plus sophistiquée
      else {
        // Afficher tous les messages uniques par ID
        if (!seenIds.has(message.id)) {
          uniqueMessages.push(message);
          seenIds.add(message.id);
        }
      }
    });
    
    setDisplayedMessages(uniqueMessages);
  }, [messages]);

  return (
    <div className="space-y-4 p-4">
      {displayedMessages.map((message, index) => (
        <motion.div
          key={message.id}
          className="flex items-start gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.05 }}
        >
          {/* Numéro d'étape avec indicateur de type */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div className={`w-6 h-6 rounded-full ${getMessageTypeColor(message)} flex items-center justify-center`}>
              <span className="text-xs font-bold text-white">
                {index + 1}
              </span>
            </div>
            {index < displayedMessages.length - 1 && (
              <div className="w-0.5 h-8 bg-slate-200 dark:bg-slate-700 mt-1"></div>
            )}
          </div>
          
          {/* Contenu du message avec badge de type */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${getMessageTypeColor(message)}`}>
                {getMessageTypeName(message)}
              </span>
              {message.timestamp && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="ml-1">
              <Message message={message} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
});

// Fonction utilitaire pour obtenir le nom du type de message
const getMessageTypeName = (message: ChatMessage): string => {
  switch (message.type) {
    case 'user': return 'Utilisateur';
    case 'agent_thought': return 'Réflexion';
    case 'tool_call': return 'Appel d\'outil';
    case 'tool_result': return 'Résultat d\'outil';
    case 'agent_response': return 'Réponse';
    case 'error': return 'Erreur';
    default: return 'Message';
  }
};

// Fonction utilitaire pour obtenir la couleur du type de message
const getMessageTypeColor = (message: ChatMessage): string => {
  switch (message.type) {
    case 'user': return 'bg-blue-500';
    case 'agent_thought': return 'bg-purple-500';
    case 'tool_call': return 'bg-orange-500';
    case 'tool_result': return 'bg-yellow-500';
    case 'agent_response': return 'bg-green-500';
    case 'error': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};