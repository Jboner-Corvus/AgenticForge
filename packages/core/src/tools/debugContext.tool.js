// --- Fichier : src/tools/debugContext.tool.ts (Corrigé) ---
import { z } from 'zod';
const TOOL_NAME = 'correctDebugContextTool';
export const debugContextParams = z.object({
  message: z.string().optional(),
  useClientLogger: z.boolean().optional().default(false),
  userId: z.string().optional(),
});
export const debugContextTool = {
  description: "Affiche le contexte d'authentification et de session.",
  execute: async (_args, context) => {
    if (!context.session) throw new Error('Session not found');
    // ... reste de la logique inchangée
    return 'Debug context executed.';
  },
  name: TOOL_NAME,
  parameters: debugContextParams,
};
//# sourceMappingURL=debugContext.tool.js.map
