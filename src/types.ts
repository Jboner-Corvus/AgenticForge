// src/types.ts
import type { ZodObject, ZodRawShape } from 'zod';
import type { Context as FastMCPContext, Tool as FastMCPTool } from 'fastmcp';
// IncomingHttpHeaders a été retiré car non utilisé directement ici.

export type History = { role: 'user' | 'assistant'; content: string }[];

export interface SessionData extends Record<string, unknown> {
  sessionId: string;
  headers: Record<string, string>;
  clientIp?: string;
  authenticatedAt: number;
}

export interface AgentSession {
  id: string;
  auth: SessionData;
  history: History;
  createdAt: number;
  lastActivity: number;
}

export type Ctx = FastMCPContext<SessionData>;

export type Tool<T extends ZodObject<ZodRawShape> = ZodObject<ZodRawShape>> =
  FastMCPTool<SessionData, T>;

export interface AsyncTaskJobPayload<TParams = Record<string, unknown>> {
  params: TParams;
  auth?: SessionData;
  taskId: string;
  toolName: string;
  cbUrl?: string;
}
