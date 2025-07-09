import type { TextContent } from 'fastmcp';

import { z } from 'zod';

import type { Tool } from '../types.js';

const SYNC_TOOL_NAME = 'synchronousExampleToolEnhanced';

export const synchronousExampleParams = z.object({
  data: z.string().min(1).describe('La donnée à transmuter.'),
  delayMs: z.number().int().min(0).max(1000).optional().default(10),
  useClientLogger: z.boolean().optional().default(false),
  userId: z.string().optional(),
});
export type SyncParamsType = z.infer<typeof synchronousExampleParams>;

export const synchronousExampleTool: Tool<typeof synchronousExampleParams> = {
  description: "Exemple d'outil synchrone.",
  execute: async (): Promise<TextContent> => {
    // ... la logique reste la même
    return { text: 'Sync example executed.', type: 'text' };
  },
  name: SYNC_TOOL_NAME,
  parameters: synchronousExampleParams,
};
