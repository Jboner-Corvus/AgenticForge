/// <reference types="playwright" />

import type { Page } from 'playwright';
import { z } from 'zod';
import { fileURLToPath } from 'url';
import path from 'path';

import { getBrowser } from './browserManager.js';
import { getRedisClientInstance } from '../../../../modules/redis/redisClient.js';
import type { Ctx, Tool } from '../../../../types.js';

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
    await getRedisClientInstance().publish(channel, event);
    ctx.log.info({ channel, event }, 'Published event to Redis');
  }
};

export const browserTool: Tool<typeof parameters, typeof browserOutput> = {
  description:
    'Navigates to a URL using a headless Chromium browser and returns its textual content. Ideal for modern websites with JavaScript.',
  execute: async (args: z.infer<typeof parameters>, ctx: Ctx) => {
    ctx.log.info(`Navigating to URL: ${args.url}`);
    await sendEvent(ctx, 'browser.navigating', { url: args.url });

    let page;
    try {
      const browser = await getBrowser();
      page = await browser.newPage();
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

      await page.close();
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
      if (page) {
        await page.close();
      }
      return { erreur: `Error while Browse ${args.url}: ${err.message}` };
    }
  },
  name: 'browser',
  parameters,
};
