import { chromium, Page } from 'playwright';
import { z } from 'zod';

import type { Ctx, Tool } from '../../types.js';

export const parameters = z.object({
  url: z.string().url().describe('The URL to navigate to.'),
});

export const browserOutput = z.union([
  z.object({
    content: z.string(),
    url: z.string(),
  }),
  z.object({
    erreur: z.string(),
  }),
]);

async function getPageContent(page: Page): Promise<string> {
  const mainContent = await page.evaluate(() => {
    const main = document.querySelector('main') || document.body;
    return main.innerText;
  });
  return mainContent.replace(/\s\s+/g, ' ').trim();
}

export const browserTool: Tool<typeof parameters, typeof browserOutput> = {
  description:
    'Navigates to a URL using a headless Chromium browser and returns its textual content. Ideal for modern websites with JavaScript.',
  execute: async (args: z.infer<typeof parameters>, ctx: Ctx) => {
    ctx.log.info(`Navigating to URL: ${args.url}`);
    const browser = await chromium.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.goto(args.url, {
        timeout: 90000,
        waitUntil: 'domcontentloaded',
      });

      const content = await getPageContent(page);
      ctx.log.info(
        `Successfully retrieved content from ${args.url}. Length: ${content.length}`,
      );

      return {
        content: content,
        url: args.url,
      };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      ctx.log.error({ err }, `Failed to browse ${args.url}`);
      return { erreur: `Error while Browse ${args.url}: ${err.message}` };
    } finally {
      await browser.close();
    }
  },
  name: 'browser',
  parameters,
};
