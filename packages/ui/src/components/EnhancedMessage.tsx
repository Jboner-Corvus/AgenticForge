import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Copy, 
  Check, 
  ThumbsUp, 
  ThumbsDown, 
  MoreHorizontal, 
  RefreshCw,
  User,
  Bot,
  Clock,
  Tag
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { EnhancedCodeBlock } from './EnhancedCodeBlock';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface EnhancedMessageProps {
  message: {
    id: string;
    type: 'user' | 'agent' | 'system';
    content: string;
    timestamp: string;
    metadata?: {
      model?: string;
      tokenCount?: number;
      processingTime?: number;
    };
  };
  variant?: 'classic' | 'pinned';
  showActions?: boolean;
}

export const EnhancedMessage: React.FC<EnhancedMessageProps> = ({
  message,
  variant = 'classic',
  showActions = true
}) => {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);
  
  const isUser = message.type === 'user';
  const isAgent = message.type === 'agent';
  const isSystem = message.type === 'system';

  // Détecter les blocs de code dans le message
  const parseMessageContent = (content: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Ajouter le texte avant le bloc de code
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index)
        });
      }

      // Ajouter le bloc de code
      parts.push({
        type: 'code',
        language: match[1] || 'text',
        content: match[2].trim()
      });

      lastIndex = match.index + match[0].length;
    }

    // Ajouter le texte restant
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex)
      });
    }

    return parts.length > 0 ? parts : [{ type: 'text', content }];
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleFeedback = (isPositive: boolean) => {
    setLiked(liked === isPositive ? null : isPositive);
    // TODO: Envoyer le feedback au backend
  };

  const getMessageStyles = () => {
    const baseStyles = "relative group p-4 rounded-2xl shadow-sm border backdrop-blur-sm";
    
    if (isUser) {
      return variant === 'pinned'
        ? `${baseStyles} bg-cyan-900/30 border-cyan-500/30 ml-8`
        : `${baseStyles} bg-primary/10 border-primary/20 ml-8`;
    }
    
    if (isAgent) {
      return variant === 'pinned'
        ? `${baseStyles} bg-black/40 border-gray-700/50 mr-8`
        : `${baseStyles} bg-background/80 border-border mr-8`;
    }

    return `${baseStyles} bg-yellow-500/10 border-yellow-500/20 mx-8`;
  };

  const getAvatarStyles = () => {
    const baseStyles = "w-8 h-8 rounded-full flex items-center justify-center";
    
    if (isUser) {
      return variant === 'pinned'
        ? `${baseStyles} bg-cyan-500/20`
        : `${baseStyles} bg-primary/20`;
    }
    
    return variant === 'pinned'
      ? `${baseStyles} bg-gray-700/50`
      : `${baseStyles} bg-muted`;
  };

  const contentParts = parseMessageContent(message.content);
  
  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <div className={getMessageStyles()}>
          {/* Header avec avatar et métadonnées */}
          <div className="flex items-start gap-3 mb-3">
            <div className={getAvatarStyles()}>
              {isUser ? (
                <User className="h-4 w-4" />
              ) : isSystem ? (
                <Tag className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">
                  {isUser ? 'Vous' : isSystem ? 'Système' : 'AgenticForge Assistant'}
                </span>
                
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                </div>

                {message.metadata?.model && (
                  <Badge variant="outline" className="text-xs">
                    {message.metadata.model}
                  </Badge>
                )}
              </div>

              {message.metadata && (isAgent || isSystem) && (
                <div className="flex gap-3 text-xs text-muted-foreground">
                  {message.metadata.tokenCount && (
                    <span>{message.metadata.tokenCount} tokens</span>
                  )}
                  {message.metadata.processingTime && (
                    <span>{message.metadata.processingTime}ms</span>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={copyMessage}
                      className="h-8 w-8"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{copied ? 'Copié !' : 'Copier le message'}</p>
                  </TooltipContent>
                </Tooltip>

                {isAgent && (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleFeedback(true)}
                          className={`h-8 w-8 ${liked === true ? 'text-green-500' : ''}`}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Bonne réponse</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleFeedback(false)}
                          className={`h-8 w-8 ${liked === false ? 'text-red-500' : ''}`}
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Mauvaise réponse</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Régénérer la réponse</p>
                      </TooltipContent>
                    </Tooltip>
                  </>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Contenu du message */}
          <div className="space-y-3">
            {contentParts.map((part, index) => (
              <div key={index}>
                {part.type === 'code' ? (
                  <EnhancedCodeBlock
                    code={part.content}
                    language={part.language}
                    showLineNumbers={true}
                    collapsible={part.content.split('\n').length > 20}
                  />
                ) : (
                  <div 
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{
                      __html: part.content
                        .replace(/\n/g, '<br>')
                        .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs">$1</code>')
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Feedback visuel */}
          {liked !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-3 flex justify-end"
            >
              <Badge 
                variant={liked ? "default" : "destructive"}
                className="text-xs"
              >
                {liked ? '👍 Utile' : '👎 Pas utile'}
              </Badge>
            </motion.div>
          )}
        </div>
      </motion.div>
    </TooltipProvider>
  );
};