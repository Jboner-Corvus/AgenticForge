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
    .max(255, 'Le chemin ne peut pas dépasser 255 caractères')
    .refine(
      (path) => !path.includes('..'),
      'Le chemin ne peut pas contenir ".." pour des raisons de sécurité',
    )
    .refine(
      (path) => !/^\//.test(path),
      'Le chemin doit être relatif (ne pas commencer par "/")',
    )
    .refine(
      (path) => !/[<>:"|?*\x00-\x1f]/.test(path),
      'Le chemin contient des caractères invalides',
    )
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
    try {
      // Validation supplémentaire du workspace
      if (!config.WORKSPACE_PATH) {
        throw new Error('WORKSPACE_PATH non configuré dans la configuration');
      }

      const absolutePath = path.resolve(
        path.join(config.WORKSPACE_PATH, args.path),
      );

      // Vérifications de sécurité multiples
      if (!absolutePath.startsWith(path.resolve(config.WORKSPACE_PATH))) {
        return {
          erreur:
            'Chemin de fichier en dehors du répertoire de travail autorisé.',
        };
      }

      // Vérifier que le répertoire parent existe ou peut être créé
      const parentDir = path.dirname(absolutePath);
      if (!parentDir.startsWith(path.resolve(config.WORKSPACE_PATH))) {
        return {
          erreur:
            "Répertoire parent en dehors de l'espace de travail autorisé.",
        };
      }

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
