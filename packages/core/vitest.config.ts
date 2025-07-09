import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/__tests__/**/*.ts'],
    exclude: ['node_modules', 'dist'],
    setupFiles: [],
    alias: {
      '../agent': path.resolve(__dirname, './src/agent.js'),
      '../types': path.resolve(__dirname, './src/types.js'),
      '../utils/llmProvider': path.resolve(__dirname, './src/utils/llmProvider.js'),
      '../redisClient': path.resolve(__dirname, './src/redisClient.js'),
      '../tools/index.js': path.resolve(__dirname, './src/tools/index.js'),
    },
  },
  resolve: {
    alias: {
      '@agenticforge/core': path.resolve(__dirname, './src'),
    },
  },
});
