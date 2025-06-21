// --- Fichier : src/tools/synchronousExample.tool.ts ---
import { z as zod } from 'zod';
import type { TextContent } from 'fastmcp';
import type { Ctx, Tool } from '../types.js';

const SYNC_TOOL_NAME = 'synchronousExampleToolEnhanced';

export const synchronousExampleParams = zod.object({
  data: zod.string().min(1).describe('La donnée à transmuter.'),
  delayMs: zod.number().int().min(0).max(1000).optional().default(10),
  useClientLogger: zod.boolean().optional().default(false),
  userId: zod.string().optional(),
});
export type SyncParamsType = zod.infer<typeof synchronousExampleParams>;

export const synchronousExampleTool: Tool<typeof synchronousExampleParams> = {
  name: SYNC_TOOL_NAME,
  description: "Exemple d'outil synchrone.",
  parameters: synchronousExampleParams,
  execute: async (
    _args: SyncParamsType,
    _context: Ctx,
  ): Promise<TextContent> => {
    // ... la logique reste la même
    return { type: 'text', text: 'Sync example executed.' };
  },
};
