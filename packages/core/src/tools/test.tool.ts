import { z } from 'zod';

import { Tool } from '../types';

const testToolParams = z.object({
  message: z.string().describe('A test message'),
});

const testTool: Tool<typeof testToolParams> = {
  description: 'A test tool',
  execute: async (args: { message: string }) => {
    return `Test tool executed with message: ${args.message}`;
  },
  name: 'test',
  parameters: testToolParams,
};

export default testTool;