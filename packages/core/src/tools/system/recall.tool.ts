import { Tool } from 'fastmcp';
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

const recallToolSchema = z.object({
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

export const recallTool = new Tool(
  'system.recall',
  'Reads content from a file.',
  recallToolSchema,
  recallOutputSchema,
  async (params) => {
    const { filePath } = params;
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
);
