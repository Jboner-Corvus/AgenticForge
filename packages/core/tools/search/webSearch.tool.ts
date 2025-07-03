// --- Fichier : src/tools/search/webSearch.tool.ts (Corrigé) ---
import { z } from 'zod';
import { Context } from 'fastmcp';
import type { Tool, SessionData } from '../../types.js';

export const webSearchParams = z.object({
  query: z.string().describe('The search query.'),
});

export const webSearchTool: Tool<typeof webSearchParams> = {
  description: 'Performs a web search using the local SearXNG instance.',
  execute: async () => {
    // ... reste de la logique inchangée
    return 'Web search executed.';
  },
  name: 'webSearch',
  parameters: webSearchParams,
};
