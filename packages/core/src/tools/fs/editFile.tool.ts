import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

import type { Ctx, Tool } from '../../types.js';

import { UserError } from '../../utils/errorUtils.js';

// Définir les paramètres attendus par l'outil
export const editFileParams = z.object({
  content_to_add: z.string().describe('The content to append to the file.'),
  path: z.string().describe('The path to the file inside the workspace.'),
});

export const editFileTool: Tool<typeof editFileParams> = {
  description: 'Appends content to an existing file in the workspace.',
  execute: async (args, ctx: Ctx) => {
    const workspaceDir = path.resolve(process.cwd(), 'workspace');
    const absolutePath = path.resolve(workspaceDir, args.path);

    if (!absolutePath.startsWith(workspaceDir)) {
      throw new UserError(
        'File path is outside the allowed workspace directory.',
      );
    }

    try {
      await fs.appendFile(absolutePath, `\n${args.content_to_add}`, 'utf-8');
      const successMessage = `Successfully appended content to ${args.path}.`;
      ctx.log.info(successMessage);
      return successMessage;
    } catch (error: unknown) {
      ctx.log.error({ err: error }, `Failed to edit file: ${args.path}`);
      throw new Error(`Could not edit file: ${(error as Error).message}`);
    }
  },
  name: 'editFile',
  parameters: editFileParams,
};
