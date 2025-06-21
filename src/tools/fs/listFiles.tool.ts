import { z } from 'zod';
import type { Tool, Ctx } from '../../types.js';
import { promises as fs } from 'fs';
import path from 'path';

const WORKSPACE_DIR = path.resolve(process.cwd(), 'workspace');

fs.mkdir(WORKSPACE_DIR, { recursive: true }).catch(console.error);

const sanitizePath = (filePath: string): string => {
  // Permet de lister à partir de la racine du workspace
  if (filePath === '.' || filePath === '/') filePath = '';
  const resolvedPath = path.resolve(WORKSPACE_DIR, filePath);
  if (!resolvedPath.startsWith(WORKSPACE_DIR)) {
    throw new Error('Directory path is outside the allowed workspace directory.');
  }
  return resolvedPath;
};

export const listFilesParams = z.object({
  path: z.string().default('.').describe('The subdirectory to list.'),
});

export const listFilesTool: Tool<typeof listFilesParams> = {
  name: 'listFiles',
  description: 'Lists files and directories within the workspace.',
  parameters: listFilesParams,
  execute: async (args, ctx: Ctx<typeof listFilesParams>) => {
    try {
      const safePath = sanitizePath(args.path);
      ctx.log.info({ path: safePath }, 'Listing files');
      const files = await fs.readdir(safePath, { withFileTypes: true });
      const fileList = files.map((file) => `${file.name}${file.isDirectory() ? '/' : ''}`);
      return fileList.join('\n');
    } catch (error) {
      ctx.log.error({ err: error, path: args.path }, 'Failed to list files');
      return `Error: ${(error as Error).message}`;
    }
  },
};
