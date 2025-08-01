import eslint from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import perfectionist from "eslint-plugin-perfectionist";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/**", "packages/core/dist/**", "packages/ui/dist/**", "**/*.d.ts"],
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  perfectionist.configs["recommended-alphabetical"],
  eslintConfigPrettier,
  {
    languageOptions: {
      ecmaVersion: "latest",
      globals: {
        AbortSignal: "readonly",
        Buffer: "readonly",
        clearInterval: "readonly",
        console: "readonly",
        fetch: "readonly",
        global: "readonly",
        process: "readonly",
        setInterval: "readonly",
        setTimeout: "readonly",
        URL: "readonly"
      },
      sourceType: "module",
      parser: tseslint.parser,
      parserOptions: {
        project: true,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_",
          "varsIgnorePattern": "^_"
        }
      ],
      "react-refresh/only-export-components": "off",
      "@typescript-eslint/no-explicit-any": "off"
    },
  },
  {
    files: ["packages/ui/**/*.js", "packages/ui/**/*.ts", "packages/ui/**/*.tsx"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      }
    }
  },
  {
    files: ["packages/core/**/*.ts", "packages/core/**/*.test.ts"],
    languageOptions: {
      globals: {
        afterEach: "readonly",
        beforeAll: "readonly",
        beforeEach: "readonly",
        describe: "readonly",
        expect: "readonly",
        it: "readonly",
        Mock: "readonly",
        vi: "readonly",
      },
      parserOptions: {
        project: ["./packages/core/tsconfig.eslint.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "no-case-declarations": "off",
    },
  }
);