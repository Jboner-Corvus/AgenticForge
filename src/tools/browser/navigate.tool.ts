/**
 * src/tools/browser/navigate.tool.ts
 *
 * Outil pour naviguer vers une URL donnée avec Playwright.
 * Cette tâche est asynchrone et gérée par le worker.
 */
import { z } from 'zod';
import type { Tool, Ctx } from '@fastmcp/fastmcp';
import { taskQueue } from '../../queue.js';
import type { AgentSession } from '../../types.js';

export const navigateParams = z.object({
  url: z.string().url().describe('The full URL to navigate to.'),
});

export const navigateTool: Tool<typeof navigateParams> = {
  name: 'browser_navigate',
  description: 'Navigates a headless browser to a specified URL.',
  parameters: navigateParams,
  // La fonction execute du serveur met simplement le job en file d'attente
  execute: async (args, ctx: Ctx<AgentSession>) => {
    const job = await taskQueue.add('browser_navigate', {
      toolName: 'browser_navigate',
      toolArgs: args,
      session: ctx.session,
    });
    ctx.log.info({ jobId: job.id, url: args.url }, 'Queued browser navigation job.');
    return `Navigating to ${args.url}. I will get the content in the next step.`;
  },
  // La vraie logique est dans une fonction `workerExecute` qui sera appelée par le worker
  workerExecute: async (args, _ctx: Ctx) => {
    // Note: This is a conceptual separation. In reality, the worker's
    // logic would need a browser manager. For simplicity, we'll implement
    // this as a standalone function for now.
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
  },
};
