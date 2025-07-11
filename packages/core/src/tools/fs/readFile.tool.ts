import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';
import type { Ctx, Tool } from '../../types.js';
import { UserError } from '../../utils/errorUtils.js';

const WORKSPACE_DIR = path.resolve(process.cwd(), 'workspace');

export const readFileParams = z.object({
  path: z.string().describe('The path to the file inside the workspace.'),
  start_line: z.number().optional().describe('The line number to start reading from (1-indexed).'),
  end_line: z.number().optional().describe('The line number to stop reading at (inclusive).'),
});

export const readFileTool: Tool<typeof readFileParams> = {
  name: 'readFile',
  description: 'Reads the content of a file (or a specific line range) from the workspace.',
  parameters: readFileParams,
  execute: async (args, ctx: Ctx) => {
    const absolutePath = path.resolve(WORKSPACE_DIR, args.path);

    if (!absolutePath.startsWith(WORKSPACE_DIR)) {
      throw new UserError('File path is outside the allowed workspace directory.');
    }

    try {
      const content = await fs.readFile(absolutePath, 'utf-8');
      ctx.log.info(`Successfully read file: ${args.path}`);

      // Logique pour extraire une plage de lignes
      if (args.start_line !== undefined) {
        const lines = content.split('\n');
        const start = args.start_line - 1;
        const end = args.end_line ?? start + 1; // Si end_line n'est pas fourni, ne lit qu'une seule ligne.
        const snippet = lines.slice(start, end).join('\n');
        return `Content of ${args.path} (lines ${args.start_line}-${end}):\n\n${snippet}`;
      }

      return `Content of ${args.path}:\n\n${content}`;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new UserError(`File not found at path: ${args.path}`);
      }
      ctx.log.error({ err: error }, `Failed to read file: ${args.path}`);
      throw new Error(`Could not read file: ${error.message}`);
    }
  },
};