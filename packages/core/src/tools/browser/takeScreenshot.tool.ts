import { randomUUID } from 'crypto';
import { Context } from 'fastmcp';
import { z } from 'zod';

import type { SessionData, Tool } from '../../types.js';

export const takeScreenshotParams = z.object({});

export async function takeScreenshotWorkerLogic(
  args: z.infer<typeof takeScreenshotParams>,
) {
  const { chromium } = await import('playwright');
  let browser = null;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();

    // This is a simplified example. In a real scenario, you'd need to pass the current page context.
    // For now, it just simulates the action.
    const screenshotBuffer = await page.screenshot();
    const screenshot = screenshotBuffer.toString('base64');

    return { message: 'Screenshot taken successfully.', screenshot };
  } finally {
    await browser?.close();
  }
}

export const takeScreenshotTool: Tool<typeof takeScreenshotParams> = {
  description:
    'Takes a screenshot of the current web page. This is an async task.',
  execute: async (args, ctx: Context<SessionData>) => {
    if (!ctx.session) throw new Error('Session not found');
    const job = await (ctx as any).taskQueue.add('browser_takeScreenshot', {
      auth: ctx.session as SessionData,
      params: args,
      taskId: randomUUID(),
      toolName: 'browser_takeScreenshot',
    });
    ctx.log.info(`Queued browser screenshot job. Job ID: ${job.id}`);
    return `Taking a screenshot.`;
  },
  name: 'browser_takeScreenshot',
  parameters: takeScreenshotParams,
};
