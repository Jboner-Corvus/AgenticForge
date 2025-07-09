import { promises as fs } from 'fs';
import path from 'path';
// ===== src/tools/fs/readFile.tool.ts =====
import { z } from 'zod';

import type { Tool } from '../../types.js';

const WORKSPACE_DIR = path.resolve(process.cwd(), 'workspace');

fs.mkdir(WORKSPACE_DIR, { recursive: true }).catch(console.error);

export const readFileParams = z.object({
  path: z.string().describe('The path to the file inside the workspace.'),
});

export const readFileTool: Tool<typeof readFileParams> = {
  description: 'Reads the content of a file from the workspace.',
  execute: async () => {
    // ... reste de la logique inchangée
    return 'Read file executed.';
  },
  name: 'readFile',
  parameters: readFileParams,
};