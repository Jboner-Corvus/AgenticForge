import { chromium } from 'playwright';
// packages/core/src/tools/browser/browseWebsite.tool.ts
import { z } from 'zod';

import type { Ctx, Tool } from '../../types.js';

import { UserError } from '../../utils/errorUtils.js';

// Schéma pour les paramètres de l'outil
export const browseWebsiteParams = z.object({
  url: z.string().url().describe('The URL of the website to browse.'),
});

// Schéma pour le résultat de l'outil
export const browseWebsiteOutput = z.object({
  content: z.string().describe('The textual content of the website.'),
});

export const browseWebsiteTool: Tool<
  typeof browseWebsiteParams,
  typeof browseWebsiteOutput
> = {
  description:
    'Navigates to a URL and extracts its textual content. Use this to get information from a specific webpage.',
  execute: async (args, ctx: Ctx) => {
    ctx.log.info(`Browse website: ${args.url}`);
    let browser = null;
    try {
      browser = await chromium.launch();
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(args.url, {
        timeout: 60000,
        waitUntil: 'domcontentloaded',
      });

      // Extrait le contenu textuel du body
      const bodyContent = await page.evaluate(() => document.body.innerText);

      // Nettoyage simple pour enlever les espaces excessifs
      const cleanedContent = bodyContent.replace(/\s+/g, ' ').trim();

      ctx.log.info(
        `Successfully fetched content from ${args.url}. Length: ${cleanedContent.length}`,
      );

      return {
        content: cleanedContent,
      };
    } catch (error) {
      const err = error as Error;
      ctx.log.error({ err }, `Failed to browse website: ${args.url}`);
      throw new UserError(`Error Browse ${args.url}: ${err.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  },
  name: 'browseWebsite',
  output: browseWebsiteOutput,

  parameters: browseWebsiteParams,
};
