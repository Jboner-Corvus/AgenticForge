import { z } from 'zod';
import { Logger } from 'pino';
export { Logger } from 'pino';
import { Job, Queue } from 'bullmq';
import { a as SessionData, T as Tool, S as SessionManager, A as AgentSession } from './types-C2iGLYUf.js';
export { I as ILlmProvider, c as LLMContent, b as LlmApiKey, d as LlmError, L as LlmKeyErrorType, e as Session } from './types-C2iGLYUf.js';
import IORedis from 'ioredis';
export { getAllTools } from './modules/tools/definitions/index.js';
export { toolRegistry } from './modules/tools/toolRegistry.js';
import { Request, Response, NextFunction } from 'express';
export { getTools } from './utils/toolLoader.js';
export { configWatcher, initializeWebServer } from './webServer.js';
export { initializeWorker, processJob } from './worker.js';
export { FinishToolSignal } from './modules/tools/definitions/system/finish.tool.js';
import 'fastmcp';
import 'pg';
import 'chokidar';
import 'http';

declare const configSchema: z.ZodObject<{
    AGENT_MAX_ITERATIONS: z.ZodDefault<z.ZodNumber>;
    AUTH_TOKEN: z.ZodOptional<z.ZodString>;
    CODE_EXECUTION_TIMEOUT_MS: z.ZodDefault<z.ZodNumber>;
    CONTAINER_MEMORY_LIMIT: z.ZodDefault<z.ZodString>;
    GITHUB_CLIENT_ID: z.ZodOptional<z.ZodString>;
    GITHUB_CLIENT_SECRET: z.ZodOptional<z.ZodString>;
    GROK_API_KEY: z.ZodOptional<z.ZodString>;
    QWEN_CLIENT_ID: z.ZodOptional<z.ZodString>;
    QWEN_CLIENT_SECRET: z.ZodOptional<z.ZodString>;
    HISTORY_LOAD_LENGTH: z.ZodDefault<z.ZodNumber>;
    HISTORY_MAX_LENGTH: z.ZodDefault<z.ZodNumber>;
    HOST_PROJECT_PATH: z.ZodDefault<z.ZodString>;
    HUGGINGFACE_API_KEY: z.ZodOptional<z.ZodString>;
    JWT_SECRET: z.ZodOptional<z.ZodString>;
    JWT_REFRESH_SECRET: z.ZodOptional<z.ZodString>;
    LLM_API_KEY: z.ZodOptional<z.ZodString>;
    LLM_MODEL_NAME: z.ZodDefault<z.ZodString>;
    LLM_PROVIDER: z.ZodDefault<z.ZodEnum<["gemini", "openai", "mistral", "huggingface", "grok", "openrouter", "qwen"]>>;
    LLM_PROVIDER_HIERARCHY: z.ZodEffects<z.ZodDefault<z.ZodString>, string[], string | undefined>;
    LLM_REQUEST_DELAY_MS: z.ZodDefault<z.ZodNumber>;
    LOG_LEVEL: z.ZodDefault<z.ZodString>;
    MAX_FILE_SIZE_BYTES: z.ZodDefault<z.ZodNumber>;
    MCP_API_KEY: z.ZodOptional<z.ZodString>;
    MCP_WEBHOOK_URL: z.ZodOptional<z.ZodString>;
    NODE_ENV: z.ZodDefault<z.ZodString>;
    PORT: z.ZodDefault<z.ZodNumber>;
    POSTGRES_DB: z.ZodDefault<z.ZodString>;
    POSTGRES_HOST: z.ZodDefault<z.ZodString>;
    POSTGRES_PASSWORD: z.ZodOptional<z.ZodString>;
    POSTGRES_PORT: z.ZodDefault<z.ZodNumber>;
    POSTGRES_USER: z.ZodDefault<z.ZodString>;
    QUALITY_GATE_API_KEY: z.ZodOptional<z.ZodString>;
    QUALITY_GATE_URL: z.ZodOptional<z.ZodString>;
    REDIS_DB: z.ZodDefault<z.ZodNumber>;
    REDIS_HOST: z.ZodDefault<z.ZodString>;
    REDIS_PASSWORD: z.ZodOptional<z.ZodString>;
    REDIS_PORT: z.ZodDefault<z.ZodNumber>;
    REDIS_URL: z.ZodOptional<z.ZodString>;
    SESSION_EXPIRATION: z.ZodDefault<z.ZodNumber>;
    TAVILY_API_KEY: z.ZodOptional<z.ZodString>;
    WEBHOOK_SECRET: z.ZodOptional<z.ZodString>;
    WORKER_CONCURRENCY: z.ZodDefault<z.ZodNumber>;
    WORKER_MAX_STALLED_COUNT: z.ZodDefault<z.ZodNumber>;
    WORKER_STALLED_INTERVAL_MS: z.ZodDefault<z.ZodNumber>;
    WORKER_WORKSPACE_PATH: z.ZodOptional<z.ZodString>;
    WORKSPACE_PATH: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    AGENT_MAX_ITERATIONS: number;
    CODE_EXECUTION_TIMEOUT_MS: number;
    CONTAINER_MEMORY_LIMIT: string;
    HISTORY_LOAD_LENGTH: number;
    HISTORY_MAX_LENGTH: number;
    HOST_PROJECT_PATH: string;
    LLM_MODEL_NAME: string;
    LLM_PROVIDER: "gemini" | "openai" | "mistral" | "huggingface" | "grok" | "openrouter" | "qwen";
    LLM_PROVIDER_HIERARCHY: string[];
    LLM_REQUEST_DELAY_MS: number;
    LOG_LEVEL: string;
    MAX_FILE_SIZE_BYTES: number;
    NODE_ENV: string;
    PORT: number;
    POSTGRES_DB: string;
    POSTGRES_HOST: string;
    POSTGRES_PORT: number;
    POSTGRES_USER: string;
    REDIS_DB: number;
    REDIS_HOST: string;
    REDIS_PORT: number;
    SESSION_EXPIRATION: number;
    WORKER_CONCURRENCY: number;
    WORKER_MAX_STALLED_COUNT: number;
    WORKER_STALLED_INTERVAL_MS: number;
    WORKSPACE_PATH: string;
    AUTH_TOKEN?: string | undefined;
    GITHUB_CLIENT_ID?: string | undefined;
    GITHUB_CLIENT_SECRET?: string | undefined;
    GROK_API_KEY?: string | undefined;
    QWEN_CLIENT_ID?: string | undefined;
    QWEN_CLIENT_SECRET?: string | undefined;
    HUGGINGFACE_API_KEY?: string | undefined;
    JWT_SECRET?: string | undefined;
    JWT_REFRESH_SECRET?: string | undefined;
    LLM_API_KEY?: string | undefined;
    MCP_API_KEY?: string | undefined;
    MCP_WEBHOOK_URL?: string | undefined;
    POSTGRES_PASSWORD?: string | undefined;
    QUALITY_GATE_API_KEY?: string | undefined;
    QUALITY_GATE_URL?: string | undefined;
    REDIS_PASSWORD?: string | undefined;
    REDIS_URL?: string | undefined;
    TAVILY_API_KEY?: string | undefined;
    WEBHOOK_SECRET?: string | undefined;
    WORKER_WORKSPACE_PATH?: string | undefined;
}, {
    AGENT_MAX_ITERATIONS?: number | undefined;
    AUTH_TOKEN?: string | undefined;
    CODE_EXECUTION_TIMEOUT_MS?: number | undefined;
    CONTAINER_MEMORY_LIMIT?: string | undefined;
    GITHUB_CLIENT_ID?: string | undefined;
    GITHUB_CLIENT_SECRET?: string | undefined;
    GROK_API_KEY?: string | undefined;
    QWEN_CLIENT_ID?: string | undefined;
    QWEN_CLIENT_SECRET?: string | undefined;
    HISTORY_LOAD_LENGTH?: number | undefined;
    HISTORY_MAX_LENGTH?: number | undefined;
    HOST_PROJECT_PATH?: string | undefined;
    HUGGINGFACE_API_KEY?: string | undefined;
    JWT_SECRET?: string | undefined;
    JWT_REFRESH_SECRET?: string | undefined;
    LLM_API_KEY?: string | undefined;
    LLM_MODEL_NAME?: string | undefined;
    LLM_PROVIDER?: "gemini" | "openai" | "mistral" | "huggingface" | "grok" | "openrouter" | "qwen" | undefined;
    LLM_PROVIDER_HIERARCHY?: string | undefined;
    LLM_REQUEST_DELAY_MS?: number | undefined;
    LOG_LEVEL?: string | undefined;
    MAX_FILE_SIZE_BYTES?: number | undefined;
    MCP_API_KEY?: string | undefined;
    MCP_WEBHOOK_URL?: string | undefined;
    NODE_ENV?: string | undefined;
    PORT?: number | undefined;
    POSTGRES_DB?: string | undefined;
    POSTGRES_HOST?: string | undefined;
    POSTGRES_PASSWORD?: string | undefined;
    POSTGRES_PORT?: number | undefined;
    POSTGRES_USER?: string | undefined;
    QUALITY_GATE_API_KEY?: string | undefined;
    QUALITY_GATE_URL?: string | undefined;
    REDIS_DB?: number | undefined;
    REDIS_HOST?: string | undefined;
    REDIS_PASSWORD?: string | undefined;
    REDIS_PORT?: number | undefined;
    REDIS_URL?: string | undefined;
    SESSION_EXPIRATION?: number | undefined;
    TAVILY_API_KEY?: string | undefined;
    WEBHOOK_SECRET?: string | undefined;
    WORKER_CONCURRENCY?: number | undefined;
    WORKER_MAX_STALLED_COUNT?: number | undefined;
    WORKER_STALLED_INTERVAL_MS?: number | undefined;
    WORKER_WORKSPACE_PATH?: string | undefined;
    WORKSPACE_PATH?: string | undefined;
}>;
type Config = z.infer<typeof configSchema>;
declare let config: Config;
declare function getConfig(): Config;
declare function loadConfig(): Promise<void>;

