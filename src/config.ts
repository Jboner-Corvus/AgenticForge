import 'dotenv/config';
import { z } from 'zod';

// Define the schema structure in a separate object.
const schemaDefinition = {
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
  LOG_LEVEL: z
    .enum(['debug', 'info', 'warn', 'error', 'fatal'])
    .default('info'),
  AUTH_TOKEN: z.string().min(1, 'AUTH_TOKEN is required'),
  REDIS_HOST: z.string().min(1).default('redis'),
  REDIS_PORT: z.coerce.number().int().positive().default(6378),
  REDIS_PASSWORD: z.string().min(1, 'REDIS_PASSWORD is required'),
  LLM_API_BASE_URL: z.string().url().optional(),
  LLM_API_KEY: z.string().min(1, 'LLM_API_KEY is required'),
  LLM_MODEL_NAME: z.string().min(1, 'LLM_MODEL_NAME is required'),
  PYTHON_SANDBOX_IMAGE: z.string().min(1).default('python:3.11-alpine'),
  BASH_SANDBOX_IMAGE: z.string().min(1).default('alpine:latest'),
  CODE_EXECUTION_TIMEOUT_MS: z.coerce.number().int().min(1000).default(30000),
  SEARXNG_URL: z.string().url().optional(),
  WORKER_CONCURRENCY: z.coerce.number().int().positive().default(5),
  WEBHOOK_SECRET: z.string().optional(),
  MCP_SERVER_URL: z.string().url().optional(),
};

// Pass the schema object to z.object().
const envSchema = z.object(schemaDefinition);

const parsedConfig = envSchema.safeParse(process.env);
if (!parsedConfig.success) {
  console.error(
    '❌ Invalid environment variables:',
    parsedConfig.error.flatten().fieldErrors,
  );
  throw new Error('Invalid environment variables.');
}
export const config = parsedConfig.data;
