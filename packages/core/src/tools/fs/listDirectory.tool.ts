import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

import type { Ctx, Tool } from '../../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_DIR = path.resolve(__dirname, '../../../../workspace');

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

export const listDirectoryTool: Tool<
  typeof listFilesParams,
  typeof listFilesOutput
> = {
  description:
    'Lists files and directories within a specified path in the workspace.',
  execute: async (args, ctx: Ctx) => {
    const { path: listPath } = args;
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
  name: 'list_directory',
  parameters: listFilesParams,
};
