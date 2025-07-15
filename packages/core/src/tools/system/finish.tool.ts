import { z } from 'zod';

import type { Ctx, Tool } from '../../types.js';

export const parameters = z.object({
  response: z.string().describe('The final, complete answer to the user.'),
});

// The output is always a string, as errors will be thrown.
export const finishOutput = z.string();

export class FinishToolSignal extends Error {
  public readonly response: string;
  constructor(response: string) {
    super(response);
    this.name = 'FinishToolSignal';
    this.response = response;
  }
}

// Simplified Tool type, execute now returns a simple Promise<string>
type FinishTool = {
  execute: (
    args: string | z.infer<typeof parameters>,
    ctx: Ctx,
  ) => Promise<string>;
} & Tool<typeof parameters, typeof finishOutput>;

export const finishTool: FinishTool = {
  description: "Call this tool when the user's goal is accomplished.",
  execute: async (args: string | z.infer<typeof parameters>, ctx: Ctx) => {
    try {
      if (!args) {
        throw new Error(
          'Invalid arguments provided to finishTool. A final answer is required.',
        );
      }
      const finalResponse = typeof args === 'string' ? args : args.response;

      ctx.log.info(`Goal accomplished: ${finalResponse}`);
      throw new FinishToolSignal(finalResponse);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      ctx.log.error({ err: error }, `Error in finishTool: ${message}`);
      // Throw an error instead of returning an error object
      throw new Error(`An unexpected error occurred in finishTool: ${message}`);
    }
  },
  name: 'finish',
  parameters,
};
