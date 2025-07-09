import { z } from 'zod';

import { getSummarizerPrompt } from '../../prompts/summarizer.prompt.js';
import { getLlmResponse } from '../../utils/llmProvider.js';
// 1. Définir le schéma des paramètres avec Zod.
const parametersSchema = z.object({
  text: z.string().describe('The text to summarize'),
});
// 2. Définir l'outil en utilisant le type générique Tool<typeof schema>
export const summarizeTool = {
  description: 'Summarizes a given text.',
  execute: async (args, ctx) => {
    const params = args;
    // La session est accessible via ctx.session, contenant l'historique et autres données.
    ctx.log.info(params.text, 'Summarizing text');
    // Le type de 'args' est inféré depuis le schéma : { text: string }
    const result = await getLlmResponse([
      { parts: [{ text: getSummarizerPrompt(params.text) }], role: 'user' },
    ]);
    return result;
  },
  name: 'ai_summarize',
  parameters: parametersSchema,
};
//# sourceMappingURL=summarize.tool.js.map
