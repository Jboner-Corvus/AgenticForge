import { promises as fs } from 'fs';
import path from 'path';
// ===== src/tools/fs/listFiles.tool.ts =====
import { z } from 'zod';
const WORKSPACE_DIR = path.resolve(process.cwd(), 'workspace');
fs.mkdir(WORKSPACE_DIR, { recursive: true }).catch(console.error);
export const listFilesParams = z.object({
  path: z.string().default('.').describe('The subdirectory to list.'),
});
export const listFilesTool = {
  description: 'Lists files and directories within the workspace.',
  execute: async () => {
    // ... reste de la logique inchangée
    return 'List files executed.';
  },
  name: 'listFiles',
  parameters: listFilesParams,
};
//# sourceMappingURL=listFiles.tool.js.map
