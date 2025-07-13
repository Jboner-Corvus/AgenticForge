import { z } from 'zod';

import type { Ctx, Tool } from '../../types.js';

export const parameters = z.object({
  response: z.string().describe('The final, complete answer to the user.'),
});

export const finishOutput = z.union([
  z.string(),
  z.object({
    erreur: z.string(),
  }),
]);

type FinishTool = {
  execute: (
    args: string | z.infer<typeof parameters>,
    ctx: Ctx,
  ) => Promise<{ erreur: string } | string>;
} & Tool<typeof parameters, typeof finishOutput>;

export const finishTool: FinishTool = {
  description: "Call this tool when the user's goal is accomplished.",
  execute: async (args: string | z.infer<typeof parameters>, ctx: Ctx) => {
    try {
      if (!args) {
        throw new Error('Invalid arguments provided to finishTool.');
      }
      const finalResponse = typeof args === 'string' ? args : args.response;

      ctx.log.info(`Goal accomplished: ${finalResponse}`);
      return finalResponse;
    } catch (error: unknown) {
      ctx.log.error({ err: error }, `Error in finishTool`);
      const message = error instanceof Error ? error.message : String(error);
      return {
        erreur: `An unexpected error occurred: ${message}`,
      };
    }
  },
  name: 'finish',
  parameters,
};
