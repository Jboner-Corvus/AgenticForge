// FICHIER : src/config.ts
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(3001),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  WORKER_CONCURRENCY: z.coerce.number().default(5),
  LLM_MODEL_NAME: z.string().default('gemini-pro'),
  LLM_API_KEY: z.string().optional(),
  MCP_WEBHOOK_URL: z.string().url().optional(),
  MCP_API_KEY: z.string().optional(),
  HOST_PROJECT_PATH: z.string().optional(),
  PYTHON_SANDBOX_IMAGE: z.string().optional(),
  CODE_EXECUTION_TIMEOUT_MS: z.coerce.number().default(60000),
  WEBHOOK_SECRET: z.string().optional(),
});

const parsedConfig = configSchema.parse(process.env);

// Exporter l'objet de configuration complet par défaut
export default parsedConfig;

// Exporter également chaque constante nommée pour les imports destructurés
export const {
  NODE_ENV,
  PORT,
  REDIS_HOST,
  REDIS_PORT,
  WORKER_CONCURRENCY,
  LLM_MODEL_NAME,
  LLM_API_KEY,
  MCP_WEBHOOK_URL,
  MCP_API_KEY,
  HOST_PROJECT_PATH,
  PYTHON_SANDBOX_IMAGE,
  CODE_EXECUTION_TIMEOUT_MS,
  WEBHOOK_SECRET
} = parsedConfig;