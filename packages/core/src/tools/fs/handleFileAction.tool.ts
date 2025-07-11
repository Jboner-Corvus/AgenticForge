import { z } from 'zod';
import type { Tool } from '../../types.js';
import { readFileTool } from './readFile.tool.js';
import { listFilesTool } from './listFiles.tool.js';
import { Ctx } from '../../types.js';

export const handleFileActionParams = z.object({
  path: z.string().describe('The path to the file or directory.'),
  action: z.string().describe('The action to perform, e.g., "open", "inspect", "check", "view", "list".'),
});

export const handleFileActionTool: Tool<typeof handleFileActionParams> = {
  name: 'handleFileAction',
  description: 'Handles ambiguous file-related actions by dispatching to the appropriate tool.',
  parameters: handleFileActionParams,
  execute: async (args, ctx: Ctx) => {
    const { action, path } = args;

    switch (action.toLowerCase()) {
      case 'open':
      case 'view':
      case 'check':
      case 'read':
        ctx.log.info(`Action "${action}" interpreted as "readFile".`);
        return await readFileTool.execute({ path }, ctx);

      case 'inspect':
      case 'list':
        ctx.log.info(`Action "${action}" interpreted as "listFiles".`);
        return await listFilesTool.execute({ path }, ctx);

      default:
        throw new Error(`Unsupported file action: "${action}". Please use "open", "read", "view", "check", "list", or "inspect".`);
    }
  },
};
