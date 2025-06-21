
// --- Fichier : src/tools/fs/listFiles.tool.ts (Corrigé) ---
import { z } from 'zod';
import type { Tool, Ctx } from '../../types.js';
import { promises as fs } from 'fs';
import path from 'path';

const WORKSPACE_DIR = path.resolve(process.cwd(), 'workspace');

fs.mkdir(WORKSPACE_DIR, { recursive: true }).catch(console.error);

const sanitizePath = (filePath: string): string => {
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
  execute: async (args, ctx: Ctx) => {
    // ... reste de la logique inchangée
    return "List files executed.";
  },
};