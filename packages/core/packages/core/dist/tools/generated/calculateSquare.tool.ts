
// 🤖 OUTIL GÉNÉRÉ AUTOMATIQUEMENT par l'agent AgenticForge
// 🎯 Outil: calculate_square
// 📁 Localisation: dist/tools/generated/ (outils runtime générés)
// 🔄 Distinction: outils natifs dans src/ vs outils générés dans dist/
import { z } from 'zod';



const calculateSquareParams = z.object(z.object({
  number: z.number().describe('Le nombre dont on veut calculer le carré')
}));

export const calculateSquareTool = {
  name: 'calculate_square',
  description: '🤖 [OUTIL GÉNÉRÉ] Calcule le carré d'un nombre donné',
  parameters: calculateSquareParams,
  execute: async (args, ctx: Ctx) => {
    return params.number * params.number;
  },
};

export { calculateSquareTool };