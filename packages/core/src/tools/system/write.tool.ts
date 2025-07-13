import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

import { Ctx, Tool } from '../../../types.js';

const parameters = z.object({
  content: z.string().describe('The content to write to the file.'),
  filePath: z.string().describe('The path to the file to write to.'),
});

const writeOutputSchema = z.object({
  message: z.string(),
  success: z.boolean(),
});

export const writeTool: Tool<typeof parameters, typeof writeOutputSchema> =
  {
    description: 'Writes content to a file.',
    execute: async (args: z.infer<typeof parameters>, _ctx: Ctx) => {
      const { content, filePath } = args as z.infer<typeof parameters>;
      const workspaceDir = path.resolve(process.cwd(), 'workspace');
      const absolutePath = path.resolve(workspaceDir, filePath);

      if (!absolutePath.startsWith(workspaceDir)) {
        throw new Error(
          'File path is outside the allowed workspace directory.',
        );
      }

      await fs.writeFile(absolutePath, content, 'utf-8');
      return { message: `File written to ${filePath}`, success: true };
    },
    name: 'system.write',
    output: writeOutputSchema,
    parameters: parameters,
  };
