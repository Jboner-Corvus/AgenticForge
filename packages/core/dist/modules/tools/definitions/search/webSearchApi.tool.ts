import { z } from 'zod';

import type { Ctx, Tool } from '../../../../types.ts';

export const webSearchApiParams = z.object({
  query: z.string().describe('The search query.'),
});

export const webSearchApiOutput = z.object({
  summary: z.string().describe('A summary of the search results.'),
});

export const webSearchApiTool: Tool<
  typeof webSearchApiParams,
  typeof webSearchApiOutput
> = {
  description:
    'Performs a web search using a public API to get up-to-date information.',
  execute: async (args: z.infer<typeof webSearchApiParams>, ctx: Ctx) => {
    try {
      ctx.log.info(`Performing web search for: "${args.query}"`);

      // Using DuckDuckGo's API with improved query formatting
      // Try different query formats to get better results
      const queries = [
        args.query,
        `${args.query} latest news`,
        `${args.query} recent developments`,
      ];

      let summary = '';

      for (const query of queries) {
        const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;

        try {
          const response = await fetch(searchUrl);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          // Extract relevant information from the response
          if (data.AbstractText && data.AbstractText.trim()) {
            summary += `Abstract: ${data.AbstractText}\n\n`;
          }

          if (data.RelatedTopics && data.RelatedTopics.length > 0) {
            summary += 'Related topics:\n';
            for (let i = 0; i < Math.min(5, data.RelatedTopics.length); i++) {
              const topic = data.RelatedTopics[i];
              if (topic.Text && topic.Text.trim()) {
                summary += `- ${topic.Text}\n`;
              }
            }
            summary += '\n';
          }

          if (data.Results && data.Results.length > 0) {
            summary += 'Results:\n';
            for (let i = 0; i < Math.min(3, data.Results.length); i++) {
              const result = data.Results[i];
              if (result.Text && result.Text.trim()) {
                summary += `- ${result.Text}\n`;
              }
            }
            summary += '\n';
          }

          // If we got some content, break the loop
          if (summary.trim()) {
            break;
          }
        } catch (queryError) {
          ctx.log.warn(
            { err: queryError, query },
            'Failed to get results for query variant.',
          );
          // Continue with the next query variant
        }
      }

      if (!summary.trim()) {
        summary = 'No relevant information found for the search query.';
      }

      return { summary };
    } catch (error: unknown) {
      ctx.log.error({ err: error }, 'Failed to perform web search with API.');
      return {
        summary: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
  name: 'webSearchApi',
  parameters: webSearchApiParams,
};
