/**
 * src/types.ts (Corrigé et Linted)
 *
 * Ce fichier définit les types et interfaces partagés dans l'application.
 * Il a été corrigé pour résoudre les conflits de types et les erreurs de linting.
 */
import type { ZodObject, ZodRawShape } from 'zod';
import type {
  FastMCPSession,
  Context as FastMCPContext,
  Tool as FastMCPTool,
} from 'fastmcp';

// L'historique de la conversation, utilisé par l'orchestrateur de l'agent.
export type History = { role: 'user' | 'assistant'; content: string }[];

// Les données d'authentification.
export interface AuthData {
  id: string;
  type: string;
  clientIp?: string;
  authenticatedAt: number;
}

// Session de l'agent (utilisée côté serveur par FastMCP)
export interface AgentSession extends FastMCPSession {
  history: History;
  [key: string]: unknown;
}

// Contexte (Ctx) fourni par FastMCP à l'intérieur de la méthode `execute` d'un outil.
export type Ctx = FastMCPContext<AgentSession>;

// Définition d'un outil.
// CORRECTION : Remplacement de `any` par `ZodRawShape` pour une meilleure sécurité de type.
export type Tool<T extends ZodObject<ZodRawShape> = ZodObject<ZodRawShape>> =
  FastMCPTool<AgentSession, T>;

// Types pour les tâches asynchrones via BullMQ.
export interface AsyncTaskJob<TParams = Record<string, unknown>> {
  data: AsyncTaskJobPayload<TParams>;
  id?: string;
  name: string;
  opts?: {
    attempts?: number;
  };
  attemptsMade: number;
}
export interface AsyncTaskJobPayload<TParams = Record<string, unknown>> {
  params: TParams;
  auth?: AuthData;
  taskId: string;
  toolName: string;
  cbUrl?: string;
}
