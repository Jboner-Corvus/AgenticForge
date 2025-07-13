import { z } from 'zod';

import type { Ctx, Tool } from '../../types.js';

export const finishParams = z.object({
  response: z.string().describe('The final, complete answer to the user.'),
});

export const finishOutput = z.union([
  z.string(),
  z.object({
    erreur: z.string(),
  }),
]);

export const finishTool: Tool<typeof finishParams, typeof finishOutput> = {
  description: "Call this tool when the user's goal is accomplished.",
  execute: async (args: string | z.infer<typeof finishParams>, ctx: Ctx) => {
    try {
      const finalResponse = typeof args === 'string' ? args : args?.response;

      ctx.log.info(`Goal accomplished: ${finalResponse}`);
      return finalResponse;
    } catch (error: any) {
      ctx.log.error({ err: error }, `Error in finishTool`);
      return { "erreur": `An unexpected error occurred: ${error.message || error}` };
    }
  },
  name: 'finish',
  parameters: finishParams,
};
