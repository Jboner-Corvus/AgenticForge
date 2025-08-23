import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  init_esm_shims
} from "../../../../chunk-SB7UONON.js";

// src/modules/tools/definitions/search/webNavigate.tool.ts
init_esm_shims();
import { Readability } from "@mozilla/readability";
import * as cheerio from "cheerio";
import { z } from "zod";
var webNavigateParams = z.object({
  action: z.enum(["summarize", "extract_text", "get_title"]).optional().describe("The action to perform on the page. Default is summarize."),
  url: z.string().url().describe("The URL to navigate to.")
});
var webNavigateOutput = z.object({
  result: z.string().describe("The result of the navigation and action.")
});
var webNavigateTool = {
  description: "Navigates to a web page and performs an action like summarizing content, extracting text, or getting the title.",
  execute: async (args, ctx) => {
    try {
      ctx.log.info(`Navigating to: "${args.url}"`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1e4);
      const response = await fetch(args.url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; AgenticForge/1.0; +https://example.com/bot)"
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const html = await response.text();
      const $ = cheerio.load(html);
      let result = "";
      switch (args.action) {
        case "extract_text":
          $("script, style").remove();
          result = $("body").text().replace(/\s+/g, " ").trim();
          if (result.length > 2e3) {
            result = result.substring(0, 2e3) + "...";
          }
          break;
        case "get_title":
          result = $("title").text() || "No title found";
          break;
        case "summarize":
        default:
          try {
            const doc = {
              content: html,
              title: $("title").text()
            };
            const reader = new Readability(doc);
            const article = reader.parse();
            if (article && article.textContent) {
              result = article.textContent.substring(0, 500) + "...";
            } else {
              $("script, style").remove();
              const text = $("body").text().replace(/\s+/g, " ").trim();
              result = text.substring(0, 500) + "...";
            }
          } catch (readabilityError) {
            $("script, style").remove();
            const text = $("body").text().replace(/\s+/g, " ").trim();
            result = text.substring(0, 500) + "...";
          }
          break;
      }
      if (!result) {
        result = "No content found on the page.";
      }
      return { result };
    } catch (error) {
      ctx.log.error({ err: error }, "Failed to navigate to web page.");
      if (error instanceof Error && error.name === "AbortError") {
        return {
          result: "Request timed out while trying to navigate to the web page."
        };
      }
      return {
        result: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  },
  name: "webNavigate",
  parameters: webNavigateParams
};
export {
  webNavigateOutput,
  webNavigateParams,
  webNavigateTool
};
