import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().int().positive(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'fatal']),
  AUTH_TOKEN: z.string().min(1, 'AUTH_TOKEN is required'),
  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.coerce.number().int().positive(),
  REDIS_PASSWORD: z.string().min(1, 'REDIS_PASSWORD is required'),
  LLM_API_BASE_URL: z.string().url().optional(),
  LLM_API_KEY: z.string().min(1, 'LLM_API_KEY is required'),
  LLM_MODEL_NAME: z.string().min(1, 'LLM_MODEL_NAME is required'),
  PYTHON_SANDBOX_IMAGE: z.string().min(1),
  BASH_SANDBOX_IMAGE: z.string().min(1),
  CODE_EXECUTION_TIMEOUT_MS: z.coerce.number().int().min(1000), // Virgule manquante ajoutée ici
  // AJOUTS POUR CORRIGER LES ERREURS DE TYPE
  SEARXNG_URL: z.string().url().optional(),
  WORKER_CONCURRENCY: z.coerce.number().int().positive().default(5),
  WEBHOOK_SECRET: z.string().optional(),
});

const parsedConfig = envSchema.safeParse(process.env);
if (!parsedConfig.success) {
  console.error('❌ Invalid environment variables:', parsedConfig.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables.');
}
export const config = parsedConfig.data;
