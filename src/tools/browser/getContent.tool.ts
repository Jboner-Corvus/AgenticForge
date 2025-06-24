// src/tools/browser/getContent.tool.ts (Corrigé pour SessionData)
import { z } from 'zod';
import { randomUUID } from 'crypto';
import type { Tool, Ctx, SessionData } from '../../types.js';
import { taskQueue } from '../../queue.js';

export const getContentParams = z.object({
  url: z.string().url().describe('The URL of the page to scrape.'),
});

export async function getContentWorkerLogic(
  args: z.infer<typeof getContentParams>,
  _ctx: Ctx,
) {
  const { chromium } = await import('playwright');
  let browser = null;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(args.url, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      document
        .querySelectorAll('script, style, noscript, svg, header, footer, nav')
        .forEach((el) => el.remove());
    });
    const content = await page.locator('body').innerText();
    return content
      .replace(/\s\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  } finally {
    await browser?.close();
  }
}

export const getContentTool: Tool<typeof getContentParams> = {
  name: 'browser_getContent',
  description:
    'Extracts the visible text content from a web page. This is an async task.',
  parameters: getContentParams,
  execute: async (args, ctx: Ctx) => {
    if (!ctx.session) throw new Error('Session not found');
    const job = await taskQueue.add('browser_getContent', {
      params: args,
      // CORRECTION: Utilisation correcte du type SessionData
      auth: ctx.session as SessionData,
      taskId: randomUUID(),
      toolName: 'browser_getContent',
    });
    ctx.log.info(`Queued browser get content job. Job ID: ${job.id}`);
    return `Getting content from ${args.url}. The result will be available shortly.`;
  },
};