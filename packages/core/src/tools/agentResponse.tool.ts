import { z } from 'zod';

import type { Ctx, Tool } from '../types.js';

export const parameters = z.object({
  response: z.string().describe('The response to send to the user'),
});

export const agentResponseOutput = z.union([
  z.string(),
  z.object({
    erreur: z.string(),
  }),
]);

export const agentResponseTool: Tool<typeof parameters, typeof agentResponseOutput> = {
  description:
    'Use this tool to respond directly to the user when no other tool is appropriate.',
  execute: async (args, ctx: Ctx) => {
    try {
      ctx.log.info('Responding to user', { args });
      return args.response;
    } catch (error: any) {
      ctx.log.error({ err: error }, `Error in agentResponseTool`);
      return { "erreur": `An unexpected error occurred: ${error.message || error}` };
    }
  },
  name: 'Agent_response',
  parameters,
};
