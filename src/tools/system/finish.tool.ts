import { z } from 'zod';
import type { Tool, Ctx } from '../../types.js';

export const finishParams = z.object({
  response: z.string().describe('The final, complete answer to the user.'),
});

export const finishTool: Tool<typeof finishParams> = {
  name: 'finish',
  description: 'Call this tool when the user\'s goal is accomplished.',
  parameters: finishParams,
  execute: async (args: z.infer<typeof finishParams>, ctx: Ctx<typeof finishParams>) => {
    ctx.log.info(`Goal accomplished: ${args.response}`);
    return args.response;
  },
};
