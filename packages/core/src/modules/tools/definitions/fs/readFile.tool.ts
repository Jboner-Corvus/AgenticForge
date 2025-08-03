import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

import { config } from '../../../../config.js'; // Import config
import { Ctx, Tool } from '../../../../types.js';

export const readFileParams = z.object({
  end_line: z
    .number()
    .optional()
    .describe('The line number to stop reading at (inclusive).'),
  path: z.string().describe('The path to the file inside the workspace or AgenticForge directory.'),
  start_line: z
    .number()
    .optional()
    .describe('The line number to start reading from (1-indexed).'),
});

export const readFileOutput = z.union([
  z.string(),
  z.object({
    erreur: z.string(),
  }),
]);

export const readFileTool: Tool<typeof readFileParams, typeof readFileOutput> = {
  description:
    'Reads the content of a file from the workspace or AgenticForge directory. Use this to "open", "view", or "check" a file.',
  execute: async (args: z.infer<typeof readFileParams>, ctx: Ctx) => {
    // Try to resolve the path in the workspace first
    let resolvedPath = path.join(config.WORKSPACE_PATH, args.path);
    
    // If not found in workspace, try in the AgenticForge directory
    try {
      await fs.access(resolvedPath);
    } catch {
      const agenticForgePath = path.join(config.HOST_PROJECT_PATH, args.path);
      try {
        await fs.access(agenticForgePath);
        resolvedPath = agenticForgePath;
      } catch {
        // File not found in either location, will be handled later
      }
    }

    // Final security check - ensure the path is within allowed directories
    const isAllowedPath = 
      resolvedPath.startsWith(config.WORKSPACE_PATH) || 
      resolvedPath.startsWith(config.HOST_PROJECT_PATH);
      
    if (!isAllowedPath) {
      return {
        erreur: 'File path is outside the allowed directories (workspace or AgenticForge).',
      };
    }

    try {
      const content = await fs.readFile(resolvedPath, 'utf-8');
      ctx.log.info(`Successfully read file: ${args.path}`);

      // Logique pour extraire une plage de lignes
      if (args.start_line !== undefined) {
        const lines = content.split('\n');
        const start = args.start_line - 1;
        const end = args.end_line ?? start + 1; // If end_line is not provided, read only one line.
        const snippet = lines.slice(start, end).join('\n');
        return snippet; // Return only the snippet
      }

      return content; // Return only the content
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { erreur: `File not found at path: ${args.path}` };
      }
      ctx.log.error({ err: error }, `Failed to read file: ${args.path}`);
      return {
        erreur: `Could not read file: ${(error as Error).message || error}`,
      };
    }
  },
  name: 'readFile',
  parameters: readFileParams,
};