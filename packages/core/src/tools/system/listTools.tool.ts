import { z } from 'zod';

import type { Ctx, Tool } from '../../types.js';

import { getAllTools } from '../index.js';

export const listToolsParams = z.object({});

export const listToolsTool: Tool<typeof listToolsParams, typeof listToolsOutput> = {
  description: 'Lists all available tools.',
  execute: async (_args, _ctx: Ctx) => {
    try {
      const allTools = await getAllTools();
      const toolNames = allTools.map((tool) => tool.name);
      return {
        tools: toolNames,
      };
    } catch (error: any) {
      _ctx.log.error({ err: error }, `Error in listToolsTool`);
      return { "erreur": `An unexpected error occurred: ${error.message || error}` };
    }
  },
  name: 'listTools',
  parameters: listToolsParams,
};
