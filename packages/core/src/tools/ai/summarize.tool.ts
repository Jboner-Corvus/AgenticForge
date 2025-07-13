import { z } from 'zod';

import type { Ctx, Tool } from '../../types.js';

import { getSummarizerPrompt } from '../../prompts/summarizer.prompt.js';
import { llmProvider } from '../../utils/llmProvider.js';

export const parameters = z.object({
  text: z.string().describe('The text to summarize'),
});

export const summarizeOutput = z.union([
  z.string(),
  z.object({
    erreur: z.string(),
  }),
]);

export const summarizeTool: Tool<typeof parameters, typeof summarizeOutput> = {
  description: 'Summarizes a given text.',
  execute: async (args: z.infer<typeof summarizeParams>, ctx: Ctx) => {
    try {
      const params = args as z.infer<typeof summarizeParams>;
      ctx.log.info(params.text, 'Summarizing text');

      const result = await llmProvider.getLlmResponse([
        { parts: [{ text: getSummarizerPrompt(params.text) }], role: 'user' },
      ]);

      return result;
    } catch (error: any) {
      ctx.log.error({ err: error }, `Error in summarizeTool`);
      return { "erreur": `An unexpected error occurred: ${error.message || error}` };
    }
  },
  name: 'ai_summarize',
  parameters,
};
