// --- Fichier : src/tools/debugContext.tool.ts (Corrigé) ---
import { z } from 'zod';

import type { Ctx, SessionData, Tool } from '../types.js';

const TOOL_NAME = 'correctDebugContextTool';

export const debugContextParams = z.object({
  message: z.string().optional(),
  useClientLogger: z.boolean().optional().default(false),
  userId: z.string().optional(),
});

export type ParamsType = z.infer<typeof debugContextParams>;

export const debugContextTool: Tool<typeof debugContextParams> = {
  description: "Affiche le contexte d'authentification et de session.",
  execute: async (_args: ParamsType, context: Ctx): Promise<string> => {
    if (!context.session) throw new Error('Session not found');
    // ... reste de la logique inchangée
    return 'Debug context executed.';
  },
  name: TOOL_NAME,
  parameters: debugContextParams,
};
