// FICHIER : src/types.ts
import type { z, ZodObject, ZodRawShape } from 'zod';
import type {
  Context as FastMCPContext,
  Tool as FastMCPTool,
  ToolParameters,
} from 'fastmcp';


export interface Message {
  role: 'user' | 'model' | 'tool';
  content: any;
}

export interface SessionData {
  id: string;
  identities: Array<{ id: string; type: string }>;
  history: Message[];
  [key: string]: any;
}

export type Ctx = FastMCPContext<SessionData>;

// CORRIGÉ : Le type Tool utilise 'parameters' pour le schéma,
// et non plus 'schema', pour correspondre à fastmcp.
export type Tool<T extends ZodObject<ZodRawShape> = ZodObject<ZodRawShape>> = Omit<FastMCPTool<SessionData, T>, 'parameters'> & {
    parameters?: T;
};

export interface AgentSession {
  id: string;
  data: SessionData;
}