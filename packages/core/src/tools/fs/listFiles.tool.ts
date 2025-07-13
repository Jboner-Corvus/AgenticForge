import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

import type { Ctx, Tool } from '../../types.js';

import { UserError } from '../../utils/errorUtils.js';

const WORKSPACE_DIR = path.resolve(process.cwd(), 'workspace');

export const listFilesParams = z.object({
  path: z
    .string()
    .default('.')
    .describe(
      'The subdirectory to list within the workspace. Defaults to the root.',
    ),
});

export const listFilesOutput = z.union([
  z.string(),
  z.object({
    erreur: z.string(),
  }),
]);

export const listFilesTool: Tool<typeof listFilesParams, typeof listFilesOutput> = {
  description:
    'Lists files and directories within a specified path in the workspace.',
  execute: async (args, ctx: Ctx) => {
    const targetDir = path.resolve(WORKSPACE_DIR, args.path);

    if (!targetDir.startsWith(WORKSPACE_DIR)) {
      return { "erreur": 'Path is outside the allowed workspace directory.' };
    }

    try {
      const entries = await fs.readdir(targetDir, { withFileTypes: true });
      const fileList = entries.map((entry) =>
        entry.isDirectory() ? `${entry.name}/` : entry.name,
      );

      const result = `Directory listing for 'workspace/${args.path}':\n- ${fileList.join('\n- ')}`;
      ctx.log.info(`Listed files in directory: ${targetDir}`);
      return fileList.length > 0
        ? result
        : `Directory 'workspace/${args.path}' is empty.`;
    } catch (error: any) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { "erreur": `Directory not found at path: workspace/${args.path}` };
      }
      ctx.log.error({ err: error }, `Failed to list files in: ${targetDir}`);
      return { "erreur": `Could not list files: ${error.message || error}` };
    }
  },
  name: 'listFiles',
  parameters: listFilesParams,
};
