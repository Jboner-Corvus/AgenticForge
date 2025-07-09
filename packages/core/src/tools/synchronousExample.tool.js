// --- Fichier : src/tools/synchronousExample.tool.ts ---
import { z as zod } from 'zod';
const SYNC_TOOL_NAME = 'synchronousExampleToolEnhanced';
export const synchronousExampleParams = zod.object({
  data: zod.string().min(1).describe('La donnée à transmuter.'),
  delayMs: zod.number().int().min(0).max(1000).optional().default(10),
  useClientLogger: zod.boolean().optional().default(false),
  userId: zod.string().optional(),
});
export const synchronousExampleTool = {
  description: "Exemple d'outil synchrone.",
  execute: async (_args, _context) => {
    // ... la logique reste la même
    return { text: 'Sync example executed.', type: 'text' };
  },
  name: SYNC_TOOL_NAME,
  parameters: synchronousExampleParams,
};
//# sourceMappingURL=synchronousExample.tool.js.map
