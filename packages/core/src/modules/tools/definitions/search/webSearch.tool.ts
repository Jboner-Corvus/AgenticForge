import { SearchEngineParser } from 'search-engine-parser';
import { z } from 'zod';

import type { Ctx, Tool } from '../../../../types.js';

export const webSearchParams = z.object({
  query: z.string().describe('The search query.'),
});

export const webSearchOutput = z.union([
  z.string(),
  z.object({
    erreur: z.string(),
  }),
]);

export const webSearchTool: Tool<
  typeof webSearchParams,
  typeof webSearchOutput
> = {
  description:
    'Performs a web search using a search engine scraper to find up-to-date information.',
  execute: async (args: z.infer<typeof webSearchParams>, ctx: Ctx) => {
    try {
      ctx.log.info(`Performing web search for: "${args.query}"`);
      const parser = new SearchEngineParser();
      const results = await parser.search(args.query, ['google', 'duckduckgo']);

      if (!results.results || results.results.length === 0) {
        return 'No results found for this query.';
      }

      const summary = results.results
        .map(
          (r: { title: string; url: string; description: string }) =>
            `### [${r.title}](${r.url})\n${r.description}`,
        )
        .join('\n\n');

      return summary;
    } catch (error: unknown) {
      ctx.log.error({ err: error }, 'Failed to perform web search.');
      return {
        erreur: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
  name: 'webSearch',

  parameters: webSearchParams,
};
