import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

import type { Ctx, Tool } from '@/types.js';

import { config } from '../../../../config.js';

const WORKSPACE_DIR = config.WORKSPACE_PATH;

export const listFilesParams = z.object({
  path: z
    .string()
    .describe(
      'The subdirectory to list within the workspace. Defaults to the root.',
    ).optional(),
});

export const listFilesOutput = z.union([
  z.string(),
  z.object({
    erreur: z.string(),
  }),
]);

export const listFilesTool: Tool<
  typeof listFilesParams,
  typeof listFilesOutput
> = {
  description:
    'Lists files and directories within a specified path in the workspace.',
  execute: async (args: z.infer<typeof listFilesParams>, ctx: Ctx) => {
    const listPath = args.path || '.';
    const targetDir = path.resolve(WORKSPACE_DIR, listPath);

    if (!targetDir.startsWith(WORKSPACE_DIR)) {
      return { erreur: 'Path is outside the allowed workspace directory.' };
    }

    try {
      const entries = await fs.readdir(targetDir, { withFileTypes: true });
      const fileList = entries.map((entry) =>
        entry.isDirectory() ? `${entry.name}/` : entry.name,
      );
      const result = `Directory listing for 'workspace/${listPath}':\n- ${fileList.join('\n- ')}`;
      ctx.log.info(`Listed files in directory: ${targetDir}`);
      return fileList.length > 0
        ? result
        : `Directory 'workspace/${listPath}' is empty.`;
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return {
          erreur: `Directory not found at path: workspace/${listPath}`,
        };
      }
      ctx.log.error(
        `Failed to list files in: ${targetDir}. Error: ${(error as Error).message}`,
      );
      return {
        erreur: `Could not list files: ${(error as Error).message || error}`,
      };
    }
  },
  name: 'listFiles',
  parameters: listFilesParams,
};
