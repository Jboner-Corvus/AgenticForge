import { z } from 'zod';
import type { Tool } from '../../../../types.js';

export const echoToolParams = z.object({
  message: z.string().describe('The message to echo back'),
});

export const echoTool: Tool<typeof echoToolParams> = {
  description: 'Echoes back the provided message',
  execute: async (args: { message: string }) => {
    return `Echo: ${args.message}`;
  },
  name: 'echo',
  parameters: echoToolParams,
};