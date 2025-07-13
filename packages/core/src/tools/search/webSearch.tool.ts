import { z } from 'zod';

import type { Ctx, Tool } from '../../types.js';

import { config } from '../../config.js';
import { UserError } from '../../utils/errorUtils.js';

export const webSearchParams = z.object({
  query: z.string().describe('The search query.'),
});

export const webSearchOutput = z.union([
  z.string(),
  z.object({
    erreur: z.string(),
  }),
]);

export const webSearchTool: Tool<typeof parameters, typeof webSearchOutput> = {
  description:
    'Performs a web search using the Tavily API to find up-to-date information.',
  execute: async (args, ctx: Ctx) => {
    try {
      if (!config.TAVILY_API_KEY) {
        return { "erreur": 'Tavily API key is not configured.' };
      }

      ctx.log.info(`Performing web search for: "${args.query}"`);

      const response = await fetch('https://api.tavily.com/search', {
        body: JSON.stringify({
          api_key: config.TAVILY_API_KEY,
          include_answer: true,
          max_results: 5,
          query: args.query,
          search_depth: 'basic',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      if (!response.ok) {
        const errorBody = await response.text();
        return { "erreur": `Tavily API request failed: ${errorBody}` };
      }

      const data = await response.json();

      const summary = `Search Answer: ${data.answer}

Results:
${data.results.map((r: { content: string; title: string; url: string }) => `- [${r.title}](${r.url}): ${r.content}`).join('\n')}`;

      return summary;
    } catch (error: any) {
      ctx.log.error({ err: error }, 'Failed to perform web search.');
      return { "erreur": `An unexpected error occurred: ${error.message || error}` };
    }
  },
  name: 'webSearch',

  parameters,
};
