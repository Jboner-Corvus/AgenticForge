import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  getSummarizerPrompt
} from "./chunk-DE5MSL2E.js";
import {
  getLlmProvider
} from "./chunk-BGGAYOXK.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/modules/tools/definitions/ai/summarize.tool.ts
init_esm_shims();
import { z } from "zod";
var summarizeParams = z.object({
  text: z.string().describe("The text to summarize")
});
var summarizeOutput = z.union([
  z.string(),
  z.object({
    erreur: z.string()
  })
]);
var summarizeTool = {
  description: "Summarizes a given text.",
  execute: async (args, ctx) => {
    try {
      const params = args;
      ctx.log.info(params.text, "Summarizing text");
      if (!params.text) {
        ctx.log.warn("Input text for summarization is empty.");
        return {
          erreur: "Failed to summarize text: Input text for summarization is empty."
        };
      }
      const result = await getLlmProvider("gemini").getLlmResponse([
        { parts: [{ text: getSummarizerPrompt(params.text) }], role: "user" }
      ]);
      if (!result) {
        ctx.log.error("LLM returned empty response for summarization.");
        return {
          erreur: "Failed to summarize text: LLM returned empty response."
        };
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      ctx.log.error({ error }, `Failed to summarize text: ${errorMessage}`);
      return { erreur: `Failed to summarize text: ${errorMessage}` };
    }
  },
  name: "ai_summarize",
  parameters: summarizeParams
};

export {
  summarizeParams,
  summarizeOutput,
  summarizeTool
};
