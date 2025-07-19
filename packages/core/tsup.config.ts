import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  dts: true,
  entry: ['src/**/*.ts', '!src/**/*.test.ts', 'src/types.ts'],
  format: ['esm'],
  outDir: 'dist',
  // Utiliser 'copy' pour inclure les fichiers non-ts.
  // Cela préserve la structure des répertoires.
  copy: ['src/prompts/**/*', 'src/tools/**/*', 'src/utils/**/*'],
});