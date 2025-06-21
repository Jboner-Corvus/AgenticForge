// --- Fichier : src/tools/search/webSearch.tool.ts (Corrigé) ---
import { z } from 'zod';
import type { Tool, Ctx } from '../../types.js';
import { config } from '../../config.js';

export const webSearchParams = z.object({
  query: z.string().describe('The search query.'),
});

export const webSearchTool: Tool<typeof webSearchParams> = {
  name: 'webSearch',
  description: 'Performs a web search using the local SearXNG instance.',
  parameters: webSearchParams,
  execute: async (args, ctx: Ctx) => {
    // ... reste de la logique inchangée
    return 'Web search executed.';
  },
};
