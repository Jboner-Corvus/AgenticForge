import { z } from 'zod';

import type { Ctx, Tool } from '@/types.js';

export const parameters = z.object({
  response: z.string().describe('The final, complete answer to the user.'),
});

// The output is always a string, as errors will be thrown.
export const finishOutput = z.string();

// Simplified Tool type, execute now returns a simple Promise<string>
type FinishTool = {
  execute: (
    args: string | z.infer<typeof parameters>,
    ctx: Ctx,
  ) => Promise<string>;
} & Tool<typeof parameters, typeof finishOutput>;

export class FinishToolSignal extends Error {
  public readonly response: string;
  constructor(response: string) {
    super(response);
    this.name = 'FinishToolSignal';
    this.response = response;
  }
}

export const finishTool: FinishTool = {
  description: "Call this tool when the user's goal is accomplished.",
  execute: async (args: string | z.infer<typeof parameters>, ctx: Ctx) => {
    if (!args) {
      const message =
        'Invalid arguments provided to finishTool. A final answer is required.';
      ctx.log.error({ args }, `Error in finishTool: ${message}`);
      throw new Error(message);
    }
    const finalResponse = typeof args === 'string' ? args : args.response;

    ctx.log.info(`Goal accomplished: ${finalResponse}`);
    throw new FinishToolSignal(finalResponse);
  },
  name: 'finish',
  parameters,
};
