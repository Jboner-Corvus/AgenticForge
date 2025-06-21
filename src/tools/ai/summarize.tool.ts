/**
 * src/tools/ai/summarize.tool.ts
 *
 * Un outil qui utilise le LLM pour résumer un texte donné.
 */
import { z } from 'zod';
import type { Tool, Ctx } from '@fastmcp/fastmcp';
import { getSummarizerPrompt } from '../../prompts/summarizer.prompt.js';
import { getLlmResponse } from '../../utils/llmProvider.js';

export const summarizeTextParams = z.object({
  text: z.string().min(100).describe('The text to be summarized.'),
});

export const summarizeTextTool: Tool<typeof summarizeTextParams> = {
  name: 'summarizeText',
  description: 'Summarizes a long piece of text.',
  parameters: summarizeTextParams,
  execute: async (args, ctx: Ctx) => {
    ctx.log.info('Summarizing text...');
    const prompt = getSummarizerPrompt(args.text);
    const summary = await getLlmResponse(prompt, 'You are a text summarization expert.');
    ctx.log.info('Text summarized successfully.');
    return summary;
  },
};
