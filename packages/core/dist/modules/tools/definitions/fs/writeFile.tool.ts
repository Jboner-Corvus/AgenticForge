import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

import type { Ctx, Tool } from '../../../../types.ts';

import { config } from '../../../../config.ts';

export const writeFileParams = z.object({
  content: z
    .string()
    .max(50 * 1024 * 1024, 'Le contenu ne peut pas dépasser 50MB')
    .describe('The full content to write to the file.'),
  path: z
    .string()
    .min(1, 'Le chemin ne peut pas être vide')
    .describe(
      'The path to the file within the workspace. Use absolute paths (starting with /) for global access.',
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
    try {
      let absolutePath: string;

      if (path.isAbsolute(args.path)) {
        ctx.log.info(`Global write access for path: ${args.path}`);
        absolutePath = args.path;
      } else {
        // Validation supplémentaire du workspace
        if (!config.WORKSPACE_PATH) {
          throw new Error('WORKSPACE_PATH non configuré dans la configuration');
        }

        absolutePath = path.resolve(config.WORKSPACE_PATH, args.path);

        // Vérifier que le chemin absolu commence par le WORKSPACE_PATH
        if (!absolutePath.startsWith(path.resolve(config.WORKSPACE_PATH))) {
          return {
            erreur: 'File path is outside the allowed workspace directory.',
          } as z.infer<typeof writeFileOutput>;
        }
      }

      // For very large content, skip the read/compare to avoid memory issues
      if (args.content.length < 1024 * 1024) {
        // 1MB threshold
        const fileExists = await fs
          .stat(absolutePath)
          .then(() => true)
          .catch(() => false);
          
        if (fileExists) {
          try {
            const currentContent = await fs.readFile(absolutePath, 'utf-8');
            if (currentContent === args.content) {
              const message = `File ${args.path} already contains the desired content. No changes made.`;
              ctx.log.info(message);
              return { message: message };
            }
          } catch (readError) {
            // If we can't read the file, we'll just overwrite it
            ctx.log.warn({ err: readError }, `Could not read existing file ${args.path}, will overwrite`);
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

      // Gestion d'erreurs détaillée
      let errorMessage = "Erreur inconnue lors de l'écriture du fichier";
      if (error instanceof Error) {
        const nodeError = error as NodeJS.ErrnoException;
        if (nodeError.code === 'EACCES') {
          errorMessage = 'Permission refusée pour écrire le fichier';
        } else if (nodeError.code === 'ENOSPC') {
          errorMessage = 'Espace disque insuffisant';
        } else if (nodeError.code === 'EMFILE' || nodeError.code === 'ENFILE') {
          errorMessage = 'Trop de fichiers ouverts simultanément';
        } else if (nodeError.code === 'ENOTDIR') {
          errorMessage = "Un élément du chemin n'est pas un répertoire";
        } else {
          errorMessage = `Erreur d'écriture: ${nodeError.message}`;
        }
      }

      return {
        erreur: errorMessage,
      };
    }
  },
  name: 'writeFile',
  parameters: writeFileParams,
};
