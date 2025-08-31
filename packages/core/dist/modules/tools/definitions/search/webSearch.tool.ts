import puppeteer from 'puppeteer';
import { z } from 'zod';

import type { Ctx, Tool } from '../../../../types.ts';

export const webSearchParams = z.object({
  query: z.string().describe('The search query.'),
});

export const webSearchOutput = z.object({
  screenshot: z
    .string()
    .describe('A base64 encoded screenshot of the search results page.'),
  summary: z.string().describe('A summary of the search results.'),
});

export const webSearchTool: Tool<
  typeof webSearchParams,
  typeof webSearchOutput
> = {
  description:
    'Performs a web search using Puppeteer to get up-to-date information and a screenshot.',
  execute: async (args: z.infer<typeof webSearchParams>, ctx: Ctx) => {
    let browser;
    try {
      ctx.log.info(`Performing web search for: "${args.query}"`);
      browser = await puppeteer.launch({
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process', // <- this one doesn't works in Windows
          '--disable-gpu',
        ],
        headless: true,
      });
      const page = await browser.newPage();
      await page.goto(
        `https://www.google.com/search?q=${encodeURIComponent(args.query)}`,
        { waitUntil: 'networkidle2' },
      );

      const screenshotBuffer = await page.screenshot({ encoding: 'base64' });
      const screenshotBase64 = screenshotBuffer.toString();

      const searchResults = await page.evaluate(() => {
        const results = Array.from(document.querySelectorAll('div.g'));
        return results.map((result) => {
          const titleElement = result.querySelector('h3');
          const urlElement = result.querySelector('a');
          const descriptionElement = result.querySelector('span.st');

          return {
            description: descriptionElement
              ? (descriptionElement as HTMLElement).innerText
              : '',
            title: titleElement ? (titleElement as HTMLElement).innerText : '',
            url: urlElement ? urlElement.getAttribute('href') : '',
          };
        });
      });

      const summary = searchResults
        .filter((r) => r.title && r.url) // Filter out results without title or URL
        .map((r) => `### [${r.title}](${r.url})\n${r.description}`)
        .join('\n\n');

      return { screenshot: screenshotBase64, summary };
    } catch (error: unknown) {
      ctx.log.error(
        { err: error },
        'Failed to perform web search with Puppeteer.',
      );
      return {
        screenshot: '', // Return empty screenshot on error
        summary: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
      };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  },
  name: 'webSearch',
  parameters: webSearchParams,
};
