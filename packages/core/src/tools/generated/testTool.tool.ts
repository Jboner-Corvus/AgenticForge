
// Outil généré par l'agent : test-tool
import { z } from 'zod';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Ctx, Tool } from '@/types.js';


export const testToolParams = z.object({ param1: z.string() });

export const testToolTool: Tool<typeof testToolParams> = {
  description: 'A test tool',
  execute: async (args, ctx) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    return "executed";
  },
  name: 'test-tool',
  parameters: testToolParams,
};
