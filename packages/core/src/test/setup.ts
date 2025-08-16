import 'vitest';
import { vi } from 'vitest';

// Mock the config module to ensure it's always defined during tests
vi.mock('../../src/config.js', () => ({
  config: {
    AGENT_MAX_ITERATIONS: 10,
    CODE_EXECUTION_TIMEOUT_MS: 60000,
    CONTAINER_MEMORY_LIMIT: '2g',
    HISTORY_LOAD_LENGTH: 50,
    HISTORY_MAX_LENGTH: 1000,
    HOST_PROJECT_PATH: '/usr/src/app',
    LLM_MODEL_NAME: 'test-model',
    LLM_PROVIDER: 'gemini',
    LOG_LEVEL: 'debug',
    MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
    PORT: 3001,
    POSTGRES_DB: 'agenticforge',
    POSTGRES_HOST: 'postgres',
    POSTGRES_PORT: 5432,
    POSTGRES_USER: 'user',
    REDIS_DB: 0,
    REDIS_HOST: 'localhost',
    REDIS_PORT: 6379,
    SESSION_EXPIRATION: 7 * 24 * 60 * 60,
    WORKER_CONCURRENCY: 5,
    // Add other default config values as needed for tests
    WORKSPACE_PATH: '/tmp/workspace',
  },
  getConfig: vi.fn(() => ({
    AGENT_MAX_ITERATIONS: 10,
    CODE_EXECUTION_TIMEOUT_MS: 60000,
    CONTAINER_MEMORY_LIMIT: '2g',
    HISTORY_LOAD_LENGTH: 50,
    HISTORY_MAX_LENGTH: 1000,
    HOST_PROJECT_PATH: '/usr/src/app',
    LLM_MODEL_NAME: 'test-model',
    LLM_PROVIDER: 'gemini',
    LOG_LEVEL: 'debug',
    MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
    PORT: 3001,
    POSTGRES_DB: 'agenticforge',
    POSTGRES_HOST: 'postgres',
    POSTGRES_PORT: 5432,
    POSTGRES_USER: 'user',
    REDIS_DB: 0,
    REDIS_HOST: 'localhost',
    REDIS_PORT: 6379,
    SESSION_EXPIRATION: 7 * 24 * 60 * 60,
    WORKER_CONCURRENCY: 5,
    // Add other default config values as needed for tests
    WORKSPACE_PATH: '/tmp/workspace',
  })),
  loadConfig: vi.fn(), // Mock loadConfig as well
}));

// Mock the logger module
vi.mock('../logger.js', async () => {
  const { getLogger, getLoggerInstance } = await import('./mocks/logger.js');
  return {
    getLogger,
    getLoggerInstance,
  };
});
