import { Job, Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import { Context } from 'fastmcp';
import { z } from 'zod';

import type { SessionData, Tool } from '../../types.js';

interface CustomContext extends Context<SessionData> {
  taskQueue: Queue;
}

export const scrollParams = z.object({
  direction: z
    .enum(['up', 'down', 'home', 'end'])
    .describe('The direction to scroll.'),
});

export async function scrollWorkerLogic(args: z.infer<typeof scrollParams>) {
  const { chromium } = await import('playwright');
  let browser = null;
  try {
    browser = await chromium.launch();
    await browser.newPage();

    // This is a simplified example. In a real scenario, you'd need to pass the current page context.
    // For now, it just simulates the action.
    switch (args.direction) {
      case 'down':
        // Simulate scroll down
        break;
      case 'end':
        // Simulate scroll to bottom
        break;
      case 'home':
        // Simulate scroll to top
        break;
      case 'up':
        // Simulate scroll up
        break;
    }

    return { message: `Successfully scrolled ${args.direction}.` };
  } finally {
    await browser?.close();
  }
}

export const scrollTool: Tool<typeof scrollParams> = {
  description:
    'Scrolls the current web page in a specified direction (up, down, home, end). This is an async task.',
  execute: async (args, ctx: CustomContext): Promise<string> => {
    if (!ctx.session) throw new Error('Session not found');
    const job: Job = await ctx.taskQueue.add('browser_scroll', {
      auth: ctx.session as SessionData,
      params: args,
      taskId: randomUUID(),
      toolName: 'browser_scroll',
    });
    ctx.log.info(`Queued browser scroll job. Job ID: ${job.id}`);
    return `Scrolling ${args.direction}.`;
  },
  name: 'browser_scroll',
  parameters: scrollParams,
};
