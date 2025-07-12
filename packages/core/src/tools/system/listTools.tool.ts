import { z } from 'zod';

import type { Ctx, Tool } from '../../types.js';

import { getAllTools } from '../index.js';

export const listToolsParams = z.object({});

export const listToolsTool: Tool<typeof listToolsParams> = {
  description: 'Lists all available tools.',
  execute: async (_args, _ctx: Ctx) => {
    const allTools = await getAllTools();
    const toolNames = allTools.map((tool) => tool.name);
    return {
      tools: toolNames,
    };
  },
  name: 'listTools',
  parameters: listToolsParams,
};
