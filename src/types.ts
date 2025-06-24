/**
 * src/types.ts (Corrigé pour FastMCP)
 *
 * Ce fichier définit les types et interfaces partagés dans l'application.
 */
import type { ZodObject, ZodRawShape } from 'zod';
import type { Context as FastMCPContext, Tool as FastMCPTool } from 'fastmcp';
import type { IncomingHttpHeaders } from 'http';

// L'historique de la conversation, utilisé par l'orchestrateur de l'agent.
export type History = { role: 'user' | 'assistant'; content: string }[];

/**
 * Interface pour les données de session FastMCP
 * Cette interface doit satisfaire la contrainte Record<string, unknown>
 */
export interface SessionData extends Record<string, unknown> {
  sessionId: string;
  // CORRECTION: Headers will be stored as a simple, serializable record.
  headers: Record<string, string>; 
  clientIp?: string;
  authenticatedAt: number;
}

/**
 * Notre objet de session applicatif.
 */
export interface AgentSession {
  id: string; // L'ID de session
  auth: SessionData; // Changé de AuthData vers SessionData
  history: History;
  createdAt: number;
  lastActivity: number;
}

// Contexte (Ctx) fourni par FastMCP. Il contiendra notre SessionData.
export type Ctx = FastMCPContext<SessionData>;

// Définition d'un outil. Le contexte est maintenant correctement typé avec SessionData.
export type Tool<T extends ZodObject<ZodRawShape> = ZodObject<ZodRawShape>> =
  FastMCPTool<SessionData, T>;

// Types pour les tâches asynchrones
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
  auth?: SessionData; // Changé de AuthData vers SessionData
  taskId: string;
  toolName: string;
  cbUrl?: string;
}

// Conservé pour la compatibilité avec l'ancien code si nécessaire
export type AuthData = SessionData;