import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { ChatMessagesContainer } from './ChatMessagesContainer';
import { EnhancedChatInput } from './EnhancedChatInput';
import { PinnedBrowserView } from './PinnedBrowserView';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useMessages } from '../store/hooks';
import { TooltipProvider } from './ui/tooltip';

interface EnhancedChatContainerProps {
  className?: string;
  variant?: 'classic' | 'pinned';
}

export const EnhancedChatContainer: React.FC<EnhancedChatContainerProps> = ({
  className = '',
  variant = 'classic',
}) => {
  const messages = useMessages();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // États pour les fonctionnalités avancées
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Vérifier si on est en bas du chat
  const checkScrollPosition = useCallback(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        100;
      setIsAtBottom(isBottom);
      setShowScrollButton(!isBottom && messages.length > 0);
    }
  }, [messages.length]);

  // Auto-scroll intelligent
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({
      behavior,
      block: 'end',
    });
    setUnreadCount(0);
  };

  // Gestion des nouveaux messages
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      if (isAtBottom) {
        // Auto-scroll si on était déjà en bas
        setTimeout(() => scrollToBottom(), 100);
      } else {
        // Incrémenter le compteur de messages non lus
        setUnreadCount((prev) => prev + 1);
      }
    }
  }, [messages, isAtBottom]);

  // Gestion du scroll
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      checkScrollPosition(); // Check initial position

      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, [checkScrollPosition]);

  const containerStyles =
    variant === 'pinned' ? 'bg-black/60' : 'bg-background/50';

  return (
    <TooltipProvider>
      <div
        data-testid="chat-messages"
        className={`flex flex-col h-full w-full min-w-0 ${className}`}
      >
        {/* Pinned Browser View - toujours visible en haut */}
        <div className="shrink-0">
          <PinnedBrowserView />
        </div>

        {/* Zone de messages avec scroll personnalisé - prend tout l'espace sauf le bas */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div
            ref={messagesContainerRef}
            className={`flex-1 overflow-y-auto p-4 relative ${containerStyles} backdrop-blur-sm`}
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor:
                variant === 'pinned'
                  ? '#06b6d4 transparent'
                  : '#6366f1 transparent',
            }}
          >
            <ChatMessagesContainer />

            {/* Indicateur de scroll vers le bas */}
            <AnimatePresence>
              {showScrollButton && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute bottom-4 right-4"
                >
                  <Button
                    onClick={() => scrollToBottom()}
                    size="icon"
                    className={`rounded-full shadow-lg ${
                      variant === 'pinned'
                        ? 'bg-cyan-500 hover:bg-cyan-400'
                        : 'bg-primary hover:bg-primary/90'
                    }`}
                  >
                    <ArrowDown className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 bg-red-500 text-white border-0 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Élément invisible pour l'auto-scroll */}
            <div ref={messagesEndRef} />
          </div>

          {/* Indicateur de frappe (si en cours de traitement) */}
          <AnimatePresence>
            {/* TODO: Ajouter un indicateur de frappe quand l'agent répond */}
          </AnimatePresence>
        </div>

        {/* Zone d'input améliorée - épinglée en bas */}
        <div className="shrink-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 ${
              variant === 'pinned'
                ? 'bg-black/90 border-t border-cyan-500/20'
                : 'bg-background/95 border-t border-border'
            } backdrop-blur-sm shadow-lg`}
          >
            <EnhancedChatInput
              variant={variant}
              showSuggestions={messages.length === 0}
            />
          </motion.div>
        </div>
      </div>
    </TooltipProvider>
  );
};
