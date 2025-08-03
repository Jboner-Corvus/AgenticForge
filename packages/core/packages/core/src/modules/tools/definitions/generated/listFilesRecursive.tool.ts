
// Outil généré par l'agent : listFiles-recursive
import { z } from 'zod';
import type { Ctx, Tool } from '../../../../types.js';


export const listFilesRecursiveParams = z.object(z.object({}));

export const listFilesRecursiveTool: Tool<typeof listFilesRecursiveParams> = {
  name: 'listFiles-recursive',
  description: 'Lists files and directories recursively using 'find . -print'.',
  parameters: listFilesRecursiveParams,
  execute: async (args, ctx: Ctx) => {
    const result = await tools.executeShellCommand({ command: 'find . -print' }); return result;
  },
};
