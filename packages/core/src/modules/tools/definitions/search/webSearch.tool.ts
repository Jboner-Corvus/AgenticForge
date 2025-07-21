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
    'Performs a web search using the DuckDuckGo API to find up-to-date information.',
  execute: async (args: z.infer<typeof webSearchParams>, ctx: Ctx) => {
    try {
      ctx.log.info(`Performing web search for: "${args.query}"`);

      const response = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(args.query)}&format=json`,
      );

      if (!response.ok) {
        const errorBody = await response.text();
        const errorMessage = `DuckDuckGo API request failed: ${errorBody}`;
        ctx.log.error({ errorBody }, errorMessage);
        return { erreur: errorMessage };
      }

      const data = await response.json();

      if (!data.AbstractText || data.AbstractText.length === 0) {
        return 'No direct answer found for this query.';
      }

      const results = data.RelatedTopics.map(
        (r: { FirstURL: string; Text: string }) =>
          `- [${r.Text}](${r.FirstURL})`,
      );
      const summary = `Search Answer: ${data.AbstractText}

Results:
${results.join('\n')}`;

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
