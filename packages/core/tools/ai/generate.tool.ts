// FICHIER : packages/core/tools/ai/generate.tool.ts

import { z } from 'zod';
import { Tool } from '../../types.js';

export const generateParams = z.object({
  prompt: z.string().describe('Le texte à envoyer au modèle AI pour génération.'),
});

const generateTool: Tool<typeof generateParams, string> = {
  name: 'generate',
  description: 'Génère du texte basé sur un prompt donné en utilisant le modèle AI configuré.',
  execute: async (args, ctx: Ctx) => {
    try {
      // Appelle directement la méthode de génération de texte du fournisseur LLM.
      // Ctx.llm est l'instance du GeminiProvider déjà configuré.
      const llmResponse = await ctx.llm.getLlmResponse([
        { parts: [{ text: args.prompt }], role: 'user' },
      ]);
      return llmResponse;

    } catch (error) {
      ctx.log.error(
        `[generateTool] Erreur lors de la génération de texte via LLM direct: ${(error as Error).message}`,
        { prompt: args.prompt, error: (error as Error).stack }
      );
      return `Erreur: Échec de la génération de texte avec le modèle AI. Détails: ${(error as Error).message}`;
    }
  },
  parameters: generateParams,
};

export default generateTool;