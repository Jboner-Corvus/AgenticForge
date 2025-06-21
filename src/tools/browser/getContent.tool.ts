/**
 * src/tools/browser/getContent.tool.ts
 *
 * Outil pour extraire le contenu textuel d'une page web.
 */
import { z } from 'zod';
import type { Tool, Ctx } from '@fastmcp/fastmcp';
import { taskQueue } from '../../queue.js';
import type { AgentSession } from '../../types.js';

export const getContentParams = z.object({
  url: z.string().url().describe('The URL of the page to scrape.'),
});

export const getContentTool: Tool<typeof getContentParams> = {
  name: 'browser_getContent',
  description: 'Extracts the visible text content from a web page.',
  parameters: getContentParams,
  execute: async (args, ctx: Ctx<AgentSession>) => {
    const job = await taskQueue.add('browser_getContent', {
      toolName: 'browser_getContent',
      toolArgs: args,
      session: ctx.session,
    });
    ctx.log.info({ jobId: job.id, url: args.url }, 'Queued browser get content job.');
    return `Getting content from ${args.url}. The result will be available shortly.`;
  },
  workerExecute: async (args, _ctx: Ctx) => {
    const { chromium } = await import('playwright');
    let browser = null;
    try {
      browser = await chromium.launch();
      const page = await browser.newPage();
      await page.goto(args.url, { waitUntil: 'networkidle' });
      // Supprime les scripts et les styles pour ne garder que le contenu textuel
      await page.evaluate(() => {
        document
          .querySelectorAll('script, style, noscript, svg, header, footer, nav')
          .forEach((el) => el.remove());
      });
      const content = await page.locator('body').innerText();
      // Nettoie les espaces multiples et les lignes vides
      return content
        .replace(/\s\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();
    } finally {
      await browser?.close();
    }
  },
};
