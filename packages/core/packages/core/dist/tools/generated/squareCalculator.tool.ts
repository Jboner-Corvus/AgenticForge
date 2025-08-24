
// 🤖 OUTIL GÉNÉRÉ AUTOMATIQUEMENT par l'agent AgenticForge
// 🎯 Outil: square_calculator
// 📁 Localisation: dist/tools/generated/ (outils runtime générés)
// 🔄 Distinction: outils natifs dans src/ vs outils générés dans dist/
import { z } from 'zod';



const squareCalculatorParams = z.object(z.object({ number: z.number().describe('Le nombre dont on veut calculer le carré') }));

export const squareCalculatorTool = {
  name: 'square_calculator',
  description: '🤖 [OUTIL GÉNÉRÉ] Calcule le carré d'un nombre donné',
  parameters: squareCalculatorParams,
  execute: async (args, ctx: Ctx) => {
    return params.number * params.number;
  },
};

export { squareCalculatorTool };