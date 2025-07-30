
// Outil généré par l'agent : test-tool
import { z } from 'zod';
import type { Ctx, Tool } from '@/types.js';


export const testToolParams = z.object({ "param1": "z.string()" });

export const testToolTool: Tool<typeof testToolParams> = {
  name: 'test-tool',
  description: 'A test tool',
  parameters: testToolParams,
  execute: async (args, ctx: Ctx) => {
    async (args, ctx) => { return "executed"; }
  },
};
