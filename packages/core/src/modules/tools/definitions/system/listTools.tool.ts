import { z } from 'zod';

import type { Ctx, Tool } from '../../../../types.js';

import { getAllTools } from '../index.js';

export const parameters = z.object({});

export const listToolsOutput = z.union([
  z.object({
    tools: z.array(z.string()),
  }),
  z.object({
    erreur: z.string(),
  }),
]);

export const listToolsTool: Tool<typeof parameters, typeof listToolsOutput> = {
  description: 'Lists all available tools.',
  execute: async (_args: z.infer<typeof parameters>, _ctx: Ctx) => {
    try {
      const allTools = await getAllTools();
      const toolNames = allTools.map((tool: Tool) => tool.name);
      return {
        tools: toolNames,
      };
    } catch (error: unknown) {
      _ctx.log.error({ err: error }, `Error in listToolsTool`);
      return {
        erreur: `An unexpected error occurred: ${(error as Error).message || error}`,
      };
    }
  },
  name: 'listTools',
  output: listToolsOutput,
  parameters,
};
