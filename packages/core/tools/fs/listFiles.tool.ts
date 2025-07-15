import { promises as fs } from 'fs';
import path from 'path';
// ===== src/tools/fs/listFiles.tool.ts =====
import { z } from 'zod';

import type { Tool } from '../../types.js';

const WORKSPACE_DIR = path.resolve(process.cwd(), 'workspace');

fs.mkdir(WORKSPACE_DIR, { recursive: true }).catch(console.error);

export const listFilesParams = z.object({
  path: z.string().default('.').describe('The subdirectory to list.'),
});

export const listFilesTool: Tool<typeof listFilesParams> = {
  description: 'Lists files and directories within the workspace.',
  execute: async ({ input }: { input: { path: string } }) => {
    const { path: dirPath } = input;
    const files = await fs.readdir(path.join(WORKSPACE_DIR, dirPath));
    return files.join('\n');
  },
  name: 'listFiles',
  parameters: listFilesParams,
};