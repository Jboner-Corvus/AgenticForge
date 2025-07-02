// FICHIER : src/config.ts
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  CODE_EXECUTION_TIMEOUT_MS: z.coerce.number().default(60000),
  HOST_PROJECT_PATH: z.string().default('/usr/src/app'),
  LLM_API_KEY: z.string().optional(),
  LLM_MODEL_NAME: z.string().default('gemini-pro'),
  MCP_API_KEY: z.string().optional(),
  MCP_WEBHOOK_URL: z.string().optional(),
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(3001),
  PYTHON_SANDBOX_IMAGE: z.string().default('python:3.11-slim-bullseye'),
  QUALITY_GATE_API_KEY: z.string().optional(),
  QUALITY_GATE_URL: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  WEBHOOK_SECRET: z.string().optional(),
  WORKER_CONCURRENCY: z.coerce.number().default(5),
});

// CORRIGÉ : Un seul export nommé 'config' pour toute l'application.
export const config = configSchema.parse(process.env);