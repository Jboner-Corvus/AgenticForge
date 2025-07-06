import { randomUUID } from 'crypto';
import { Context } from 'fastmcp';
// src/tools/browser/navigate.tool.ts (Corrigé pour SessionData)
import { z } from 'zod';

import type { SessionData, Tool } from '../../types.js';

export const navigateParams = z.object({
  url: z.string().url().describe('The full URL to navigate to.'),
});

export async function navigateWorkerLogic(
  args: z.infer<typeof navigateParams>,
) {
  const { chromium } = await import('playwright');
  let browser = null;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();

    await page.goto(args.url, { waitUntil: 'domcontentloaded' });
    const title = await page.title();

    // Correction: prendre la capture et la convertir en base64 ensuite.
    const finalScreenshotBuffer = await page.screenshot();
    const finalScreenshot = finalScreenshotBuffer.toString('base64');

    return {
      message: `Successfully navigated to "${title}". URL: ${page.url()}`,
    };
  } finally {
    await browser?.close();
  }
}

export const navigateTool: Tool<typeof navigateParams> = {
  description:
    'Navigates a headless browser to a specified URL. This is an async task.',
  execute: async (args, ctx: Context<SessionData>) => {
    if (!ctx.session) throw new Error('Session not found');
    const job = await (ctx as any).taskQueue.add('browser_navigate', {
      // Correction: Utilisation correcte du type SessionData
      auth: ctx.session as SessionData,
      params: args,
      taskId: randomUUID(),
      toolName: 'browser_navigate',
    });
    ctx.log.info(`Queued browser navigation job. Job ID: ${job.id}`);
    return `Navigating to ${args.url}. I will get the content in the next step.`;
  },
  name: 'browser_navigate',
  parameters: navigateParams,
};
