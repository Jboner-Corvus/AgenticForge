import { z } from 'zod';
import type { Tool, Ctx } from '../../types.js';
import { promises as fs } from 'fs';
import path from 'path';

// Définit un répertoire de travail sécurisé
const WORKSPACE_DIR = path.resolve(process.cwd(), 'workspace');

// S'assure que le répertoire existe au démarrage
fs.mkdir(WORKSPACE_DIR, { recursive: true }).catch(console.error);

const sanitizePath = (filePath: string): string => {
  const resolvedPath = path.resolve(WORKSPACE_DIR, filePath);
  if (!resolvedPath.startsWith(WORKSPACE_DIR)) {
    throw new Error('File path is outside the allowed workspace directory.');
  }
  return resolvedPath;
};

export const readFileParams = z.object({
  path: z.string().describe('The path to the file inside the workspace.'),
});

export const readFileTool: Tool<typeof readFileParams> = {
  name: 'readFile',
  description: 'Reads the content of a file from the workspace.',
  parameters: readFileParams,
  execute: async (args, ctx: Ctx<typeof readFileParams>) => {
    try {
      const safePath = sanitizePath(args.path);
      ctx.log.info({ path: safePath }, 'Reading file');
      const content = await fs.readFile(safePath, 'utf-8');
      return content;
    } catch (error) {
      ctx.log.error({ err: error, path: args.path }, 'Failed to read file');
      return `Error: ${(error as Error).message}`;
    }
  },
};
