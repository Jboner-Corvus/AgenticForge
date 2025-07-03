// --- Fichier : src/tools/system/finish.tool.ts (Corrigé) ---
import { z } from 'zod';

import type { Ctx, Tool, SessionData } from '../../types.js';

export const finishParams = z.object({
  response: z.string().describe('The final, complete answer to the user.'),
});

export const finishTool: Tool<typeof finishParams> = {
  description: "Call this tool when the user's goal is accomplished.",
  execute: async (args, ctx: Ctx) => {
    // Correction: Ctx n'est pas générique
    ctx.log.info(`Goal accomplished: ${args.response}`);
    return args.response;
  },
  name: 'finish',
  parameters: finishParams,
};
