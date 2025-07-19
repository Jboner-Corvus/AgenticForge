// FICHIER : packages/core/src/config.ts
import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Résout correctement le chemin vers le fichier .env à la racine du projet.
const envPath = path.resolve(process.cwd(), '../../.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn('Could not find .env file, using environment variables only.');
}

const configSchema = z.object({
  AGENT_MAX_ITERATIONS: z.coerce.number().default(10),
  CODE_EXECUTION_TIMEOUT_MS: z.coerce.number().default(60000),
  CONTAINER_MEMORY_LIMIT: z.string().default('2g'),
  HISTORY_MAX_LENGTH: z.coerce.number().default(1000),
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
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PASSWORD: z.string().optional(),
  // CORRECTION : La valeur par défaut est maintenant alignée sur la configuration de Docker.
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_URL: z.string().optional(),
  TAVILY_API_KEY: z.string().optional(),
  WEBHOOK_SECRET: z.string().optional(),
  WORKER_CONCURRENCY: z.coerce.number().default(5),
  WORKSPACE_PATH: z
    .string()
    .default(
      '/home/demon/agentforge/AgenticForge2/AgenticForge4/packages/core/workspace',
    ),
});

console.log('GEMINI_MODEL from process.env:', process.env.GEMINI_MODEL);
console.log('LLM_MODEL_NAME from process.env:', process.env.LLM_MODEL_NAME);
// Also log the API keys to ensure they are correct
console.log(
  'GEMINI_API_KEY from process.env:',
  process.env.GEMINI_API_KEY ? '*****' : 'Not set',
);
console.log(
  'LLM_API_KEY from process.env:',
  process.env.LLM_API_KEY ? '*****' : 'Not set',
);

console.log('Resolved .env path:', envPath);
console.log(
  'REDIS_HOST from process.env (after dotenv.config):',
  process.env.REDIS_HOST,
);
console.log(
  'REDIS_PORT from process.env (after dotenv.config):',
  process.env.REDIS_PORT,
);

console.log('Current working directory:', process.cwd());
export const config = configSchema.parse(process.env);

console.log('Resolved WORKSPACE_PATH:', config.WORKSPACE_PATH);
