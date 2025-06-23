/**
 * src/types.ts (Formaté)
 *
 * Ce fichier définit les types et interfaces partagés dans l'application.
 */
import type { ZodObject, ZodRawShape } from 'zod';
import type { Context as FastMCPContext, Tool as FastMCPTool } from 'fastmcp';

// L'historique de la conversation, utilisé par l'orchestrateur de l'agent.
export type History = { role: 'user' | 'assistant'; content: string }[];

/**
 * Les données d'authentification. C'est le type qui sera passé au générique de FastMCP.
 * Il doit respecter la contrainte `Record<string, unknown>`.
 */
export interface AuthData {
  id: string; // Un UUID pour l'événement d'authentification lui-même
  sessionId: string; // L'ID de session persistant
  type: string;
  clientIp?: string;
  authenticatedAt: number;
  [key: string]: unknown; // CORRIGÉ: any a été remplacé par unknown pour la sécurité du type.
}

/**
 * Notre objet de session applicatif.
 * C'est une interface simple, elle n'étend plus FastMCPSession.
 */
export interface AgentSession {
  id: string; // L'ID de session
  auth: AuthData;
  history: History;
  createdAt: number;
  lastActivity: number;
}

// Contexte (Ctx) fourni par FastMCP. Il contiendra notre AuthData.
export type Ctx = FastMCPContext<AuthData>;

// Définition d'un outil. Le contexte est maintenant correctement typé avec AuthData.
export type Tool<T extends ZodObject<ZodRawShape> = ZodObject<ZodRawShape>> =
  FastMCPTool<AuthData, T>;

// ... (Le reste du fichier est inchangé)
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
