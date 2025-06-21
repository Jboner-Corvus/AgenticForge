// --- Fichier : src/tools/fs/readFile.tool.ts (Corrigé) ---
import { z } from 'zod';
import type { Tool, Ctx } from '../../types.js';
import { promises as fs } from 'fs';
import path from 'path';

const WORKSPACE_DIR = path.resolve(process.cwd(), 'workspace');

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
  execute: async (_args, _ctx: Ctx) => {
    // ... reste de la logique inchangée
    return 'Read file executed.';
  },
};
