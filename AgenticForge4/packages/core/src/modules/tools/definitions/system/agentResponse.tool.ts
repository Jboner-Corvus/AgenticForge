import { z } from 'zod';

import type { Ctx, Tool } from '@/types.js';

const agentResponseParams = z.object({
  response: z.string().describe('The response to send to the user.'),
});

export const agentResponseTool: Tool<typeof agentResponseParams> = {
  description: 'Responds to the user.',
  execute: async (args: z.infer<typeof agentResponseParams>, ctx: Ctx) => {
    ctx.log.info('Responding to user', { args });
    return args.response;
  },
  name: 'agentResponse',
  parameters: agentResponseParams,
};
