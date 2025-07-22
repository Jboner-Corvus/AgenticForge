import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '../webServer.js': path.resolve(__dirname, './src/webServer.ts'),
      '../modules/redis/redisClient.js': path.resolve(__dirname, './src/modules/redis/redisClient.ts'),
      '../modules/llm/LlmKeyManager.js': path.resolve(__dirname, './src/modules/llm/LlmKeyManager.ts'),
      '../modules/queue/queue.js': path.resolve(__dirname, './src/modules/queue/queue.ts'),
      '../worker.js': path.resolve(__dirname, './src/worker.ts'),
      '../../utils/constants.js': path.resolve(__dirname, './src/utils/constants.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/__tests__/**/*.ts'],
    exclude: ['node_modules', 'dist'],
    setupFiles: [],
    },
});
