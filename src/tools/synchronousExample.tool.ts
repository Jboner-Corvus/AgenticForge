// --- Fichier : src/tools/synchronousExample.tool.ts ---
import { z as zod } from 'zod';
import type { SerializableValue, TextContent } from 'fastmcp';
import loggerInstance from '../logger.js';
import type { Ctx, Tool, AuthData } from '../types.js';

const SYNC_TOOL_NAME = 'synchronousExampleToolEnhanced';

export const synchronousExampleParams = zod.object({
  data: zod.string().min(1).describe('La donnée à transmuter.'),
  delayMs: zod.number().int().min(0).max(1000).optional().default(10),
  useClientLogger: zod.boolean().optional().default(false),
  userId: zod.string().optional(),
});
export type SyncParamsType = zod.infer<typeof synchronousExampleParams>;
type SyncOutputTypeInternal = {
  processed: string;
  ts: number;
  input: SyncParamsType;
  appAuthId?: string;
  clientIp?: string;
  n8nSessionId?: string;
};

export const synchronousExampleTool: Tool<typeof synchronousExampleParams> = {
  name: SYNC_TOOL_NAME,
  description: "Exemple d'outil synchrone.",
  parameters: synchronousExampleParams,
  execute: async (args: SyncParamsType, context: Ctx): Promise<TextContent> => {
    // ... la logique reste la même
    return { type: 'text', text: 'Sync example executed.' };
  },
};
