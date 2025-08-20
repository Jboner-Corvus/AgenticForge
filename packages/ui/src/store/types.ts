// Types communs pour tous les stores
import type { ChatMessage as ExternalChatMessage } from '../types/chat.d';

export type StoreChatMessage = ExternalChatMessage;

export interface Session {
  id: string;
  name: string;
  messages: ExternalChatMessage[];
  timestamp: number;
  status?: string;
}

export interface LlmApiKey {
  provider: string;
  key: string;
  nickname: string; // Remplacer keyName par nickname et le rendre obligatoire
  createdAt: number; // Timestamp de la date d'ajout
  baseUrl?: string;
  model?: string;
  // Ajout des propriétés pour le classement
  providerName?: 'openai' | 'anthropic' | 'google' | 'openrouter';
  keyValue?: string;
  usageStats?: {
    totalRequests: number;
    successfulRequests: number;
  };
}

// Interface pour les clés API retournées par le backend
export interface BackendLlmApiKey {
  apiKey: string;
  apiModel: string;
  apiProvider: string;
  baseUrl?: string;
  errorCount: number;
  isDisabledUntil?: number;
  isPermanentlyDisabled?: boolean;
  lastUsed?: number;
  priority?: number;
}

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

import type { CanvasType } from './canvasStore';

export interface CanvasHistoryItem {
  id: string;
  title: string;
  content: string;
  type: CanvasType;
  timestamp: number;
}

export interface LeaderboardStats {
  tokensSaved: number;
  successfulRuns: number;
  sessionsCreated: number;
  apiKeysAdded: number;
}

export type PageType = 'chat' | 'leaderboard' | 'llm-api-keys' | 'oauth';
export type SessionStatus = 'error' | 'unknown' | 'valid';