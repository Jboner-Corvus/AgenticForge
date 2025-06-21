// --- Fichier : src/tools/debugContext.tool.ts (Corrigé) ---
import { z } from 'zod';
import type { SerializableValue } from 'fastmcp';
import logger from '../logger.js';
import { type Tool, type Ctx } from '../types.js';

const TOOL_NAME = 'correctDebugContextTool';

export const debugContextParams = z.object({
  message: z.string().optional(),
  useClientLogger: z.boolean().optional().default(false),
  userId: z.string().optional(),
});

export type ParamsType = z.infer<typeof debugContextParams>;

export const debugContextTool: Tool<typeof debugContextParams> = {
  name: TOOL_NAME,
  description: "Affiche le contexte d'authentification et de session.",
  parameters: debugContextParams,
  execute: async (args: ParamsType, context: Ctx): Promise<string> => {
    if (!context.session) throw new Error('Session not found');
    // ... reste de la logique inchangée
    return 'Debug context executed.';
  },
};
