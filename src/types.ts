import type { FastMCPSession, Ctx as FastMCPCtx } from 'fastmcp';
import type { Job } from 'bullmq';

// Extend the base FastMCPSession with our custom history property
export interface AgentSession extends FastMCPSession {
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
}

// Define a Ctx type specific to our application session
export type Ctx = FastMCPCtx<AgentSession>;

// Payload for asynchronous tasks processed by the worker
export interface AsyncTaskPayload {
  toolName: string;
  toolArgs: Record<string, unknown>;
  session: AgentSession;
}

// BullMQ Job type with our specific payload
export type AsyncTaskJob = Job<AsyncTaskPayload, any, string>;
