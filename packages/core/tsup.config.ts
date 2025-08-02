import { defineConfig } from 'tsup';
import * as fs from 'fs-extra';
import { statSync } from 'fs';

import { defineConfig } from 'tsup';
import * as fs from 'fs-extra';
import { statSync } from 'fs';

export default defineConfig({
  bundle: true,
  clean: true,
  dts: {
    resolve: true,
    entry: 'src/index.ts',
  },
  entry: ['src/index.ts', 'src/webServer.ts', 'src/worker.ts', 'src/server-start.ts', 'src/modules/tools/definitions/**/*.ts'],
  external: ['path', 'playwright', 'playwright-core', '@modelcontextprotocol/inspector', 'ioredis', 'bullmq', 'pg', 'dotenv', 'pino'],
  format: ['esm'],
  noExternal: [
    'chokidar',
    'cookie-parser',
    'dockerode',
    'express',
    'fastmcp',
    'jsonwebtoken',
    'uuid',
    'vitest-mock-extended',
    'zod',
  ],
  outDir: 'dist',
  sourcemap: true,
  splitting: false,
  async onSuccess() {
    console.log('Copying additional files...');
    await fs.copy('src/modules/agent/system.prompt.md', 'dist/system.prompt.md');
    console.log('Additional files copied.');
  },
});