import { Context } from 'fastmcp';
import { z } from 'zod';

import type { SessionData, Tool } from '../../types.js';

import { getSummarizerPrompt } from '../../prompts/summarizer.prompt.js';
import { getLlmResponse } from '../../utils/llmProvider.js';

// 1. Définir le schéma des paramètres avec Zod.
const parametersSchema = z.object({
  text: z.string().describe('The text to summarize'),
});

// 2. Définir l'outil en utilisant le type générique Tool<typeof schema>
export const summarizeTool: Tool<typeof parameters> = {
  description: 'Summarizes a given text.',
  // 4. La fonction 'execute' reçoit 'args' et 'ctx', qui sont automatiquement typés.
  execute: async (args, ctx: Context<SessionData>) => {
    // La session est accessible via ctx.session, contenant l'historique et autres données.
    ctx.log.info(args.text, 'Summarizing text');

    // Le type de 'args' est inféré depuis le schéma : { text: string }
    const result = await getLlmResponse([
      { parts: [{ text: getSummarizerPrompt(args.text) }], role: 'user' },
    ]);

    return result;
  },

  name: 'ai_summarize',

  // 3. CORRIGÉ : La propriété doit s'appeler 'parameters' et contenir le schéma.
  parameters: parametersSchema,
};
