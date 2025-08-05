import { defineConfig } from 'vitest/config';

const integrationTestPaths = [
  'src/**/*.integration.test.ts',
  'src/**/__tests__/**/*.integration.ts',
];

const unitTestPaths = [
  'src/**/*.test.ts',
  'src/**/__tests__/**/*.ts',
];

export default defineConfig(({ mode }) => {
  const isIntegration = mode === 'integration';

  return {
    test: {
      globals: true,
      environment: 'node',
      include: isIntegration ? integrationTestPaths : unitTestPaths,
      exclude: [
        'node_modules', 
        'dist', 
        ...(isIntegration ? [] : integrationTestPaths) // Exclude integration tests from unit runs
      ],
      setupFiles: ['src/test/setup.ts'],
      // Reduce verbosity
      reporters: ['default'],
      silent: true,
      hideSkippedTests: true,
      logHeapUsage: false,
    },
  };
});