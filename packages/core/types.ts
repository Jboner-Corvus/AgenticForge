import type {
  Context as FastMCPContext,
  Tool as FastMCPTool,
  ToolParameters,
} from 'fastmcp';
// FICHIER : src/types.ts
import type { z, ZodObject, ZodRawShape } from 'zod';

import { Queue } from 'bullmq';

export interface AgentSession {
  data: SessionData;
  id: string;
}

export type Ctx = FastMCPContext<SessionData>;

export interface Message {
  content: string;
  role: 'model' | 'tool' | 'user';
}

export interface SessionData {
  [key: string]: any;
  history: Message[];
  id: string;
  identities: Array<{ id: string; type: string }>;
}

// CORRIGÉ : Le type Tool utilise 'parameters' pour le schéma,
// et non plus 'schema', pour correspondre à fastmcp.
export type Tool<T extends ZodObject<ZodRawShape> = ZodObject<ZodRawShape>> =
  FastMCPTool<SessionData, T>;