declare function getLogger(): Logger;
declare const getLoggerInstance: typeof getLogger;
declare function resetLoggerForTesting(): void;

declare class Agent {
    private readonly llmModelName?;
    private readonly llmApiKey?;
    private activeLlmProvider;
    private apiKey?;
    private commandHistory;
    private interrupted;
    private readonly job;
    private readonly log;
    private loopCounter;
    private malformedResponseCounter;
    private readonly session;
    private readonly sessionManager;
    private subscriber;
    private readonly taskQueue;
    private behaviorHistory;
    private readonly maxBehaviorHistory;
    private loopDetectionThreshold;
    private readonly tools;
    constructor(job: Job<{
        apiKey?: string;
        llmApiKey?: string;
        llmModelName?: string;
        llmProvider?: string;
        prompt: string;
    }>, session: SessionData, taskQueue: Queue, tools: Tool<z.AnyZodObject, z.ZodTypeAny>[], activeLlmProvider: string, sessionManager: SessionManager, apiKey?: string, llmModelName?: string | undefined, // New property
    llmApiKey?: string | undefined);
    run(): Promise<string>;
    private cleanup;
    private executeTool;
    private extractJsonFromMarkdown;
    private parseLlmResponse;
    /**
     * Converts plain text responses to valid JSON format when the LLM doesn't follow the required format
     * This handles cases where the LLM responds with plain text instead of JSON
     */
    private convertPlainTextToValidJson;
    private publishToChannel;
    private detectLoop;
    private calculateTextSimilarity;
    private setupInterruptListener;
}

