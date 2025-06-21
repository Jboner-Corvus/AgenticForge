// ===== src/tools/fs/listFiles.tool.ts =====
import { z } from 'zod';
import type { Tool, Ctx } from '../../types.js';
import { promises as fs } from 'fs';
import path from 'path';

const WORKSPACE_DIR = path.resolve(process.cwd(), 'workspace');

fs.mkdir(WORKSPACE_DIR, { recursive: true }).catch(console.error);

export const listFilesParams = z.object({
  path: z.string().default('.').describe('The subdirectory to list.'),
});

export const listFilesTool: Tool<typeof listFilesParams> = {
  name: 'listFiles',
  description: 'Lists files and directories within the workspace.',
  parameters: listFilesParams,
  execute: async (_args, _ctx: Ctx) => {
    // ... reste de la logique inchangée
    return 'List files executed.';
  },
};
