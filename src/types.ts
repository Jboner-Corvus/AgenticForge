import type {
  FastMCPSession,
  Context as FastMCPCtx,
  Tool as FastMCPTool,
} from 'fastmcp';
import type { Job } from 'bullmq';
import type { z, ZodObject } from 'zod';

// Données d'authentification
export interface AuthData {
  id: string;
  type: string;
  clientIp?: string;
  authenticatedAt: number;
}

// Session de l'agent. Doit être compatible avec les contraintes de FastMCP.
export interface AgentSession extends FastMCPSession {
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  auth: AuthData;
  // Ajout de la signature d'index pour satisfaire la contrainte de FastMCP
  [key: string]: any;
}

// Contexte (Ctx) - Le contexte de FastMCP n'est PAS générique.
export type Ctx = FastMCPCtx<AgentSession>;

// Tool - Le Tool EST générique sur les paramètres de l'outil (le schéma Zod).
export type Tool<
  T extends ZodObject<any, any, any> = ZodObject<any, any, any>,
> = FastMCPTool<AgentSession, T>;

// Charge utile des tâches asynchrones
export interface AsyncTaskJobPayload<TParams = Record<string, unknown>> {
  params: TParams;
  auth: AuthData | undefined;
  taskId: string;
  toolName: string;
  cbUrl?: string;
}

// Job BullMQ
export type AsyncTaskJob = Job<AsyncTaskJobPayload, any, string>;
