import { z } from 'zod';

import type { Ctx, Tool } from '@/types.js';

import { getLlmProvider } from '../../../../utils/llmProvider.js';
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
  execute: async (
    args: z.infer<typeof summarizeParams>,
    ctx: Ctx,
  ): Promise<z.infer<typeof summarizeOutput>> => {
    try {
      const params = args as z.infer<typeof summarizeParams>;
      ctx.log.info(params.text, 'Summarizing text');

      if (!params.text) {
        ctx.log.warn('Input text for summarization is empty.');
        return {
          erreur:
            'Failed to summarize text: Input text for summarization is empty.',
        };
      }

      const result = await getLlmProvider().getLlmResponse([
        { parts: [{ text: getSummarizerPrompt(params.text) }], role: 'user' },
      ]);

      if (!result) {
        ctx.log.error('LLM returned empty response for summarization.');
        return {
          erreur: 'Failed to summarize text: LLM returned empty response.',
        };
      }

      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      ctx.log.error({ error }, `Failed to summarize text: ${errorMessage}`);
      return { erreur: `Failed to summarize text: ${errorMessage}` };
    }
  },
  name: 'ai_summarize',
  parameters: summarizeParams,
};
