import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

import type { Ctx, Tool } from '@/types.js';

import { config } from '../../../../config.js';

// Un schéma de paramètres plus puissant pour l'édition
export const editFileParams = z.object({
  content_to_replace: z
    .string()
    .describe('The exact content or regex pattern to find and replace.'),
  is_regex: z
    .boolean()
    .optional()
    .describe('Set to true if content_to_replace is a regex.'),
  new_content: z
    .string()
    .describe('The new content that will replace the old content.'),
  path: z
    .string()
    .describe('The path to the file to edit inside the workspace.'),
});

// Le schéma de sortie structuré pour le frontend
export const editFileOutput = z.union([
  z.object({
    message: z.string(),
    modified_content: z.string().optional(),
    original_content: z.string().optional(),
    success: z.boolean(),
  }),
  z.object({
    erreur: z.string(),
  }),
]);

export const editFileTool: Tool<typeof editFileParams, typeof editFileOutput> =
  {
    description:
      'Replaces specific content within an existing file in the workspace. Ideal for targeted changes.',
    execute: async (
      args: z.infer<typeof editFileParams>,
      ctx: Ctx,
    ): Promise<string | void | z.infer<typeof editFileOutput>> => {
      const absolutePath = path.resolve(config.WORKSPACE_PATH, args.path);

      if (!absolutePath.startsWith(config.WORKSPACE_PATH)) {
        return {
          erreur: 'File path is outside the allowed workspace directory.',
        } as z.infer<typeof editFileOutput>;
      }

      // NOTE: Add dedicated unit tests for path validation in editFile.tool.test.ts
      // to cover edge cases and ensure strict confinement within WORKSPACE_PATH.

      try {
        const originalContent = await fs.readFile(absolutePath, 'utf-8');
        let modifiedContent: string;

        const useRegex = args.is_regex ?? false; // Handle default here

        if (useRegex) {
          const regex = new RegExp(args.content_to_replace, 'g');
          modifiedContent = originalContent.replace(regex, args.new_content);
        } else {
          modifiedContent = originalContent
            .split(args.content_to_replace)
            .join(args.new_content);
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

        return {
          message: successMessage,
          modified_content: modifiedContent,
          original_content: originalContent,
          success: true,
        };
      } catch (error: unknown) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          return { erreur: `File not found at path: ${args.path}` } as z.infer<
            typeof editFileOutput
          >;
        }
        ctx.log.error(
          `Failed to edit file: ${args.path}. Error: ${(error as Error).message}`,
        );
        return {
          erreur: `Could not edit file: ${(error as Error).message || error}`,
        } as z.infer<typeof editFileOutput>;
      }
    },
    name: 'editFile',
    output: editFileOutput,
    parameters: editFileParams,
  };
