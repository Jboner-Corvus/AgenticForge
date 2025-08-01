import type { Context as FastMCPContext } from 'fastmcp';
import type { Redis as _Redis } from 'ioredis';

import { Queue } from 'bullmq';
import { Job } from 'bullmq';
import { z, ZodTypeAny } from 'zod';

import { SessionManager } from './modules/session/sessionManager.js';

export interface AgentCanvasOutputMessage {
  content: string;
  contentType: 'html' | 'markdown' | 'text' | 'url';
  id: string;
  timestamp: number;
  type: 'agent_canvas_output';
}

export interface AgentResponseMessage {
  content: string;
  id: string;
  timestamp: number;
  type: 'agent_response';
}

import type { LLMContent } from './modules/llm/llm-types.js';

export interface AgentSession {
  data: SessionData;
  id: string;
}

import { pino } from 'pino';

export type Ctx = {
  job?: MinimalJob;
  llm: ILlmProvider; // <-- AJOUTEZ OU MODIFIEZ CETTE LIGNE
  log: pino.Logger;
  reportProgress?: (progress: {
    current: number;
    total: number;
    unit?: string;
  }) => Promise<void>;
  session?: SessionData;
  streamContent?: (content: any | any[]) => Promise<void>;
  taskQueue: Queue;
} & Omit<FastMCPContext<SessionData>, 'reportProgress' | 'streamContent'>;

export interface ErrorMessage {
  content: string;
  id: string;
  timestamp: number;
  type: 'error';
}

export interface ILlmProvider {
  getErrorType(statusCode: number, errorBody: string): LlmKeyErrorType;
  getLlmResponse(
    messages: LLMContent[],
    systemPrompt?: string,
    apiKey?: string,
    modelName?: string,
  ): Promise<string>;
}

import { LlmKeyErrorType } from './modules/llm/LlmKeyManager.js';

export type Message =
  | AgentCanvasOutputMessage
  | AgentResponseMessage
  | ErrorMessage
  | ThoughtMessage
  | ToolCallMessage
  | ToolResultMessage
  | UserMessage;

export interface MinimalJob {
  data: {
    apiKey?: string;
    llmApiKey?: string;
    llmModelName?: string;
    llmProvider?: string;
    prompt: string;
  };
  id?: string;
  isFailed(): Promise<boolean>;
  name: string;
}

export interface SessionData {
  [key: string]: unknown;
  activeLlmProvider?: string; // New field to store the active LLM provider
  history: Message[];
  identities: Array<{ id: string; type: string }>;
  metadata?: Record<string, unknown>;
  name: string;
  timestamp: number;
  workingContext?: {
    currentFile?: string;
    lastAction?: string;
  };
}

export interface ThoughtMessage {
  content: string;
  id: string;
  timestamp: number;
  type: 'agent_thought';
}

export interface ToolCallMessage {
  id: string;
  params: Record<string, unknown>;
  timestamp: number;
  toolName: string;
  type: 'tool_call';
}

export interface ToolResultMessage {
  id: string;
  result: Record<string, unknown>;
  timestamp: number;
  toolName: string;
  type: 'tool_result';
}

export interface UserMessage {
  content: string;
  id: string;
  timestamp: number;
  type: 'user';
}

declare module 'express' {
  interface Request {
    job?: Job;
    redis?: _Redis; // Add this line
    sessionId?: string;
    sessionManager?: SessionManager;
  }
}

export interface RedisEvent {
  content?: string;
  message?: string;
  toolName?: string; // Added toolName for tool_stream events
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
