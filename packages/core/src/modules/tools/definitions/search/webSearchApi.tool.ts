import { z } from 'zod';

import type { Ctx, Tool } from '../../../../types.js';

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
      
      // Using a simple approach with DuckDuckGo's API
      const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(args.query)}&format=json&no_html=1&skip_disambig=1`;
      
      const response = await fetch(searchUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract relevant information from the response
      let summary = '';
      
      if (data.AbstractText) {
        summary += data.AbstractText + '\n\n';
      }
      
      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        summary += 'Related topics:\n';
        for (let i = 0; i < Math.min(5, data.RelatedTopics.length); i++) {
          const topic = data.RelatedTopics[i];
          if (topic.Text) {
            summary += `- ${topic.Text}\n`;
          }
        }
      }
      
      if (!summary) {
        summary = 'No relevant information found for the search query.';
      }
      
      return { summary };
    } catch (error: unknown) {
      ctx.log.error(
        { err: error },
        'Failed to perform web search with API.',
      );
      return {
        summary: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
  name: 'webSearchApi',
  parameters: webSearchApiParams,
};