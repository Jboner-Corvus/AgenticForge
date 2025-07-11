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
  name: 'writeFile',
  description: 'Writes content to a file, overwriting it. Creates the file and directories if they do not exist.',
  parameters: writeFileParams,
  execute: async (args, ctx: Ctx) => {
    const absolutePath = path.resolve(process.cwd(), 'workspace', args.path);
    if (!absolutePath.startsWith(path.resolve(process.cwd(), 'workspace'))) {
      throw new UserError('File path is outside the allowed workspace directory.');
    }

    try {
      // Assurer que le répertoire existe
      await fs.mkdir(path.dirname(absolutePath), { recursive: true });

      // Vérifier si le fichier existe et si son contenu est identique
      if (await fs.stat(absolutePath).then(() => true).catch(() => false)) {
        const currentContent = await fs.readFile(absolutePath, 'utf-8');
        if (currentContent === args.content) {
          const message = `File ${args.path} already contains the desired content. No changes made.`;
          ctx.log.info(message);
          return message;
        }
      }

      await fs.writeFile(absolutePath, args.content, 'utf-8');
      const successMessage = `Successfully wrote content to ${args.path}.`;
      ctx.log.info(successMessage);
      return successMessage;
    } catch (error: any) {
      ctx.log.error({ err: error }, `Failed to write file: ${args.path}`);
      throw new Error(`Could not write file: ${error.message}`);
    }
  },
};
