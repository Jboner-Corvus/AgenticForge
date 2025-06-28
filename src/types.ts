// FICHIER : src/types.ts
import type { z, ZodObject, ZodRawShape } from 'zod';
import type {
  Context as FastMCPContext,
  Tool as FastMCPTool,
  SessionData as FastMCPSessionAuth, // fastmcp nomme son type de session de base ainsi
  TextContent, AudioContent, ImageContent,
} from 'fastmcp';
import type { Logger } from 'pino';

export interface Message {
  role: 'user' | 'model' | 'tool';
  content: any;
}

// CORRIGÉ : L'interface SessionData satisfait maintenant la contrainte de fastmcp
export interface SessionData extends FastMCPSessionAuth {
  history: Message[];
  goal?: string;
  [key: string]: any; // Signature d'index requise pour la compatibilité
}

export type Ctx = FastMCPContext<SessionData>;

// CORRIGÉ : Le type Tool est maintenant correctement générique
export type Tool<T extends ZodObject<ZodRawShape> = ZodObject<ZodRawShape>> = FastMCPTool<
  T,
  SessionData
>;

// Type pour la session globale de l'agent
export interface AgentSession {
  id: string;
  data: SessionData;
}

export interface AsyncTaskJobPayload {
  toolName: string;
  params: Record<string, unknown>;
  auth: SessionData;
  taskId: string;
  cbUrl?: string;
}