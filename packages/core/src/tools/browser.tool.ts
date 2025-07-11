// packages/core/src/tools/browser.tool.ts
import { chromium, Page } from 'playwright';
import { z } from 'zod';
import type { Ctx, Tool } from '../types.js';
import { UserError } from '../utils/errorUtils.js';

// Schéma pour les paramètres de l'outil
export const browserParams = z.object({
  url: z.string().url().describe('The URL to navigate to.'),
});

// Fonction pour extraire et nettoyer le contenu de la page
async function getPageContent(page: Page): Promise<string> {
  const mainContent = await page.evaluate(() => {
    // Tente de trouver le contenu principal, sinon prend le body
    const main = document.querySelector('main') || document.body;
    return main.innerText;
  });
  // Nettoie les espaces multiples et les lignes vides
  return mainContent.replace(/\s\s+/g, ' ').trim();
}

// Définition de l'outil
export const browserTool: Tool<typeof browserParams> = {
  name: 'browser',
  description: 'Navigates to a URL using a headless Chromium browser and returns its textual content. Ideal for modern websites with JavaScript.',
  parameters: browserParams,
  execute: async (args, ctx: Ctx) => {
    ctx.log.info(`Navigating to URL: ${args.url}`);
    const browser = await chromium.launch({
      // Les arguments '--no-sandbox' sont souvent nécessaires dans un environnement Docker
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.goto(args.url, { waitUntil: 'domcontentloaded', timeout: 90000 });

      const content = await getPageContent(page);
      ctx.log.info(`Successfully retrieved content from ${args.url}. Length: ${content.length}`);

      return {
        url: args.url,
        content: content,
      };
    } catch (error) {
      const err = error as Error;
      ctx.log.error({ err }, `Failed to browse ${args.url}`);
      throw new UserError(`Error while Browse ${args.url}: ${err.message}`);
    } finally {
      await browser.close();
    }
  },
};