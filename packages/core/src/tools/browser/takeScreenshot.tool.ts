import { Job } from 'bullmq';
import { randomUUID } from 'crypto';
import { z } from 'zod';

import { Ctx, SessionData, Tool } from '../../types.js';

export const takeScreenshotParams = z.object({});

export async function takeScreenshotWorkerLogic(
  _args: z.infer<typeof takeScreenshotParams>,
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
  execute: async (args: unknown, ctx: Ctx) => {
    const params = args as z.infer<typeof takeScreenshotParams>;
    if (!ctx.session) throw new Error('Session not found');
    const job: Job = await ctx.taskQueue.add('browser_takeScreenshot', {
      auth: ctx.session as SessionData,
      params: params,
      taskId: randomUUID(),
      toolName: 'browser_takeScreenshot',
    });
    ctx.log.info(`Queued browser screenshot job. Job ID: ${job.id}`);
    return { message: `Taking a screenshot.` };
  },
  name: 'browser.takeScreenshot',
  output: z.object({ message: z.string(), screenshot: z.string() }), // Assuming a simple output schema
  parameters: takeScreenshotParams,
};
