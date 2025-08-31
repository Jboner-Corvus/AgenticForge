import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useIsProcessing, useMessageInputValue } from '../store/hooks';
import { useUIStore } from '../store/uiStore';
import { useAgentStream } from '../lib/hooks/useAgentStream';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Send, Paperclip, Mic, Square } from 'lucide-react';
import { useLanguage } from '../lib/contexts/LanguageContext';
import { LoadingSpinner } from './LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';

// Configuration des limites
const MAX_MESSAGE_LENGTH = 4000;
const MAX_HEIGHT = 200;
const MIN_HEIGHT = 50;

export const UserInput = () => {
  const { translations } = useLanguage();
  const inputValue = useMessageInputValue();
  const setInputValue = useUIStore((state) => state.setMessageInputValue);
  const { startAgent } = useAgentStream();
  const isProcessing = useIsProcessing();

  // États locaux pour les fonctionnalités avancées
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ajustement automatique de la hauteur
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, MAX_HEIGHT);
      textarea.style.height = newHeight + 'px';
    }
  }, []);

  // Effet pour ajuster la hauteur quand le contenu change
  useEffect(() => {
    adjustHeight();
  }, [inputValue, adjustHeight]);

  // Gestion du drag & drop pour les fichiers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file =>
      file.type.startsWith('image/') ||
      file.type.startsWith('text/') ||
      file.type === 'application/pdf'
    );

    if (validFiles.length > 0) {
      setAttachments(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 fichiers
    }
  }, []);

  // Gestion de l'enregistrement vocal
  const startRecording = useCallback(() => {
    setIsRecording(true);
    setRecordingTime(0);

    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);

    // Ici vous pouvez intégrer une vraie API de reconnaissance vocale
    console.log('🎤 Recording started...');
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    // Ici vous traiteriez l'audio enregistré
    console.log('🎤 Recording stopped after', recordingTime, 'seconds');
    setRecordingTime(0);
  }, [recordingTime]);

  // Gestion des pièces jointes
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files].slice(0, 5));
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Validation et envoi du message
  const validateAndSendMessage = useCallback(() => {
    const trimmedValue = inputValue.trim();

    if (!trimmedValue && attachments.length === 0) {
      return;
    }

    if (trimmedValue.length > MAX_MESSAGE_LENGTH) {
      console.warn('Message too long:', trimmedValue.length, 'characters');
      return;
    }

    if (isProcessing) {
      return;
    }

    console.log('🚀 Sending message:', {
      text: trimmedValue,
      attachments: attachments.length,
      timestamp: new Date().toISOString()
    });

    // Ici vous pouvez traiter les pièces jointes
    if (attachments.length > 0) {
      console.log('📎 Processing attachments:', attachments.map(f => f.name));
    }

    startAgent(trimmedValue);
    setInputValue('');
    setAttachments([]);
  }, [inputValue, attachments, isProcessing, startAgent, setInputValue]);

  // Gestion des raccourcis clavier améliorés
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + Enter pour nouvelle ligne
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      return; // Permettre la nouvelle ligne
    }

    // Enter seul pour envoyer
    if (e.key === 'Enter' && !e.shiftKey && !isProcessing) {
      e.preventDefault();
      validateAndSendMessage();
    }

    // Échap pour annuler l'enregistrement
    if (e.key === 'Escape' && isRecording) {
      stopRecording();
    }
  }, [isProcessing, isRecording, validateAndSendMessage, stopRecording]);

  // Formatage du temps d'enregistrement
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calcul du nombre de caractères restants
  const remainingChars = MAX_MESSAGE_LENGTH - inputValue.length;
  const isNearLimit = remainingChars < 200;

  return (
    <div className="w-full space-y-2">
      {/* Affichage des pièces jointes */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg"
          >
            {attachments.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-2 bg-background rounded-md px-3 py-1 text-sm"
              >
                <Paperclip className="h-3 w-3" />
                <span className="truncate max-w-32">{file.name}</span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  ×
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zone de saisie principale */}
      <div
        className={`relative ${isDragOver ? 'ring-2 ring-primary ring-offset-2' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Textarea
          ref={textareaRef}
          name="user-input"
          value={inputValue}
          onChange={(e) => {
            if (e.target.value.length <= MAX_MESSAGE_LENGTH) {
              setInputValue(e.target.value);
            }
          }}
          placeholder={
            isRecording
              ? `🎤 Enregistrement... ${formatRecordingTime(recordingTime)}`
              : translations?.typeYourMessage || 'Tapez votre message... (Ctrl+Enter pour une nouvelle ligne)'
          }
          className={`flex-1 resize-none rounded-2xl py-3 px-4 pr-32 shadow-sm border-border focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ease-in-out ${
            isRecording ? 'border-red-500 bg-red-50/10' : ''
          } ${isDragOver ? 'border-primary' : ''}`}
          onKeyDown={handleKeyDown}
          disabled={isProcessing || isRecording}
          style={{
            minHeight: MIN_HEIGHT,
            maxHeight: MAX_HEIGHT,
            borderRadius: '16px'
          }}
        />

        {/* Indicateur de limite de caractères */}
        {isNearLimit && (
          <div className={`absolute bottom-2 left-4 text-xs ${
            remainingChars < 0 ? 'text-destructive' : 'text-muted-foreground'
          }`}>
            {remainingChars} caractères restants
          </div>
        )}

        {/* Boutons d'action */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {/* Bouton pièce jointe */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing || isRecording}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Joindre un fichier"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          {/* Bouton enregistrement vocal */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`h-8 w-8 ${
              isRecording
                ? 'text-red-500 hover:text-red-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title={isRecording ? 'Arrêter l\'enregistrement' : 'Enregistrement vocal'}
          >
            {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>

          {/* Bouton d'envoi */}
          {isProcessing ? (
            <div className="h-8 w-8 flex items-center justify-center">
              <LoadingSpinner className="h-4 w-4" />
            </div>
          ) : (
            <Button
              onClick={validateAndSendMessage}
              size="icon"
              disabled={!inputValue.trim() && attachments.length === 0}
              className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90"
              title="Envoyer le message (Enter)"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Input file caché */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,text/*,.pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Message d'aide pour le drag & drop */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center text-sm text-muted-foreground py-2"
          >
            Déposez vos fichiers ici (images, textes, PDF)
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
