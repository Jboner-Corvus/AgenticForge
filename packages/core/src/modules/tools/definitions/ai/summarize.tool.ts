import { z } from 'zod';

import type { Ctx, Tool } from '@/types.js';

import { llmProvider } from '../../../../utils/llmProvider.js';
import { getSummarizerPrompt } from './summarizer.prompt.js';

export const summarizeParams = z.object({
  text: z.string().describe('The text to summarize'),
});

export const summarizeOutput = z.union([
  z.string(),
  z.object({
    erreur: z.string(),
  }),
]);

export const summarizeTool: Tool<
  typeof summarizeParams,
  typeof summarizeOutput
> = {
  description: 'Summarizes a given text.',
  execute: async (args: z.infer<typeof summarizeParams>, ctx: Ctx) => {
    try {
      const params = args as z.infer<typeof summarizeParams>;
      ctx.log.info(params.text, 'Summarizing text');

      const result = await llmProvider.getLlmResponse([
        { parts: [{ text: getSummarizerPrompt(params.text) }], role: 'user' },
      ]);

      return result;
    } catch (error: unknown) {
      ctx.log.error({ err: error }, `Error in summarizeTool`);
      return {
        erreur: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
  name: 'ai_summarize',
  parameters: summarizeParams,
};
