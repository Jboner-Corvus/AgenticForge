import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/__tests__/**/*.ts'],
    exclude: ['node_modules', 'dist'],
    setupFiles: ['src/test/setup.ts'],
  },
  server: {
    deps: {
      external: ['jsonwebtoken'],
    },
  },
});
