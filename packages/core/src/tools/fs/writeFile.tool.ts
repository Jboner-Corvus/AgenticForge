import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

import type { Ctx, Tool } from '../../types.js';

import { config } from '../../config.js'; // Import config

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
  execute: async (args, ctx: Ctx) => {
    const absolutePath = path.join(config.WORKSPACE_PATH, args.path);

    try {
      // Assurer que le répertoire existe
      await fs
        .mkdir(path.dirname(absolutePath), { recursive: true })
        .catch(console.error);

      // Vérifier si le fichier existe et si son contenu est identique
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
