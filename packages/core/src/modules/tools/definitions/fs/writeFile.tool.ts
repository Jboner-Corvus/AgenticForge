import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

import type { Ctx, Tool } from '../../../../types.js';

import { config } from '../../../../config.js';




export const writeFileParams = z.object({
  content: z.string().describe('The full content to write to the file.'),
  path: z
    .string()
    .describe(
      'The path to the file inside the workspace. Will be created if it does not exist.',
    ),
});

export const WriteFileSuccessOutput = z.object({
  message: z.string(),
});

export const WriteFileErrorOutput = z.object({
  erreur: z.string(),
});

export const writeFileOutput = z.union([
  WriteFileSuccessOutput,
  WriteFileErrorOutput,
]);

export const writeFile: Tool<typeof writeFileParams, typeof writeFileOutput> = {
  description:
    'Writes content to a file, overwriting it. Creates the file and directories if they do not exist.',
  execute: async (args: z.infer<typeof writeFileParams>, ctx: Ctx) => {
    const absolutePath = path.join(config.WORKSPACE_PATH, args.path);

    // Final security check: ensure the resolved path is within the workspace
    if (!absolutePath.startsWith(config.WORKSPACE_PATH)) {
      return {
        erreur: 'File path is outside the allowed workspace directory.',
      };
    }

    try {
      // For very large content, skip the read/compare to avoid memory issues
      if (args.content.length < 1024 * 1024) {
        // 1MB threshold
        if (
          await fs
            .stat(absolutePath)
            .then(() => true)
            .catch(() => false)
        ) {
          const currentContent = await fs.readFile(absolutePath, 'utf-8');
          if (currentContent === args.content) {
            const message = `File ${args.path} already contains the desired content. No changes made.`;
            ctx.log.info(message);
            return { message: message };
          }
        }
      }

      // Ensure the directory exists only if a write is necessary
      await fs
        .mkdir(path.dirname(absolutePath), { recursive: true })
        .catch(console.error);

      await fs.writeFile(absolutePath, args.content, 'utf-8');

      const successMessage = `Successfully wrote content to ${args.path}.`;
      ctx.log.info(successMessage);
      return { message: successMessage };
    } catch (error: unknown) {
      ctx.log.error({ err: error }, `Failed to write file: ${args.path}`);
      return {
        erreur: `Could not write file: ${(error as Error).message || error}`,
      };
    }
  },
  name: 'writeFile',
  parameters: writeFileParams,
};
