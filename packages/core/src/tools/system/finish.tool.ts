// --- Fichier : src/tools/system/finish.tool.ts (Corrigé) ---
import { z } from 'zod';

import type { Ctx, Tool } from '../../types.js';

export const finishParams = z.object({
  response: z.string().describe('The final, complete answer to the user.'),
});

export const finishTool: Tool<typeof finishParams> = {
  description: "Call this tool when the user's goal is accomplished.",
  execute: async (args: string | z.infer<typeof finishParams>, ctx: Ctx) => {
    // Handle cases where the LLM sends a raw string instead of an object
    const finalResponse = typeof args === 'string' ? args : args?.response;

    ctx.log.info(`Goal accomplished: ${finalResponse}`);
    return finalResponse;
  },
  name: 'finish',
  parameters: finishParams,
};
