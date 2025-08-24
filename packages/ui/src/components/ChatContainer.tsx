import React, { useEffect, useRef } from 'react';
import { ChatMessagesContainer } from './ChatMessagesContainer';
import { UserInput } from './UserInput';
import { EnhancedChatContainer } from './EnhancedChatContainer';
import { useMessages } from '../store/hooks';

/**
 * Conteneur de chat moderne avec input fixé en bas et auto-scroll
 * Compatible avec les layouts classiques et pinnés
 */
export const ChatContainer: React.FC<{ 
  className?: string;
  showShadow?: boolean;
  variant?: 'classic' | 'pinned';
  enhanced?: boolean;
}> = ({ 
  className = '', 
  showShadow = false,
  variant = 'classic',
  enhanced = true
}) => {
  // Hooks are now at the top level to comply with React rules
  const messages = useMessages();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
  };

  // Auto-scroll effect - only runs when not in enhanced mode
  useEffect(() => {
    // Only run auto-scroll logic in non-enhanced mode
    if (!enhanced) {
      // Auto-scroll seulement si l'utilisateur est proche du bas
      if (messagesContainerRef.current) {
        const container = messagesContainerRef.current;
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        
        if (isNearBottom) {
          scrollToBottom();
        }
      }
    }
  }, [messages.length, enhanced]);

  // Si enhanced est activé, utilise le nouveau composant
  if (enhanced) {
    return (
      <EnhancedChatContainer
        className={className}
        variant={variant}
        showHeader={true}
      />
    );
  }

  // Fallback vers l'ancienne version pour compatibilité
  const inputBarStyles = variant === 'pinned' 
    ? "border-t border-cyan-500/20 p-4 bg-black/60 backdrop-blur-sm shadow-lg shadow-cyan-500/5"
    : `p-4 bg-background/95 backdrop-blur-sm border-t border-border flex-shrink-0 ${showShadow ? 'shadow-lg' : ''}`;

  return (
    <div className={`flex flex-col h-full w-full min-w-0 ${className}`}>
      {/* Zone de messages avec scroll */}
      <div 
        ref={messagesContainerRef}
        className="flex-grow overflow-y-auto min-h-0 p-4"
      >
        <ChatMessagesContainer />
        {/* Élément invisible pour l'auto-scroll */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Barre d'input fixée en bas */}
      <div className={inputBarStyles}>
        <div className="max-w-full">
          <UserInput />
        </div>
      </div>
    </div>
  );
};