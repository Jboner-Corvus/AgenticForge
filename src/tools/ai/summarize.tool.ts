// FICHIER : src/tools/ai/summarize.tool.ts
import { z } from 'zod';
import type { Ctx, Tool } from '../../types.js';
// Assurez-vous que llmProvider exporte bien callLLM
import { callLLM } from '../../utils/llmProvider.js'; 
import { getSummarizerPrompt } from '../../prompts/summarizer.prompt.js';

const schema = z.object({
  text: z.string().describe('The text to summarize'),
});

// CORRIGÉ : L'outil utilise le type générique Tool<typeof schema>
export const summarizeTool: Tool<typeof schema> = {
  name: 'ai_summarize',
  description: 'Summarizes a given text.',
  schema, // 'schema' est une propriété valide pour l'outil
  execute: async (args, ctx: Ctx) => {
    // Pas besoin d'assertion de type ici, TypeScript infère 'args' depuis le schéma
    ctx.log.info(args, 'Summarizing text');
    
    const result = await callLLM(
      [{ role: 'user', content: getSummarizerPrompt(args.text) }],
      [],
    );

    return result.content;
  },
};