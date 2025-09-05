
// 🤖 OUTIL GÉNÉRÉ AUTOMATIQUEMENT par l'agent AgenticForge
// 🎯 Outil: calculate_factorial
// 📁 Localisation: dist/tools/generated/ (outils runtime générés)
// 🔄 Distinction: outils natifs dans src/ vs outils générés dans dist/
import { z } from 'zod';



const calculateFactorialParams = z.object(z.object({ number: z.number().int().positive().describe('The number for which to calculate the factorial.') }));

export const calculateFactorialTool = {
  name: 'calculate_factorial',
  description: '🤖 [OUTIL GÉNÉRÉ] Calculates the factorial of a given number.',
  parameters: calculateFactorialParams,
  execute: async (args, ctx: Ctx) => {
    async ({ number }) => { if (number === 0) return 1; let result = 1; for (let i = 1; i <= number; i++) { result *= i; } return result; }
  },
};

export { calculateFactorialTool };