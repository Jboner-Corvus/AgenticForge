import { z } from 'zod';
import { randomUUID } from 'crypto';
import type { Tool, Ctx, AuthData } from '../../types.js';
import { taskQueue } from '../../queue.js';

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
    return `Successfully navigated to "${title}". URL: ${page.url()}`;
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
      // CORRECTION: Ajout d'une assertion de type pour résoudre le conflit.
      auth: ctx.session.auth as AuthData | undefined,
      taskId: randomUUID(),
      toolName: 'browser_navigate',
    });
    ctx.log.info(`Queued browser navigation job. Job ID: ${job.id}`);
    return `Navigating to ${args.url}. I will get the content in the next step.`;
  },
};
