// src/tools/browser/navigate.tool.ts (Corrigé pour SessionData)
import { z } from 'zod';
import { randomUUID } from 'crypto';
import type { Tool, Ctx, SessionData } from '../../types.js';
import { jobQueue } from '../../queue.js';

export const navigateParams = z.object({
  url: z.string().url().describe('The full URL to navigate to.'),
});

export async function navigateWorkerLogic(
  args: z.infer<typeof navigateParams>,
  _ctx: Ctx,
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
      screenshots: [{ step: 'after', image: finalScreenshot }],
    };
  } finally {
    await browser?.close();
  }
}

export const navigateTool: Tool<typeof navigateParams> = {
  name: 'browser_navigate',
  description:
    'Navigates a headless browser to a specified URL. This is an async task.',
  parameters: navigateParams,
  execute: async (args, ctx: Ctx) => {
    if (!ctx.session) throw new Error('Session not found');
    const job = await taskQueue.add('browser_navigate', {
      params: args,
      // Correction: Utilisation correcte du type SessionData
      auth: ctx.session as SessionData,
      taskId: randomUUID(),
      toolName: 'browser_navigate',
    });
    ctx.log.info(`Queued browser navigation job. Job ID: ${job.id}`);
    return `Navigating to ${args.url}. I will get the content in the next step.`;
  },
};
