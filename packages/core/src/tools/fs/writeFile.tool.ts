import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

import type { Ctx, Tool } from '../../types.js';

import { UserError } from '../../utils/errorUtils.js';

const WORKSPACE_DIR = path.resolve(process.cwd(), 'workspace');

export const writeFileParams = z.object({
  content: z.string().describe('The full content to write to the file.'),
  path: z
    .string()
    .describe(
      'The path to the file inside the workspace. Will be created if it does not exist.',
    ),
});

export const writeFileTool: Tool<typeof writeFileParams> = {
  description:
    'Writes content to a file in the workspace, overwriting it if it already exists.',
  execute: async (args, ctx: Ctx) => {
    const absolutePath = path.resolve(WORKSPACE_DIR, args.path);

    if (!absolutePath.startsWith(WORKSPACE_DIR)) {
      throw new UserError(
        'File path is outside the allowed workspace directory.',
      );
    }

    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      await fs.writeFile(absolutePath, args.content, 'utf-8');
      const successMessage = `Successfully wrote content to ${args.path}.`;
      ctx.log.info(successMessage);
      return successMessage;
    } catch (error: any) {
      ctx.log.error({ err: error }, `Failed to write file: ${args.path}`);
      throw new Error(`Could not write file: ${error.message}`);
    }
  },
  name: 'writeFile',
  parameters: writeFileParams,
};
