import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

import type { Ctx, Tool } from '../../types.js';

import { config } from '../../config.js'; // Import config

export const readFileParams = z.object({
  end_line: z
    .number()
    .optional()
    .describe('The line number to stop reading at (inclusive).'),
  path: z.string().describe('The path to the file inside the workspace.'),
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

export const readFileTool: Tool<typeof readFileParams, typeof readFileOutput> =
  {
    description:
      'Reads the content of a file from the workspace. Use this to "open", "view", or "check" a file.',
    execute: async (args, ctx: Ctx) => {
      const absolutePath = path.join(config.WORKSPACE_PATH, args.path);

      if (!absolutePath.startsWith(config.WORKSPACE_PATH)) {
        return {
          erreur: 'File path is outside the allowed workspace directory.',
        };
      }

      try {
        const content = await fs.readFile(absolutePath, 'utf-8');
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
