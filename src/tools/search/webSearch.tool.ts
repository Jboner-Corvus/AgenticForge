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
  execute: async (args, ctx: Ctx<typeof webSearchParams>) => {
    const { query } = args;
    
    if (!config.SEARXNG_URL) {
        const errorMsg = 'SearXNG URL is not configured.';
        ctx.log.error(errorMsg);
        return `Error: ${errorMsg}`;
    }

    const searchUrl = new URL(config.SEARXNG_URL);
    searchUrl.searchParams.append('q', query);
    searchUrl.searchParams.append('format', 'json');

    ctx.log.info({ url: searchUrl.toString() }, 'Performing web search');

    try {
      const response = await fetch(searchUrl.toString());
      if (!response.ok) {
        throw new Error(`SearXNG request failed with status ${response.status}`);
      }
      const data = await response.json();
      const results = (data.results || []).map((r: any) => ({
        title: r.title,
        url: r.url,
        snippet: r.content,
      }));

      ctx.log.info({ count: results.length }, 'Web search successful');
      return JSON.stringify(results.slice(0, 5)); // Retourne les 5 premiers résultats
    } catch (error) {
      ctx.log.error({ err: error }, 'Web search failed');
      return 'Error: Failed to perform web search.';
    }
  },
};
