import type { Context as FastMCPContext } from 'fastmcp';

import { Queue } from 'bullmq';
import { z, ZodTypeAny } from 'zod';

import logger from './logger.js';

export interface AgentSession {
  data: SessionData;
  id: string;
}

export type Ctx = {
  job?: MinimalJob;
  llm: ILlmProvider; // <-- AJOUTEZ OU MODIFIEZ CETTE LIGNE
  log: typeof logger;
  reportProgress?: (progress: {
    current: number;
    total: number;
    unit?: string;
  }) => Promise<void>;
  session?: SessionData;
  streamContent?: (content: any | any[]) => Promise<void>;
  taskQueue: Queue;
} & Omit<FastMCPContext<SessionData>, 'reportProgress' | 'streamContent'>;

import type { LLMContent } from './modules/llm/llm-types.js';

export interface ILlmProvider {
  getLlmResponse(
    messages: LLMContent[],
    systemPrompt?: string,
  ): Promise<string>;
}

export interface Message {
  content: string;
  role: 'model' | 'tool' | 'user';
}

export interface MinimalJob {
  data: unknown;
  id?: string;
  isFailed(): Promise<boolean>;
  name: string;
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

export interface RedisEvent {
  content?: string;
  message?: string;
  type: string;
}

export interface Tool<
  T extends z.AnyZodObject = z.AnyZodObject,
  U extends z.ZodTypeAny = ZodTypeAny,
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

export interface ToolOutput {
  isError: boolean;
  output: unknown;
  toolName: string;
}
