import { Context } from 'fastmcp';
// --- Fichier : src/tools/synchronousExample.tool.ts ---
import { z as zod } from 'zod';

import type { Tool } from '../../types.js';

const SYNC_TOOL_NAME = 'synchronousExampleToolEnhanced';

export const synchronousExampleParams = zod.object({
  data: zod.string().min(1).describe('La donnée à transmuter.'),
  delayMs: zod.number().int().min(0).max(1000).optional().default(10),
  useClientLogger: zod.boolean().optional().default(false),
  userId: zod.string().optional(),
});
export type SyncParamsType = zod.infer<typeof synchronousExampleParams>;

export const synchronousExampleTool: Tool<typeof synchronousExampleParams> = {
  description: "Exemple d'outil synchrone.",
  execute: async (
    _args: SyncParamsType,
    _context: Context<unknown>,
  ): Promise<{ text: string, type: 'text' }> => {
    // ... la logique reste la même
    return { text: 'Sync example executed.', type: 'text' };
  },
  name: SYNC_TOOL_NAME,
  parameters: synchronousExampleParams,
};