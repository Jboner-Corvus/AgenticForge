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
  execute: async ({ path: dirPath }: { path: string }) => {
    const targetPath = path.resolve(WORKSPACE_DIR, dirPath);
    console.log('Listing files in:', targetPath);

    if (!targetPath.startsWith(WORKSPACE_DIR)) {
      throw new Error('Access to paths outside the workspace is not allowed.');
    }

    try {
      const files = await fs.readdir(targetPath);
      return files.join('\n');
    } catch (error: any) {
      console.error('Error in listFiles:', error);
      if (error.code === 'ENOENT') {
        return `Error: Directory not found at ${targetPath}`;
      }
      throw error;
    }
  },
  name: 'listFiles',
  parameters: listFilesParams,
};