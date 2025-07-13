import type { Content, Context as FastMCPContext } from 'fastmcp';

export type { Content };

import { Job, Queue } from 'bullmq';
import { z, ZodTypeAny } from 'zod';

import logger from './logger.js';

export interface AgentProgress {
  current: number;
  total: number;
  unit?: string;
}

export interface AgentSession {
  data: SessionData;
  id: string;
}

export type Ctx = {
  job?: Job;
  log: typeof logger;
  reportProgress?: (progress: AgentProgress) => Promise<void>;
  session?: SessionData;
  streamContent?: (content: Content | Content[]) => Promise<void>;
  taskQueue: Queue;
} & Omit<FastMCPContext<SessionData>, 'reportProgress' | 'streamContent'>;

export interface Message {
  content: string;
  role: 'model' | 'tool' | 'user';
}

export interface SessionData {
  [key: string]: unknown;
  history: Message[];
  id: string;
  identities: Array<{ id: string; type: string }>;
  workingContext?: {
    currentFile?: string;
    lastAction?: string;
  };
}

declare module 'express' {
  interface Request {
    sessionId?: string;
  }
}

export interface Tool<
  T extends z.AnyZodObject = z.AnyZodObject,
  U extends ZodTypeAny = ZodTypeAny,
> {
  description: string;
  execute: (
    args: z.infer<T>,
    context: Ctx,
  ) => Promise<string | void | z.infer<U>>;
  name: string;
  output?: U;
  parameters: T;
}
