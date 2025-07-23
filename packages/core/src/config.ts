import path from 'path';
// FICHIER : packages/core/src/config.ts
import { z } from 'zod';

// Résout correctement le chemin vers le fichier .env à la racine du projet.
// const envPath = path.resolve(process.cwd(), '../../.env');
// const result = dotenv.config({ path: envPath });

// if (result.error) {
//   console.warn('Could not find .env file, using environment variables only.');
// }

const configSchema = z.object({
  AGENT_MAX_ITERATIONS: z.coerce.number().default(10),
  AUTH_API_KEY: z.string().optional(),
  CODE_EXECUTION_TIMEOUT_MS: z.coerce.number().default(60000),
  CONTAINER_MEMORY_LIMIT: z.string().default('2g'),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  HISTORY_MAX_LENGTH: z.coerce.number().default(1000),
  HOST_PROJECT_PATH: z.string().default('/usr/src/app'),
  LLM_MODEL_NAME: z.string().default('gemini-pro'),
  LLM_PROVIDER: z
    .enum(['gemini', 'openai', 'mistral', 'huggingface'])
    .default('gemini'),
  MCP_API_KEY: z.string().optional(),
  MCP_WEBHOOK_URL: z.string().optional(),
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(3001),

  QUALITY_GATE_API_KEY: z.string().optional(),
  QUALITY_GATE_URL: z.string().optional(),
  REDIS_DB: z.coerce.number().default(0),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PASSWORD: z.string().optional(),
  // CORRECTION : La valeur par défaut est maintenant alignée sur la configuration de Docker.
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_URL: z.string().optional(),
  TAVILY_API_KEY: z.string().optional(),
  WEBHOOK_SECRET: z.string().optional(),
  WORKER_CONCURRENCY: z.coerce.number().default(5),
  WORKSPACE_PATH: z.string().default(path.resolve(process.cwd(), 'workspace')),
});

console.log('Current working directory:', process.cwd());
export const config = configSchema.parse(process.env);

console.log('Resolved WORKSPACE_PATH:', config.WORKSPACE_PATH);
