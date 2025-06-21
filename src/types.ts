// ===== src/types.ts =====
import type { ZodObject, ZodRawShape } from 'zod';
import type {
  FastMCPSession,
  Context as FastMCPCtx,
  Tool as FastMCPTool,
} from 'fastmcp';
import type { Job } from 'bullmq';

// Données d'authentification
export interface AuthData {
  id: string;
  type: string;
  clientIp?: string;
  authenticatedAt: number;
}

// Session de l'agent. Doit être compatible avec les contraintes de FastMCP.
export interface AgentSession extends FastMCPSession {
  history: { role: 'user' | 'assistant'; content: string }[];
  auth: AuthData;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Requis par FastMCP pour des propriétés dynamiques
}

// Contexte (Ctx)
export type Ctx = FastMCPCtx<AgentSession>;

// Tool
export type Tool<T extends ZodObject<ZodRawShape> = ZodObject<ZodRawShape>> =
  FastMCPTool<AgentSession, T>;

// Charge utile des tâches asynchrones
export interface AsyncTaskJobPayload<TParams = Record<string, unknown>> {
  params: TParams;
  auth: AuthData | undefined;
  taskId: string;
  toolName: string;
  cbUrl?: string;
}

// Job BullMQ
export type AsyncTaskJob = Job<AsyncTaskJobPayload, unknown, string>;
