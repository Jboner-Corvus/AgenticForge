// Outil généré par l'agent : test-tool
import { z } from 'zod';

import type { Tool } from '../../types.js';

export const testToolParams = z.object({ param1: z.string() });

export const testToolTool: Tool<typeof testToolParams> = {
  description: 'A test tool',
  execute: async (_args: any, _ctx: any) => {
    return 'executed';
  },
  name: 'test-tool',
  parameters: testToolParams,
};
