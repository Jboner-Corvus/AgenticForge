import { defineConfig } from 'tsup'

export default defineConfig({
  clean: true,
  dts: true,
  entry: ['src/server.ts', 'src/worker.ts', 'src/prompts/**/*.ts', 'src/tools/**/*.ts', 'src/utils/**/*.ts'],
  format: ['esm'],
})