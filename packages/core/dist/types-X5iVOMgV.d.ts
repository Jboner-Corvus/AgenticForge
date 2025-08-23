import { Context } from 'fastmcp';
import { Redis } from 'ioredis';
import { Job, Queue } from 'bullmq';
import { z, ZodTypeAny } from 'zod';
import { Client } from 'pg';
import { pino } from 'pino';

type Session = SessionData;
declare class SessionManager {
    private static activeSessions;
    private pgClient;
    private constructor();
    static clearActiveSessionsForTest(): void;
    static create(pgClient: Client): Promise<SessionManager>;
    private static createToolContext;
    private static summarizeHistory;
    deleteSession(sessionId: string): Promise<void>;
    getAllSessions(): Promise<SessionData[]>;
    getSession(sessionId: string): Promise<SessionData>;
    renameSession(sessionId: string, newName: string): Promise<SessionData>;
    saveSession(session: SessionData, job: Job | undefined, taskQueue: Queue): Promise<void>;
    private initDb;
}

type LlmKeyErrorType = 'permanent' | 'temporary';
declare const LlmKeyErrorType: {
    PERMANENT: "permanent";
    TEMPORARY: "temporary";
};

interface ILlmProvider$1 {
    getErrorType(statusCode: number, errorBody: string): LlmKeyErrorType;
    getLlmResponse(messages: LLMContent[], systemPrompt?: string, apiKey?: string, modelName?: string): Promise<string>;
}
interface LlmApiKey {
    apiKey: string;
    apiModel: string;
    apiProvider: string;
    baseUrl?: string;
    errorCount: number;
    isDisabledUntil?: number;
    isPermanentlyDisabled?: boolean;
    lastUsed?: number;
}
interface LLMContent {
    parts: {
        text: string;
    }[];
    role: 'model' | 'tool' | 'user';
}
declare class LlmError extends Error {
    constructor(message: string);
}

interface AgentCanvasOutputMessage {
    content: string;
    contentType: 'html' | 'markdown' | 'text' | 'url';
    id: string;
    timestamp: number;
    type: 'agent_canvas_output';
}
interface AgentResponseMessage {
    content: string;
    id: string;
    timestamp: number;
    type: 'agent_response';
}

interface AgentSession {
    data: SessionData;
    id: string;
}

type Ctx = {
    job?: MinimalJob;
    llm: ILlmProvider;
    log: pino.Logger;
    reportProgress?: (progress: {
        current: number;
        total: number;
        unit?: string;
    }) => Promise<void>;
    session?: SessionData;
    streamContent?: (content: any | any[]) => Promise<void>;
    taskQueue: Queue;
} & Omit<Context<SessionData>, 'reportProgress' | 'streamContent'>;
interface ErrorMessage {
    content: string;
    id: string;
    timestamp: number;
    type: 'error';
}
interface ILlmProvider {
    getErrorType(statusCode: number, errorBody: string): LlmKeyErrorType;
    getLlmResponse(messages: LLMContent[], systemPrompt?: string, apiKey?: string, modelName?: string): Promise<string>;
}

type Message = AgentCanvasOutputMessage | AgentResponseMessage | ErrorMessage | ThoughtMessage | ToolCallMessage | ToolResultMessage | UserMessage;
interface MinimalJob {
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
interface SessionData {
    [key: string]: unknown;
    activeLlmProvider?: string;
    history: Message[];
    identities: Array<{
        id: string;
        type: string;
    }>;
    metadata?: Record<string, unknown>;
    name: string;
    status?: string;
    timestamp: number;
    workingContext?: {
        currentFile?: string;
        lastAction?: string;
    };
}
interface ThoughtMessage {
    content: string;
    id: string;
    timestamp: number;
    type: 'agent_thought';
}
interface ToolCallMessage {
    id: string;
    params: Record<string, unknown>;
    timestamp: number;
    toolName: string;
    type: 'tool_call';
}
interface ToolResultMessage {
    id: string;
    result: Record<string, unknown>;
    timestamp: number;
    toolName: string;
    type: 'tool_result';
}
interface UserMessage {
    content: string;
    id: string;
    timestamp: number;
    type: 'user';
}
declare module 'express' {
    interface Request {
        job?: Job;
        redis?: Redis;
        sessionId?: string;
        sessionManager?: SessionManager;
    }
}
interface Tool<T extends z.AnyZodObject = z.AnyZodObject, U extends z.ZodTypeAny = ZodTypeAny> {
    description: string;
    execute: (args: z.infer<T>, context: Ctx) => Promise<string | void | z.infer<U>>;
    name: string;
    output?: U;
    parameters: T;
}

export { type AgentSession as A, type Ctx as C, type ILlmProvider$1 as I, LlmKeyErrorType as L, SessionManager as S, type Tool as T, type SessionData as a, type LlmApiKey as b, type LLMContent as c, LlmError as d, type Session as e };
