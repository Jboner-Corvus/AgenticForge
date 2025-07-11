import { z } from 'zod';

import type { Tool } from '../../types.js';

import { Ctx } from '../../types.js';
import { listFilesTool } from './listFiles.tool.js';
import { readFileTool } from './readFile.tool.js';

export const handleFileActionParams = z.object({
  action: z
    .string()
    .describe(
      'The action to perform, e.g., "open", "inspect", "check", "view", "list".',
    ),
  path: z.string().describe('The path to the file or directory.'),
});

export const handleFileActionTool: Tool<typeof handleFileActionParams> = {
  description:
    'Handles ambiguous file-related actions by dispatching to the appropriate tool.',
  execute: async (args, ctx: Ctx) => {
    const { action, path } = args;

    switch (action.toLowerCase()) {
      case 'check':
      case 'open':
      case 'read':
      case 'view':
        ctx.log.info(`Action "${action}" interpreted as "readFile".`);
        return await readFileTool.execute({ path }, ctx);

      case 'inspect':
      case 'list':
        ctx.log.info(`Action "${action}" interpreted as "listFiles".`);
        return await listFilesTool.execute({ path }, ctx);

      default:
        throw new Error(
          `Unsupported file action: "${action}". Please use "open", "read", "view", "check", "list", or "inspect".`,
        );
    }
  },
  name: 'handleFileAction',
  parameters: handleFileActionParams,
};
