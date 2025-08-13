
import React from 'react'; 
import { ConversationFlow } from './ConversationFlow';
import { useCombinedStore as useStore } from '../store';
import type { ChatMessage } from '../types/chat';
import { useEffect, useRef, useCallback } from 'react';

export const ChatMessagesContainer = React.memo(() => {
  const messages = useStore((state) => state.messages as ChatMessage[]);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll déboncé pour éviter les thrashing de layout
  const scrollToBottom = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }, 100); // Débonce de 100ms
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Nettoyage du timeout
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 chat-container"
    >
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-slate-500 dark:text-slate-400">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-lg font-medium mb-2">Bonjour ! Je suis AgenticForge</h3>
            <p className="text-sm">Décrivez-moi ce que vous souhaitez créer ou automatiser</p>
          </div>
        </div>
      ) : (
        <ConversationFlow messages={messages} />
      )}
    </div>
  );
});
