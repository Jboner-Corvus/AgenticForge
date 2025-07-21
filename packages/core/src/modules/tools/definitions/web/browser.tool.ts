import { chromium, Page } from 'playwright';
import { z } from 'zod';

import type { Ctx, Tool } from '../../../../types.js';

import { redis } from '../../../redis/redisClient.js';

export const parameters = z.object({
  url: z.string().url().describe('The URL to navigate to.'),
});

export const browserOutput = z.union([
  z.object({
    content: z.string(),
    url: z.string(),
  }),
  z.object({
    erreur: z.string(),
  }),
]);

async function getPageContent(page: Page): Promise<string> {
  const mainContent = await page.evaluate(() => {
    const main = document.querySelector('main') || document.body;
    return main.innerText;
  });
  return mainContent.replace(/\s\s+/g, ' ').trim();
}

const sendEvent = async (ctx: Ctx, type: string, data: unknown) => {
  if (ctx.job?.id) {
    const channel = `job:${ctx.job.id}:events`;
    const event = JSON.stringify({ data, type });
    await redis.publish(channel, event);
    ctx.log.info({ channel, event }, 'Published event to Redis');
  }
};

export const browserTool: Tool<typeof parameters, typeof browserOutput> = {
  description:
    'Navigates to a URL using a headless Chromium browser and returns its textual content. Ideal for modern websites with JavaScript.',
  execute: async (args: z.infer<typeof parameters>, ctx: Ctx) => {
    ctx.log.info(`Navigating to URL: ${args.url}`);
    await sendEvent(ctx, 'browser.navigating', { url: args.url });

    let browser;
    try {
      ctx.log.info('Launching browser...');
      browser = await chromium.launch({});
      ctx.log.info('Browser launched.');

      const page = await browser.newPage();
      ctx.log.info('New page created.');
      await sendEvent(ctx, 'browser.page.created', {});

      ctx.log.info(`Going to ${args.url}...`);
      await page.goto(args.url, {
        timeout: 30000, // 30 seconds
        waitUntil: 'domcontentloaded',
      });
      ctx.log.info(`Page loaded: ${args.url}`);
      await sendEvent(ctx, 'browser.page.loaded', { url: args.url });

      const content = await getPageContent(page);
      ctx.log.info(
        `Successfully retrieved content from ${args.url}. Length: ${content.length}`,
      );
      await sendEvent(ctx, 'browser.content.extracted', {
        length: content.length,
      });

      return {
        content: content,
        url: args.url,
      };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      ctx.log.error({ err }, `Failed to browse ${args.url}`);
      await sendEvent(ctx, 'browser.error', {
        message: err.message,
        url: args.url,
      });
      return { erreur: `Error while Browse ${args.url}: ${err.message}` };
    } finally {
      if (browser) {
        try {
          ctx.log.info('Closing browser...');
          await browser.close();
          ctx.log.info('Browser closed.');
        } catch (e) {
          ctx.log.error(e, 'Failed to close browser');
        }
      }
      await sendEvent(ctx, 'browser.closed', {});
    }
  },
  name: 'browser',
  parameters,
};
