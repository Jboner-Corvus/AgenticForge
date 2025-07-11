import { exec } from 'child_process';
import { z } from 'zod';

import type { Ctx, Tool } from '../../types.js';

// Schéma pour les paramètres
export const getTextFromUrlParams = z.object({
  url: z.string().url().describe('The URL to fetch plain text from.'),
});

// Définition de l'outil
export const getTextFromUrlTool: Tool<typeof getTextFromUrlParams> = {
  description: 'Fetches the textual content of a web page after stripping HTML tags. Useful for static pages.',
  execute: (args, _ctx: Ctx) => {
    return new Promise((resolve) => {
      // Utilise curl pour récupérer le HTML
      exec(`curl -sL "${args.url}"`, (error, stdout, stderr) => {
        if (error) {
          resolve(`Error fetching URL: ${stderr}`);
          return;
        }
        // Nettoyage simple pour enlever les balises HTML et les espaces excessifs
        const textContent = stdout
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Enlève les balises style
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Enlève les balises script
          .replace(/<[^>]*>/g, ' ') // Enlève toutes les autres balises HTML
          .replace(/\s\s+/g, ' ') // Remplace les espaces multiples par un seul
          .trim();

        resolve(textContent);
      });
    });
  },
  name: 'getTextFromUrl',
  parameters: getTextFromUrlParams,
};