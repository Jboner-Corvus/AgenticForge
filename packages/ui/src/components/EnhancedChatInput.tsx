import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Paperclip, 
  Mic, 
  Square, 
  Sparkles, 
  Code2, 
  FileText, 
  Clock,
  Lightbulb
} from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useIsProcessing, useMessageInputValue } from '../store/hooks';
import { useUIStore } from '../store/uiStore';
import { useAgentStream } from '../lib/hooks/useAgentStream';
import { useLanguage } from '../lib/contexts/LanguageContext';
import { LoadingSpinner } from './LoadingSpinner';

// Suggestions intelligentes basées sur le contexte
const SMART_SUGGESTIONS = [
  { 
    icon: Code2, 
    text: "Aide-moi avec du code", 
    prompt: "J'ai besoin d'aide pour écrire du code. Voici ce que je veux faire : ",
    color: "text-blue-400"
  },
  { 
    icon: FileText, 
    text: "Analyse ce fichier", 
    prompt: "Peux-tu analyser et m'expliquer ce fichier ? ",
    color: "text-green-400"
  },
  { 
    icon: Lightbulb, 
    text: "Optimise mon projet", 
    prompt: "Comment puis-je optimiser et améliorer mon projet ? ",
    color: "text-yellow-400"
  },
  { 
    icon: Sparkles, 
    text: "Créer quelque chose", 
    prompt: "Je veux créer quelque chose de nouveau. Aide-moi à ",
    color: "text-purple-400"
  }
];

interface EnhancedChatInputProps {
  variant?: 'classic' | 'pinned';
  showSuggestions?: boolean;
}

export const EnhancedChatInput: React.FC<EnhancedChatInputProps> = ({ 
  variant = 'classic',
  showSuggestions = true 
}) => {
  const { translations } = useLanguage();
  const inputValue = useMessageInputValue();
  const setInputValue = useUIStore(state => state.setMessageInputValue);
  const { startAgent } = useAgentStream();
  const isProcessing = useIsProcessing();
  
  // States pour les fonctionnalités avancées
  const [showSuggestionsPanel, setShowSuggestionsPanel] = useState(false);
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ajustement automatique de la hauteur du textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [inputValue]);

  // Afficher les suggestions si l'input est vide
  useEffect(() => {
    setShowSuggestionsPanel(inputValue === '' && showSuggestions);
  }, [inputValue, showSuggestions]);

  const handleSendMessage = () => {
    if (inputValue.trim() && !isProcessing) {
      // Ajouter à l'historique
      setInputHistory(prev => [inputValue, ...prev.slice(0, 9)]); // Garder les 10 derniers
      setHistoryIndex(-1);
      
      startAgent(inputValue);
      setInputValue('');
      setAttachedFiles([]); // Clear attachments after sending
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isProcessing) {
      e.preventDefault();
      handleSendMessage();
    }
    
    // Navigation dans l'historique
    if (e.key === 'ArrowUp' && e.ctrlKey) {
      e.preventDefault();
      if (historyIndex < inputHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInputValue(inputHistory[newIndex]);
      }
    }
    
    if (e.key === 'ArrowDown' && e.ctrlKey) {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInputValue(inputHistory[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputValue('');
      }
    }
  };

  const handleSuggestionClick = (suggestion: typeof SMART_SUGGESTIONS[0]) => {
    setInputValue(suggestion.prompt);
    setShowSuggestionsPanel(false);
    textareaRef.current?.focus();
  };

  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implémenter l'enregistrement vocal
  };

  return (
    <TooltipProvider>
      <div data-testid="user-input" className="relative w-full">
        {/* Suggestions Panel */}
        <AnimatePresence>
          {showSuggestionsPanel && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-full mb-4 w-full"
            >
              <div className={`rounded-2xl p-4 shadow-2xl border backdrop-blur-sm ${
                variant === 'pinned' 
                  ? 'bg-black/80 border-cyan-500/30' 
                  : 'bg-background/95 border-border'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Suggestions rapides</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SMART_SUGGESTIONS.map((suggestion, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:scale-105 ${
                        variant === 'pinned'
                          ? 'hover:bg-cyan-500/10 border border-cyan-500/20'
                          : 'hover:bg-primary/10 border border-border'
                      }`}
                    >
                      <suggestion.icon className={`h-4 w-4 ${suggestion.color}`} />
                      <span className="text-sm">{suggestion.text}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attached Files */}
        {attachedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex flex-wrap gap-2 mb-2"
          >
            {attachedFiles.map((file, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="flex items-center gap-2 py-1"
              >
                <FileText className="h-3 w-3" />
                {file.name}
                <button
                  onClick={() => removeAttachedFile(index)}
                  className="ml-1 hover:text-red-400"
                >
                  ×
                </button>
              </Badge>
            ))}
          </motion.div>
        )}

        {/* Main Input Container */}
        <div className={`relative rounded-3xl border shadow-lg transition-all duration-300 ${
          variant === 'pinned'
            ? 'bg-black/60 border-cyan-500/30 focus-within:border-cyan-400'
            : 'bg-background/95 border-border focus-within:border-primary'
        } ${isProcessing ? 'opacity-75' : ''}`}>
          
          {/* Textarea */}
          <Textarea
            ref={textareaRef}
            name="enhanced-chat-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={translations?.typeYourMessage || "Écrivez votre message... (Ctrl+↑/↓ pour l'historique)"}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            className="resize-none border-0 bg-transparent py-4 px-6 pr-32 placeholder:text-muted-foreground/60 focus:ring-0 focus:outline-none"
            style={{ 
              borderRadius: '24px',
              minHeight: '56px',
              maxHeight: '150px'
            }}
          />

          {/* Input Actions Bar */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            
            {/* History Indicator */}
            {historyIndex >= 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {historyIndex + 1}/{inputHistory.length}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Historique des messages</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* File Attach */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleFileAttach}
                  className="h-8 w-8 hover:bg-primary/10"
                  disabled={isProcessing}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Joindre un fichier</p>
              </TooltipContent>
            </Tooltip>

            {/* Voice Recording */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleRecording}
                  className="h-8 w-8"
                  disabled={isProcessing}
                >
                  {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isRecording ? 'Arrêter l\'enregistrement' : 'Enregistrement vocal'}</p>
              </TooltipContent>
            </Tooltip>

            {/* Send Button */}
            <Button 
              onClick={handleSendMessage} 
              size="icon"
              disabled={isProcessing || !inputValue.trim()}
              className={
                "h-8 w-8 rounded-full transition-all duration-200 " + 
                (variant === 'pinned' 
                  ? 'bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-600' 
                  : 'bg-primary hover:bg-primary/90') + 
                " " + 
                (inputValue.trim() ? 'scale-110' : 'scale-100')
              }
            >
              {isProcessing ? (
                <LoadingSpinner className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Character Count & Shortcuts */}
          <div className="absolute bottom-1 left-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span>{inputValue.length}/2000</span>
            {inputHistory.length > 0 && (
              <span className="hidden sm:block">Ctrl+↑/↓ pour l'historique</span>
            )}
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
          accept=".txt,.md,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.html,.css,.json,.xml,.yaml,.yml"
        />
      </div>
    </TooltipProvider>
  );
};