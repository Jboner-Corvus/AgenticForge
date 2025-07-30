// Outil généré par l'agent : test-tool
import { z } from 'zod';

export const testToolParams = z.object({ param1: 'z.string()' });

export const testToolTool: Tool<typeof testToolParams> = {
  description: 'A test tool',
  execute: async (args, ctx: Ctx) => {
    async (args, ctx) => {
      return 'executed';
    };
  },
  name: 'test-tool',
  parameters: testToolParams,
};
