import { z } from 'zod';
import type { Tool } from 'fastmcp';
import type { Ctx } from '../../types.js';

export const finishParams = z.object({
  response: z.string().describe('The final, complete answer to the user.'),
});

export const finishTool: Tool<typeof finishParams> = {
  name: 'finish',
  description: 'Call this tool when the user\'s goal is accomplished.',
  parameters: finishParams,
  execute: async (args: z.infer<typeof finishParams>, ctx: Ctx) => {
    ctx.log.info({ response: args.response }, 'Goal accomplished.');
    // The framework handles the actual end of the stream.
    // We just return the final message.
    return args.response;
  },
};
