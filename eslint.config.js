// eslint.config.js
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  // Ignore global directories
  {
    ignores: ['node_modules/', 'dist/', 'coverage/', 'logs/'],
  },

  // Base config for Node.js environment
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
  },

  // Config for SRC TypeScript files (excluding tests)
  {
    files: ['src/**/*.ts'],
    ignores: ['src/**/*.test.ts'], // Exclude test files from this strict config
    extends: [...tseslint.configs.recommended, ...tseslint.configs.stylistic],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
    },
  },

  // Config for TEST files
  // This block does NOT use project-based parsing, avoiding the error.
  {
    files: ['src/**/*.test.ts'],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      parser: tseslint.parser,
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      // Relax rules for tests if necessary
    },
  },

  // Config for public JS files (browser environment)
  {
    files: ['public/js/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  // Prettier config must be the last one to override other formatting rules.
  eslintPluginPrettierRecommended,
);
