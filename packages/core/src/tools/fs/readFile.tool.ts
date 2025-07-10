import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

import type { Ctx, Tool } from '../../types.js';

import { UserError } from '../../utils/errorUtils.js';

const WORKSPACE_DIR = path.resolve(process.cwd(), 'workspace');

export const readFileParams = z.object({
  path: z.string().describe('The path to the file inside the workspace.'),
});

export const readFileTool: Tool<typeof readFileParams> = {
  description: 'Reads the entire content of a file from the workspace.',
  execute: async (args, ctx: Ctx) => {
    const absolutePath = path.resolve(WORKSPACE_DIR, args.path);

    if (!absolutePath.startsWith(WORKSPACE_DIR)) {
      throw new UserError(
        'File path is outside the allowed workspace directory.',
      );
    }

    try {
      const content = await fs.readFile(absolutePath, 'utf-8');
      ctx.log.info(`Successfully read file: ${args.path}`);
      return `Content of ${args.path}:\n\n${content}`;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new UserError(`File not found at path: ${args.path}`);
      }
      ctx.log.error({ err: error }, `Failed to read file: ${args.path}`);
      throw new Error(`Could not read file: ${error.message}`);
    }
  },
  name: 'readFile',
  parameters: readFileParams,
};
