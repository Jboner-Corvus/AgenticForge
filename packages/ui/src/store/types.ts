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
  keyName?: string;
  baseUrl?: string;
  model?: string;
}

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

export interface CanvasHistoryItem {
  id: string;
  title: string;
  content: string;
  type: 'html' | 'markdown' | 'url' | 'text';
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