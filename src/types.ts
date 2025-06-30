// FICHIER : src/types.ts
import type { z, ZodObject, ZodRawShape } from 'zod';
import type {
  Context as FastMCPContext,
  Tool as FastMCPTool,
  SessionData as FastMCPSessionAuth,
} from 'fastmcp';
import type { Logger } from 'pino';

export interface Message {
  role: 'user' | 'model' | 'tool';
  content: any;
}

export interface SessionData extends FastMCPSessionAuth {
  history: Message[];
  [key: string]: any;
}

export type Ctx = FastMCPContext<SessionData>;

// CORRIGÉ : Le type Tool utilise 'parameters' pour le schéma,
// et non plus 'schema', pour correspondre à fastmcp.
export type Tool<T extends ZodObject<ZodRawShape> = ZodObject<ZodRawShape>> = Omit<FastMCPTool<T, SessionData>, 'parameters'> & {
    parameters?: T;
};

export interface AgentSession {
  id: string;
  data: SessionData;
}