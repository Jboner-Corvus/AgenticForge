import { promises as fs } from 'fs';
import path from 'path';
// ===== src/tools/fs/writeFile.tool.ts =====
import { z } from 'zod';
const WORKSPACE_DIR = path.resolve(process.cwd(), 'workspace');
fs.mkdir(WORKSPACE_DIR, { recursive: true }).catch(console.error);
export const writeFileParams = z.object({
  content: z.string().describe('The content to write to the file.'),
  path: z.string().describe('The path to the file inside the workspace.'),
});
export const writeFileTool = {
  description: 'Writes content to a file in the workspace.',
  execute: async () => {
    // ... reste de la logique inchangée
    return 'Write file executed.';
  },
  name: 'writeFile',
  parameters: writeFileParams,
};
//# sourceMappingURL=writeFile.tool.js.map
