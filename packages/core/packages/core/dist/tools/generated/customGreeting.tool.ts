// 🤖 OUTIL GÉNÉRÉ AUTOMATIQUEMENT par l'agent AgenticForge
// 🎯 Outil: custom-greeting
// 📁 Localisation: dist/tools/generated/ (outils runtime générés)
// 🔄 Distinction: outils natifs dans src/ vs outils générés dans dist/
import { z } from 'zod';

const customGreetingParams = z.object(
  z.object({ name: z.string().describe('Le nom de la personne à saluer') }),
);

export const customGreetingTool = {
  name: 'custom-greeting',
  description:
    '🤖 [OUTIL GÉNÉRÉ] Un outil personnalisé qui salue un utilisateur par son nom et lui souhaite la bienvenue dans AgenticForge.',
  parameters: customGreetingParams,
  execute: async (args, ctx: Ctx) => {
    return `Bonjour ${params.name} ! Bienvenue dans AgenticForge.`;
  },
};

export { customGreetingTool };
