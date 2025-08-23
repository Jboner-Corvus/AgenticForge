import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
// FICHIER : packages/core/src/config.ts
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configSchema = z.object({
  AGENT_MAX_ITERATIONS: z.coerce.number().default(100),
  AUTH_TOKEN: z.string().optional(),
  CODE_EXECUTION_TIMEOUT_MS: z.coerce.number().default(60000),
  CONTAINER_MEMORY_LIMIT: z.string().default('2g'),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GROK_API_KEY: z.string().optional(),
  HISTORY_LOAD_LENGTH: z.coerce.number().default(200), // Load more messages to preserve context
  HISTORY_MAX_LENGTH: z.coerce.number().default(1000),
  HOST_PROJECT_PATH: z.string().default(process.cwd()),

  HUGGINGFACE_API_KEY: z.string().optional(),
  JWT_REFRESH_SECRET: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  LLM_API_KEY: z.string().optional(), // Added LLM_API_KEY
  LLM_MODEL_NAME: z.string().default('gemini-2.5-pro'),
  LLM_PROVIDER: z
    .enum([
      'gemini',
      'openai',
      'mistral',
      'huggingface',
      'grok',
      'openrouter',
      'qwen',
    ])
    .default('gemini'),
  LLM_PROVIDER_HIERARCHY: z
    .string()
    .default('huggingface,grok,gemini,openai,mistral,openrouter,qwen')
    .transform((str) => str.split(',').map((s) => s.trim())),
  LLM_REQUEST_DELAY_MS: z.coerce.number().default(1000), // Reduced delay for better performance
  LOG_LEVEL: z.string().default('debug'),
  MAX_FILE_SIZE_BYTES: z.coerce.number().default(10 * 1024 * 1024), // 10 MB
  MCP_API_KEY: z.string().optional(),
  MCP_WEBHOOK_URL: z.string().optional(),
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(3001),
  POSTGRES_DB: z.string().default('gforge'),
  POSTGRES_HOST: z.string().default('postgres'),
  POSTGRES_PASSWORD: z.string().optional(),

  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_USER: z.string().default('user'),
  QUALITY_GATE_API_KEY: z.string().optional(),
  QUALITY_GATE_URL: z.string().optional(),
  QWEN_API_BASE_URL: z.string().optional(), // Add Qwen base URL support

  QWEN_CLIENT_ID: z.string().optional(),
  QWEN_CLIENT_SECRET: z.string().optional(),
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
  WORKER_MAX_STALLED_COUNT: z.coerce.number().default(3),
  WORKER_STALLED_INTERVAL_MS: z.coerce.number().default(30000), // 30 seconds
  WORKER_WORKSPACE_PATH: z.string().optional(),
  // Standardized workspace path
  WORKSPACE_PATH: z.string().default('/home/demon/agentforge/workspace'),
});

export type Config = z.infer<typeof configSchema>;

export let config: Config = {} as Config;

export function getConfig(): Config {
  return config;
}

export async function loadConfig() {
  // Always load .env file to ensure consistent configuration across environments
  // The NODE_ENV check was removed to allow .env variables to be used in tests.
  // If specific test configurations are needed, they should be managed via test-specific .env files or direct environment variable setting in test scripts.
  console.log('DEBUG: process.cwd():', process.cwd());
  const envPath = path.resolve(__dirname, '..', '..', '..', '.env');
  console.log('DEBUG: Resolved .env path:', envPath);
  const result = dotenv.config({
    path: envPath,
  });

  if (result.error) {
    console.warn(
      'Could not find .env file, using environment variables only.',
      result.error,
    );
  } else if (result.parsed) {
    console.log(
      'DEBUG: .env file loaded successfully. Keys loaded:',
      Object.keys(result.parsed),
    );
  } else {
    console.log(
      'DEBUG: .env file loaded, but no keys parsed (might be empty or malformed).',
    );
  }

  config = configSchema.parse(process.env);
  console.log('Resolved WORKSPACE_PATH:', config.WORKSPACE_PATH);
  console.log('process.env.REDIS_HOST:', process.env.REDIS_HOST);
  console.log('config.REDIS_HOST:', config.REDIS_HOST);
  console.log('config.LLM_API_KEY:', config.LLM_API_KEY);
}

// Initial load is now handled by the application's entry point (e.g., server-start.ts)
// This prevents asynchronous operations from blocking module loading during tests.
