import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  dts: false,
  entry: ['src/**/*.ts'],
  external: ['path', 'playwright', 'playwright-core'],
  format: ['esm'],
  outDir: 'dist',
});