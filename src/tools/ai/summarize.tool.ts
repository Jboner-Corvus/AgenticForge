// FICHIER : src/tools/ai/summarize.tool.ts
import { z } from 'zod';
import type { Ctx, Tool } from '../../types.js';
import { callLLM } from '../../utils/llmProvider.js';
import { getSummarizerPrompt } from '../../prompts/summarizer.prompt.js';

// 1. Définir le schéma des paramètres avec Zod.
const parametersSchema = z.object({
  text: z.string().describe('The text to summarize'),
});

// 2. Définir l'outil en utilisant le type générique Tool<typeof schema>
export const summarizeTool: Tool<typeof parametersSchema> = {
  name: 'ai_summarize',
  description: 'Summarizes a given text.',
  
  // 3. CORRIGÉ : La propriété doit s'appeler 'parameters' et contenir le schéma.
  parameters: parametersSchema,
  
  // 4. La fonction 'execute' reçoit 'args' et 'ctx', qui sont automatiquement typés.
  execute: async (args, ctx: Ctx) => {
    // La session est accessible via ctx.session, contenant l'historique et autres données.
    ctx.log.info({ ...args, sessionId: ctx.session?.sessionId }, 'Summarizing text');
    
    // Le type de 'args' est inféré depuis le schéma : { text: string }
    const result = await callLLM(
      [{ role: 'user', content: getSummarizerPrompt(args.text) }],
      [],
    );

    return result.content;
  },
};