declare const getMasterPrompt: (session: AgentSession, tools: Tool[]) => string;

interface AsyncTaskJobPayload<TParams> {
    auth: SessionData | undefined;
    cbUrl?: string;
    params: TParams;
    taskId: string;
    toolName: string;
}
declare function getDeadLetterQueue(): Queue;
declare function getJobQueue(): Queue;

declare const getRedisClientInstance: () => IORedis;
declare const setRedisClientInstance: (client: IORedis | null) => void;
declare const disconnectRedis: () => Promise<void>;

declare abstract class FastMCPError extends Error {
  constructor(message?: string);
}
declare class AppError extends FastMCPError {
  details?: undefined | unknown;
  constructor(message: string, details?: undefined | unknown);
}
declare class WebhookError extends AppError {}
declare const handleError: (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => void;
interface ErrorDetails {
  message: string;
  name: string;
  stack?: string;
}
declare const getErrDetails: (err: unknown) => ErrorDetails;
declare class EnqueueTaskError extends AppError {
  details?: undefined | unknown;
  constructor(message: string, details?: undefined | unknown);
}
declare class UnexpectedStateError extends FastMCPError {
  extras?: unknown;
  constructor(message: string, extras?: unknown);
}
/**
 * An error that is meant to be surfaced to the user.
 */
declare class UserError extends UnexpectedStateError {}

interface EnqueueParams<TParams> {
  auth: SessionData | undefined;
  cbUrl?: string;
  params: TParams;
  taskId: string;
  toolName: string;
}
interface TaskOutcome<TParams, TResult> {
  error?: ErrorDetails;
  inParams: TParams;
  msg: string;
  progress?: {
    current: number;
    total: number;
    unit?: string;
  };
  result?: TResult;
  status: 'completed' | 'error' | 'processing';
  taskId: string;
  ts: string;
}
declare function enqueueTask<TParams extends Record<string, unknown>>(
  args: EnqueueParams<TParams>,
): Promise<string | undefined>;

/**
 * Codes de couleur ANSI pour la journalisation thématique.
 * Utilisés pour améliorer la lisibilité des logs en console.
 */
declare const ANSI_COLORS: {
  BLUE: string;
  CYAN: string;
  GREEN: string;
  LIGHT_BLUE: string;
  MAGENTA: string;
  RED: string;
  RESET: string;
  YELLOW: string;
};
/**
 * Nom de la variable d'environnement pour le secret de signature des webhooks.
 * Ce secret est utilisé pour générer et vérifier les signatures HMAC des webhooks.
 */
declare const WEBHOOK_SIGNATURE_HEADER = 'X-Webhook-Signature-256';
declare const WEBHOOK_SECRET_ENV_VAR = 'WEBHOOK_SECRET';
/**
 * Durée maximale de la trace de la pile (stack trace) dans les logs d'erreur.
 * Permet de limiter la verbosité tout en conservant des informations utiles.
 */
declare const ERROR_STACK_TRACE_MAX_LENGTH = 250;
/**
 * Options par défaut pour la file d'attente BullMQ.
 * Utilisées pour configurer les tentatives, le backoff, et la suppression des tâches.
 */
declare const DEFAULT_BULLMQ_JOB_OPTIONS: {
  attempts: number;
  backoff: {
    delay: number;
    type: string;
  };
  removeOnComplete: {
    age: number;
    count: number;
  };
  removeOnFail: {
    age: number;
    count: number;
  };
};
/**
 * Noms des files d'attente BullMQ.
 */
declare const TASK_QUEUE_NAME = 'async-tasks';
declare const DEAD_LETTER_QUEUE_NAME = 'dead-letter-tasks';
/**
 * Configuration par défaut pour le mécanisme de ping de FastMCP.
 */
declare const DEFAULT_PING_OPTIONS: {
  enabled: boolean;
  intervalMs: number;
  logLevel: 'debug';
};
/**
 * Configuration par défaut pour le health check de FastMCP.
 */
declare const DEFAULT_HEALTH_CHECK_OPTIONS: {
  enabled: boolean;
  message: string;
  path: string;
  status: number;
};

interface QualityResult {
  output: string;
  success: boolean;
}
/**
 * Exécute une série de vérifications de qualité (types, format, lint) dans un sandbox Docker.
 * @returns Un objet indiquant si toutes les vérifications ont réussi et la sortie combinée.
 */
declare function runQualityGate(): Promise<QualityResult>;

/**
 * Valide si une chaîne de caractères est une URL HTTP/HTTPS valide.
 * @param urlString La chaîne à valider.
 * @param context Un contexte optionnel pour la journalisation (ex: nom de la fonction appelante).
 * @returns `true` si l'URL est valide, `false` sinon.
 */
declare function isValidHttpUrl(
  urlString: null | string | undefined,
  context?: string,
): boolean;
declare function validateApiKey(
  apiKey: string | undefined,
  expectedApiKey: string | undefined,
): boolean;
declare function validateWebhook(
  payload: string,
  signature: string,
  secret: string,
): boolean;

export { ANSI_COLORS, Agent, AppError, type AsyncTaskJobPayload, type Config, DEAD_LETTER_QUEUE_NAME, DEFAULT_BULLMQ_JOB_OPTIONS, DEFAULT_HEALTH_CHECK_OPTIONS, DEFAULT_PING_OPTIONS, ERROR_STACK_TRACE_MAX_LENGTH, type EnqueueParams, EnqueueTaskError, type ErrorDetails, SessionManager, TASK_QUEUE_NAME, type TaskOutcome, UnexpectedStateError, UserError, WEBHOOK_SECRET_ENV_VAR, WEBHOOK_SIGNATURE_HEADER, WebhookError, config, disconnectRedis, enqueueTask, getConfig, getDeadLetterQueue, getErrDetails, getJobQueue, getLogger, getLoggerInstance, getMasterPrompt, getRedisClientInstance, handleError, isValidHttpUrl, loadConfig, resetLoggerForTesting, runQualityGate, setRedisClientInstance, validateApiKey, validateWebhook };
