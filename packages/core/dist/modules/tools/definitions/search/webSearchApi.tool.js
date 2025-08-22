import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  init_esm_shims
} from "../../../../chunk-SB7UONON.js";

// src/modules/tools/definitions/search/webSearchApi.tool.ts
init_esm_shims();
import { z } from "zod";
var webSearchApiParams = z.object({
  query: z.string().describe("The search query.")
});
var webSearchApiOutput = z.object({
  summary: z.string().describe("A summary of the search results.")
});
var webSearchApiTool = {
  description: "Performs a web search using a public API to get up-to-date information.",
  execute: async (args, ctx) => {
    try {
      ctx.log.info(`Performing web search for: "${args.query}"`);
      const queries = [
        args.query,
        `${args.query} latest news`,
        `${args.query} recent developments`
      ];
      let summary = "";
      for (const query of queries) {
        const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
        try {
          const response = await fetch(searchUrl);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          if (data.AbstractText && data.AbstractText.trim()) {
            summary += `Abstract: ${data.AbstractText}

`;
          }
          if (data.RelatedTopics && data.RelatedTopics.length > 0) {
            summary += "Related topics:\n";
            for (let i = 0; i < Math.min(5, data.RelatedTopics.length); i++) {
              const topic = data.RelatedTopics[i];
              if (topic.Text && topic.Text.trim()) {
                summary += `- ${topic.Text}
`;
              }
            }
            summary += "\n";
          }
          if (data.Results && data.Results.length > 0) {
            summary += "Results:\n";
            for (let i = 0; i < Math.min(3, data.Results.length); i++) {
              const result = data.Results[i];
              if (result.Text && result.Text.trim()) {
                summary += `- ${result.Text}
`;
              }
            }
            summary += "\n";
          }
          if (summary.trim()) {
            break;
          }
        } catch (queryError) {
          ctx.log.warn(
            { err: queryError, query },
            "Failed to get results for query variant."
          );
        }
      }
      if (!summary.trim()) {
        summary = "No relevant information found for the search query.";
      }
      return { summary };
    } catch (error) {
      ctx.log.error(
        { err: error },
        "Failed to perform web search with API."
      );
      return {
        summary: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  },
  name: "webSearchApi",
  parameters: webSearchApiParams
};
export {
  webSearchApiOutput,
  webSearchApiParams,
  webSearchApiTool
};
