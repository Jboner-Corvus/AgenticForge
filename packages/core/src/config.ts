// FICHIER : packages/core/src/config.ts
import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Résout correctement le chemin vers le fichier .env à la racine du projet.
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const configSchema = z.object({
  AGENT_MAX_ITERATIONS: z.coerce.number().default(10),
  CODE_EXECUTION_TIMEOUT_MS: z.coerce.number().default(60000),
  CONTAINER_MEMORY_LIMIT: z.string().default('2g'),
  HISTORY_MAX_LENGTH: z.coerce.number().default(20),
  HOST_PROJECT_PATH: z.string().default('/usr/src/app'),
  LLM_API_KEY: z.string().optional(),
  LLM_MODEL_NAME: z.string().default('gemini-pro'),
  LLM_PROVIDER: z.string().default('gemini'),
  MCP_API_KEY: z.string().optional(),
  MCP_WEBHOOK_URL: z.string().optional(),
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(3001),

  QUALITY_GATE_API_KEY: z.string().optional(),
  QUALITY_GATE_URL: z.string().optional(),
  REDIS_HOST: z.string().default(process.env.REDIS_HOST || 'localhost'),
  // CORRECTION : La valeur par défaut est maintenant alignée sur la configuration de Docker.
  REDIS_PORT: z.coerce.number().default(Number(process.env.REDIS_PORT) || 6379),
  TAVILY_API_KEY: z.string().optional(),
  WEBHOOK_SECRET: z.string().optional(),
  WORKER_CONCURRENCY: z.coerce.number().default(5),
});

export const config = configSchema.parse(process.env);
