import { defineConfig } from 'tsup';
import * as fs from 'fs-extra';
import { statSync } from 'fs';

export default defineConfig({
  clean: true,
  dts: true,
  entry: ['src/**/*.ts', '!src/**/*.test.ts', '!src/**/*.d.ts'],
  external: ['path', 'playwright', 'playwright-core'],
  format: ['esm'],
  outDir: 'dist',
  sourcemap: true,
  splitting: false,
  async onSuccess() {
    console.log('Copying additional files...');
    await fs.copy('src/modules/tools', 'dist/tools', {
      filter: (src) => {
        if (statSync(src).isDirectory()) {
          return true;
        }
        return !src.endsWith('.ts');
      },
    });
    console.log('Additional files copied.');
  },
});