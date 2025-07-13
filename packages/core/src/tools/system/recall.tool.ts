import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

import { Ctx, Tool } from '../../../types.js';

const parameters = z.object({
  filePath: z.string().describe('The path to the file to read from.'),
});

const recallOutputSchema = z.union([
  z.object({
    content: z.string(),
  }),
  z.object({
    error: z.string(),
  }),
]);

export const recallTool: Tool<
  typeof parameters,
  typeof recallOutputSchema
> = {
  description: 'Reads content from a file.',
  execute: async (args: unknown, _ctx: Ctx) => {
    const { filePath } = args as z.infer<typeof parameters>;
    const workspaceDir = path.resolve(process.cwd(), 'workspace');
    const absolutePath = path.resolve(workspaceDir, filePath);

    if (!absolutePath.startsWith(workspaceDir)) {
      throw new Error('File path is outside the allowed workspace directory.');
    }

    try {
      const content = await fs.readFile(absolutePath, 'utf-8');
      return { content };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { error: 'File not found.' };
      }

      throw error;
    }
  },
  name: 'system.recall',
  output: recallOutputSchema,
  parameters: parameters,
};
