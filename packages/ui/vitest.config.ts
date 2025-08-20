import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

const integrationTestPaths = [
  'src/**/*.integration.test.tsx',
  'src/**/__tests__/**/*.integration.tsx',
];

const unitTestPaths = [
  'src/**/*.test.tsx',
  'src/**/__tests__/**/*.tsx',
];

export default defineConfig(({ mode }) => {
  const isIntegration = mode === 'integration';

  return {
    plugins: [react()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts'],
      include: isIntegration ? integrationTestPaths : unitTestPaths,
      exclude: [
        'node_modules', 
        'dist', 
        ...(isIntegration ? [] : integrationTestPaths) // Exclude integration tests from unit runs
      ],
      typecheck: {
        enabled: false,
      },
      // Reduce verbosity
      reporters: ['default'],
      silent: true,
      hideSkippedTests: true,
      logHeapUsage: false,
      testTimeout: 100000,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
