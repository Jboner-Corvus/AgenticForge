import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/config.ts
init_esm_shims();
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var configSchema = z.object({
  AGENT_MAX_ITERATIONS: z.coerce.number().default(100),
  AUTH_TOKEN: z.string().optional(),
  CODE_EXECUTION_TIMEOUT_MS: z.coerce.number().default(6e4),
  CONTAINER_MEMORY_LIMIT: z.string().default("2g"),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GROK_API_KEY: z.string().optional(),
  QWEN_CLIENT_ID: z.string().optional(),
  QWEN_CLIENT_SECRET: z.string().optional(),
  HISTORY_LOAD_LENGTH: z.coerce.number().default(200),
  // Load more messages to preserve context
  HISTORY_MAX_LENGTH: z.coerce.number().default(1e3),
  HOST_PROJECT_PATH: z.string().default(process.cwd()),
  HUGGINGFACE_API_KEY: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  JWT_REFRESH_SECRET: z.string().optional(),
  LLM_API_KEY: z.string().optional(),
  // Added LLM_API_KEY
  LLM_MODEL_NAME: z.string().default("gemini-2.5-pro"),
  LLM_PROVIDER: z.enum(["gemini", "openai", "mistral", "huggingface", "grok", "openrouter", "qwen"]).default("gemini"),
  LLM_PROVIDER_HIERARCHY: z.string().default("huggingface,grok,gemini,openai,mistral,openrouter,qwen").transform((str) => str.split(",").map((s) => s.trim())),
  LLM_REQUEST_DELAY_MS: z.coerce.number().default(2e3),
  // 2-second delay for stability
  LOG_LEVEL: z.string().default("debug"),
  MAX_FILE_SIZE_BYTES: z.coerce.number().default(10 * 1024 * 1024),
  // 10 MB
  MCP_API_KEY: z.string().optional(),
  MCP_WEBHOOK_URL: z.string().optional(),
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(3001),
  POSTGRES_DB: z.string().default("gforge"),
  POSTGRES_HOST: z.string().default("postgres"),
  POSTGRES_PASSWORD: z.string().optional(),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_USER: z.string().default("user"),
  QUALITY_GATE_API_KEY: z.string().optional(),
  QUALITY_GATE_URL: z.string().optional(),
  REDIS_DB: z.coerce.number().default(0),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PASSWORD: z.string().optional(),
  // CORRECTION : La valeur par défaut est maintenant alignée sur la configuration de Docker.
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_URL: z.string().optional(),
  SESSION_EXPIRATION: z.coerce.number().default(7 * 24 * 60 * 60),
  // 7 days in seconds
  TAVILY_API_KEY: z.string().optional(),
  WEBHOOK_SECRET: z.string().optional(),
  WORKER_CONCURRENCY: z.coerce.number().default(5),
  WORKER_MAX_STALLED_COUNT: z.coerce.number().default(3),
  WORKER_STALLED_INTERVAL_MS: z.coerce.number().default(3e4),
  // 30 seconds
  WORKER_WORKSPACE_PATH: z.string().optional(),
  // Standardized workspace path
  WORKSPACE_PATH: z.string().default("/home/demon/agentforge/workspace")
});
var config2 = {};
function getConfig() {
  return config2;
}
async function loadConfig() {
  console.log("DEBUG: process.cwd():", process.cwd());
  const envPath = path.resolve(__dirname, "..", "..", "..", ".env");
  console.log("DEBUG: Resolved .env path:", envPath);
  const result = dotenv.config({
    path: envPath
  });
  if (result.error) {
    console.warn(
      "Could not find .env file, using environment variables only.",
      result.error
    );
  } else if (result.parsed) {
    console.log(
      "DEBUG: .env file loaded successfully. Keys loaded:",
      Object.keys(result.parsed)
    );
  } else {
    console.log(
      "DEBUG: .env file loaded, but no keys parsed (might be empty or malformed)."
    );
  }
  config2 = configSchema.parse(process.env);
  console.log("Resolved WORKSPACE_PATH:", config2.WORKSPACE_PATH);
  console.log("process.env.REDIS_HOST:", process.env.REDIS_HOST);
  console.log("config.REDIS_HOST:", config2.REDIS_HOST);
  console.log("config.LLM_API_KEY:", config2.LLM_API_KEY);
}

export {
  config2 as config,
  getConfig,
  loadConfig
};
