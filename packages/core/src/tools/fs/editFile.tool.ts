import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

import type { Ctx, Tool } from '../../types.js';

import { UserError } from '../../utils/errorUtils.js';

// Un schéma de paramètres plus puissant pour l'édition
export const editFileParams = z.object({
  content_to_replace: z.string().describe('The exact content or regex pattern to find and replace.'),
  is_regex: z.boolean().optional().default(false).describe('Set to true if content_to_replace is a regex.'),
  new_content: z.string().describe('The new content that will replace the old content.'),
  path: z.string().describe('The path to the file to edit inside the workspace.'),
});

// Le schéma de sortie structuré pour le frontend
export const editFileOutput = z.object({
  message: z.string(),
  modified_content: z.string().optional(),
  original_content: z.string().optional(),
  success: z.boolean(),
});

export const editFileTool: Tool<typeof editFileParams, typeof editFileOutput> = {
  description: 'Replaces specific content within an existing file in the workspace. Ideal for targeted changes.',
  execute: async (args, ctx: Ctx) => {
    const workspaceDir = path.resolve(process.cwd(), 'workspace');
    const absolutePath = path.resolve(workspaceDir, args.path);

    if (!absolutePath.startsWith(workspaceDir)) {
      throw new UserError('File path is outside the allowed workspace directory.');
    }

    try {
      const originalContent = await fs.readFile(absolutePath, 'utf-8');
      let modifiedContent: string;

      if (args.is_regex) {
        // Remplacement via une expression régulière
        const regex = new RegExp(args.content_to_replace, 'g'); // 'g' pour remplacer toutes les occurrences
        modifiedContent = originalContent.replace(regex, args.new_content);
      } else {
        // Remplacement de toutes les occurrences de la chaîne
        modifiedContent = originalContent.split(args.content_to_replace).join(args.new_content);
      }

      if (originalContent === modifiedContent) {
        return {
          message: `No changes were needed in ${args.path}. The content was already correct.`,
          success: true,
        };
      }

      await fs.writeFile(absolutePath, modifiedContent, 'utf-8');
      
      const successMessage = `Successfully edited content in ${args.path}.`;
      ctx.log.info(successMessage);

      // Retourner une sortie structurée
      return {
        message: successMessage,
        modified_content: modifiedContent,
        original_content: originalContent,
        success: true,
      };
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new UserError(`File not found at path: ${args.path}`);
      }
      ctx.log.error({ err: error }, `Failed to edit file: ${args.path}`);
      throw new Error(`Could not edit file: ${(error as Error).message}`);
    }
  },
  name: 'editFile',
  output: editFileOutput,
  parameters: editFileParams,
};