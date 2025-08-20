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

// Unified interface compatible with llmKeysStore.ts
export interface LlmApiKey {
  id: string;
  providerId: string;
  providerName: string;
  keyName: string; // Keep keyName for consistency
  keyValue: string;
  isEncrypted: boolean;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
  lastUsed?: string;
  usageCount: number;
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  usageStats?: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    lastUsed?: string;
    averageResponseTime: number;
    errorRate: number;
  };
  metadata: {
    environment: 'universal';
    tags: string[];
    description?: string;
  };
  
  // Legacy compatibility fields
  provider?: string; // alias for providerId
  key?: string; // alias for keyValue
  nickname?: string; // alias for keyName
  baseUrl?: string;
  model?: string;
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