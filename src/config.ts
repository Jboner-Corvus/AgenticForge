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
});

// CORRIGÉ : Un seul export nommé 'config' pour toute l'application.
export const config = configSchema.parse(process.env);