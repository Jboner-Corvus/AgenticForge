import { randomUUID } from 'crypto';
import { Context } from 'fastmcp';
import { Page } from 'playwright';
// src/tools/browser/getContent.tool.ts (Corrigé pour SessionData)
import { z } from 'zod';

import type { SessionData, Tool } from '../../types.js';

export const getContentParams = z.object({
  url: z.string().url().describe('The URL of the page to scrape.'),
});

export async function getContentWorkerLogic(
  args: z.infer<typeof getContentParams>,
) {
  const { chromium } = await import('playwright');
  let browser = null;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(args.url, { waitUntil: 'networkidle' });
    const content = await getPageContent(page);
    return content
      .replace(/\s\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  } finally {
    await browser?.close();
  }
}

async function getPageContent(page: Page) {
  return page.evaluate(() => {
    document
      .querySelectorAll('script, style, noscript, svg, header, footer, nav')
      .forEach((el) => el.remove());
    return document.body.innerText;
  });
}

export const getContentTool: Tool<typeof getContentParams> = {
  description:
    'Extracts the visible text content from a web page. This is an async task.',
  execute: async (args, ctx: Context<SessionData>) => {
    if (!ctx.session) throw new Error('Session not found');
    const job = await (ctx as any).taskQueue.add('browser_getContent', {
      // CORRECTION: Utilisation correcte du type SessionData
      auth: ctx.session as SessionData,
      params: args,
      taskId: randomUUID(),
      toolName: 'browser_getContent',
    });
    ctx.log.info(`Queued browser get content job. Job ID: ${job.id}`);
    return `Getting content from ${args.url}. The result will be available shortly.`;
  },
  name: 'browser_getContent',
  parameters: getContentParams,
};