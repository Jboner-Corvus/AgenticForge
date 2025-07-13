import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  dts: { exclude: ['**/*.test.ts'] },
  entry: ['src/**/*.ts', '!src/**/*.test.ts'],
  format: ['esm'],
  outDir: 'dist',
  // Utiliser 'copy' pour inclure les fichiers non-ts.
  // Cela préserve la structure des répertoires.
  copy: ['src/prompts/system.prompt.txt'],
});