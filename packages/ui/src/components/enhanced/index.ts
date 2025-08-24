/**
 * Enhanced Chat Components - Modern AI Assistant Interface
 * 
 * Composants de chat améliorés inspirés de Claude Code avec des fonctionnalités avancées :
 * - Interface élégante et moderne
 * - Auto-scroll intelligent  
 * - Historique des messages
 * - Suggestions contextuelles
 * - Affichage de code optimisé
 * - Feedback et interactions
 * - Support multi-modal (texte, code, fichiers)
 */

export { EnhancedChatContainer } from '../EnhancedChatContainer';
export { EnhancedChatInput } from '../EnhancedChatInput';
export { EnhancedCodeBlock } from '../EnhancedCodeBlock';
export { EnhancedMessage } from '../EnhancedMessage';
export { TypingIndicator } from '../TypingIndicator';

// Types et interfaces
export interface ChatMessage {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    model?: string;
    tokenCount?: number;
    processingTime?: number;
    attachments?: Array<{
      name: string;
      type: string;
      size: number;
      url?: string;
    }>;
  };
}

export interface ChatSuggestion {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  prompt: string;
  color: string;
  category?: 'code' | 'analysis' | 'creation' | 'optimization';
}

export interface EnhancedChatTheme {
  variant: 'classic' | 'pinned';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    border: string;
  };
  typography: {
    fontFamily: string;
    sizes: {
      sm: string;
      base: string;
      lg: string;
    };
  };
}

// Constantes utiles
export const CHAT_THEMES: Record<string, EnhancedChatTheme> = {
  classic: {
    variant: 'classic',
    colors: {
      primary: 'hsl(var(--primary))',
      secondary: 'hsl(var(--secondary))',
      accent: 'hsl(var(--accent))',
      background: 'hsl(var(--background))',
      border: 'hsl(var(--border))'
    },
    typography: {
      fontFamily: 'Inter, sans-serif',
      sizes: {
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem'
      }
    }
  },
  pinned: {
    variant: 'pinned',
    colors: {
      primary: '#06b6d4',
      secondary: '#0891b2',
      accent: '#22d3ee',
      background: 'rgba(0, 0, 0, 0.8)',
      border: 'rgba(6, 182, 212, 0.3)'
    },
    typography: {
      fontFamily: 'JetBrains Mono, monospace',
      sizes: {
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem'
      }
    }
  }
};