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
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts'],
      globals: true,
      include: isIntegration ? integrationTestPaths : unitTestPaths,
      exclude: [
        'node_modules', 
        'dist', 
        ...(isIntegration ? [] : integrationTestPaths) // Exclude integration tests from unit runs
      ],
      typecheck: {
        enabled: true,
        include: ['src/**/*.ts', 'src/**/*.tsx'],
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
