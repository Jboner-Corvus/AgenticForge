import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowDown, 
  MessageSquare, 
  Sparkles, 
  Clock,
  Maximize2,
  Minimize2,
  Copy,
  Download,
  ListTodo
} from 'lucide-react';
import { ChatMessagesContainer } from './ChatMessagesContainer';
import { EnhancedChatInput } from './EnhancedChatInput';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useMessages } from '../store/hooks';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface EnhancedChatContainerProps {
  className?: string;
  variant?: 'classic' | 'pinned';
  showHeader?: boolean;
}

export const EnhancedChatContainer: React.FC<EnhancedChatContainerProps> = ({ 
  className = '', 
  variant = 'classic',
  showHeader = true
}) => {
  const messages = useMessages();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // États pour les fonctionnalités avancées
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState<Date>();
  const [showTodoList, setShowTodoList] = useState(false);
  const [todoListPinned] = useState(false);

  // Vérifier si on est en bas du chat
  const checkScrollPosition = useCallback(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      setIsAtBottom(isBottom);
      setShowScrollButton(!isBottom && messages.length > 0);
    }
  }, [messages.length]);

  // Auto-scroll intelligent
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior,
      block: 'end'
    });
    setUnreadCount(0);
  };

  // Gestion des nouveaux messages
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      setLastMessageTime(new Date());
      
      if (isAtBottom) {
        // Auto-scroll si on était déjà en bas
        setTimeout(() => scrollToBottom(), 100);
      } else {
        // Incrémenter le compteur de messages non lus
        setUnreadCount(prev => prev + 1);
      }
    }
  }, [messages, isAtBottom]);

  // Fonction pour basculer l'affichage de la todo list
  const toggleTodoList = () => {
    const newShowState = !showTodoList;
    setShowTodoList(newShowState);
    
    // Envoyer un message au composant ChatHeaderTodoList
    window.postMessage({ 
      type: 'toggle_chat_todo_list',
      show: newShowState 
    }, '*');
  };

  // Écouter les changements d'état de la todo list
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'chat_header_todo') {
        // When todo list data arrives, update the show state
        setShowTodoList(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Gestion du scroll
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      checkScrollPosition(); // Check initial position
      
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, [checkScrollPosition]);

  // Export de la conversation
  const exportConversation = () => {
    const conversationText = messages
      .map(msg => {
        // Type guard for messages with content property
        if ('content' in msg && typeof msg.content === 'string') {
          return `${msg.type}: ${msg.content}`;
        }
        // Type guard for tool_call messages
        if (msg.type === 'tool_call' && 'toolName' in msg && 'params' in msg) {
          return `${msg.type} (${msg.toolName}): ${JSON.stringify(msg.params)}`;
        }
        // Type guard for tool_result messages
        if (msg.type === 'tool_result' && 'toolName' in msg && 'result' in msg) {
          return `${msg.type} (${msg.toolName}): ${JSON.stringify(msg.result)}`;
        }
        // Fallback for other message types
        return `${msg.type}: ${JSON.stringify(msg)}`;
      })
      .join('\n\n');
    
    const blob = new Blob([conversationText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copier la conversation
  const copyConversation = async () => {
    const conversationText = messages
      .map(msg => {
        // Type guard for messages with content property
        if ('content' in msg && typeof msg.content === 'string') {
          return `${msg.type}: ${msg.content}`;
        }
        // Type guard for tool_call messages
        if (msg.type === 'tool_call' && 'toolName' in msg && 'params' in msg) {
          return `${msg.type} (${msg.toolName}): ${JSON.stringify(msg.params)}`;
        }
        // Type guard for tool_result messages
        if (msg.type === 'tool_result' && 'toolName' in msg && 'result' in msg) {
          return `${msg.type} (${msg.toolName}): ${JSON.stringify(msg.result)}`;
        }
        // Fallback for other message types
        return `${msg.type}: ${JSON.stringify(msg)}`;
      })
      .join('\n\n');
    
    try {
      await navigator.clipboard.writeText(conversationText);
      // TODO: Show toast notification
    } catch (err) {
      console.error('Failed to copy conversation:', err);
    }
  };

  const headerStyles = variant === 'pinned' 
    ? "bg-black/80 border-b border-cyan-500/20"
    : "bg-background/95 border-b border-border";

  const containerStyles = variant === 'pinned'
    ? "bg-black/60"
    : "bg-background/50";

  return (
    <TooltipProvider>
      <div data-testid="chat-messages" className={`flex flex-col h-full w-full min-w-0 ${className}`}>
        
        {/* Header de chat moderne */}
        {showHeader && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${headerStyles} backdrop-blur-sm p-4 flex items-center justify-between`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${variant === 'pinned' ? 'bg-cyan-500/20' : 'bg-primary/20'}`}>
                <Sparkles className={`h-4 w-4 ${variant === 'pinned' ? 'text-cyan-400' : 'text-primary'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">AgenticForge Assistant</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span>En ligne</span>
                  </div>
                  {lastMessageTime && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{lastMessageTime.toLocaleTimeString()}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <MessageSquare className="h-3 w-3 mr-1" />
                {messages.length}
              </Badge>

              {/* Actions du header */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTodoList}
                    className={`h-8 w-8 ${showTodoList ? (todoListPinned ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400') : ''}`}
                  >
                    <ListTodo className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{showTodoList ? 'Masquer la TodoList' : 'Afficher la TodoList'}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={copyConversation}
                    className="h-8 w-8"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copier la conversation</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={exportConversation}
                    className="h-8 w-8"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Exporter la conversation</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="h-8 w-8"
                  >
                    {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isMinimized ? 'Agrandir' : 'Réduire'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </motion.div>
        )}

        {!isMinimized && (
          <>
            {/* Zone de messages avec scroll personnalisé */}
            <div 
              ref={messagesContainerRef}
              className={`flex-grow overflow-y-auto min-h-0 p-4 relative ${containerStyles} backdrop-blur-sm`}
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: variant === 'pinned' ? '#06b6d4 transparent' : '#6366f1 transparent'
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
                        <Badge 
                          className="absolute -top-2 -right-2 bg-red-500 text-white border-0 h-5 w-5 p-0 flex items-center justify-center text-xs"
                        >
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
            
            {/* Zone d'input améliorée */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 ${
                variant === 'pinned'
                  ? 'bg-black/80 border-t border-cyan-500/20'
                  : 'bg-background/95 border-t border-border'
              } backdrop-blur-sm`}
            >
              <EnhancedChatInput 
                variant={variant}
                showSuggestions={messages.length === 0}
              />
            </motion.div>
          </>
        )}

        {/* Version minimisée */}
        {isMinimized && showHeader && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`${headerStyles} backdrop-blur-sm p-2 flex items-center justify-between cursor-pointer`}
            onClick={() => setIsMinimized(false)}
          >
            <div className="flex items-center gap-2">
              <Sparkles className={`h-4 w-4 ${variant === 'pinned' ? 'text-cyan-400' : 'text-primary'}`} />
              <span className="text-sm font-medium">AgenticForge Assistant</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Maximize2 className="h-3 w-3" />
            </Button>
          </motion.div>
        )}
      </div>
    </TooltipProvider>
  );
};