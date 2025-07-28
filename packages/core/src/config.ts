import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
// FICHIER : packages/core/src/config.ts
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configSchema = z.object({
  AGENT_MAX_ITERATIONS: z.coerce.number().default(10),
  AUTH_API_KEY: z.string().optional(),
  CODE_EXECUTION_TIMEOUT_MS: z.coerce.number().default(60000),
  CONTAINER_MEMORY_LIMIT: z.string().default('2g'),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  HISTORY_LOAD_LENGTH: z.coerce.number().default(50), // New config for loading only N recent messages

  HISTORY_MAX_LENGTH: z.coerce.number().default(1000),
  HOST_PROJECT_PATH: z.string().default('/usr/src/app'),
  JWT_SECRET: z.string().optional(),
  LLM_MODEL_NAME: z.string().default('gemini-pro'),
  LLM_PROVIDER: z
    .enum(['gemini', 'openai', 'mistral', 'huggingface'])
    .default('gemini'),
  LOG_LEVEL: z.string().default('debug'),
  MAX_FILE_SIZE_BYTES: z.coerce.number().default(10 * 1024 * 1024), // 10 MB
  MCP_API_KEY: z.string().optional(),
  MCP_WEBHOOK_URL: z.string().optional(),
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(3001),

  POSTGRES_DB: z.string().default('agenticforge'),
  POSTGRES_HOST: z.string().default('postgres'),
  POSTGRES_PASSWORD: z.string().optional(),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_USER: z.string().default('user'),

  QUALITY_GATE_API_KEY: z.string().optional(),
  QUALITY_GATE_URL: z.string().optional(),
  REDIS_DB: z.coerce.number().default(0),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PASSWORD: z.string().optional(),
  // CORRECTION : La valeur par défaut est maintenant alignée sur la configuration de Docker.
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_URL: z.string().optional(),
  SESSION_EXPIRATION: z.coerce.number().default(7 * 24 * 60 * 60), // 7 days in seconds
  TAVILY_API_KEY: z.string().optional(),
  WEBHOOK_SECRET: z.string().optional(),
  WORKER_CONCURRENCY: z.coerce.number().default(5),
  // Utilise process.cwd() pour garantir que le chemin est absolu et fiable
  WORKSPACE_PATH: z.string().default(path.resolve(process.cwd(), 'workspace')),
});

export type Config = z.infer<typeof configSchema>;

export let config: Config;

export function loadConfig() {
  if (process.env.NODE_ENV !== 'test') {
    const result = dotenv.config({
      path: path.resolve(process.cwd(), '.env'),
    });

    if (result.error) {
      console.warn(
        'Could not find .env file, using environment variables only.',
      );
    }
  }

  config = configSchema.parse(process.env);
  console.log('Resolved WORKSPACE_PATH:', config.WORKSPACE_PATH);
}

// Initial load
loadConfig();
