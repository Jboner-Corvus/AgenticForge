import { z } from 'zod';
import * as cheerio from 'cheerio';
import { Readability } from '@mozilla/readability';

import type { Ctx, Tool } from '../../../../types.js';

export const webNavigateParams = z.object({
  url: z.string().url().describe('The URL to navigate to.'),
  action: z.enum(['summarize', 'extract_text', 'get_title']).optional()
    .describe('The action to perform on the page. Default is summarize.'),
});

export const webNavigateOutput = z.object({
  result: z.string().describe('The result of the navigation and action.'),
});

export const webNavigateTool: Tool<
  typeof webNavigateParams,
  typeof webNavigateOutput
> = {
  description:
    'Navigates to a web page and performs an action like summarizing content, extracting text, or getting the title.',
  execute: async (args: z.infer<typeof webNavigateParams>, ctx: Ctx) => {
    try {
      ctx.log.info(`Navigating to: "${args.url}"`);
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      // Fetch the page content with timeout
      const response = await fetch(args.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AgenticForge/1.0; +https://example.com/bot)'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      let result = '';
      
      switch (args.action) {
        case 'get_title':
          result = $('title').text() || 'No title found';
          break;
          
        case 'extract_text':
          // Remove script and style elements
          $('script, style').remove();
          result = $('body').text().replace(/\s+/g, ' ').trim();
          // Limit the text length to prevent overly long responses
          if (result.length > 2000) {
            result = result.substring(0, 2000) + '...';
          }
          break;
          
        case 'summarize':
        default:
          // Try to use Readability for better content extraction
          try {
            const doc = {
              title: $('title').text(),
              content: html
            };
            
            // @ts-ignore - Readability types are not perfect
            const reader = new Readability(doc);
            const article = reader.parse();
            
            if (article && article.textContent) {
              // Summarize by taking first 500 characters
              result = article.textContent.substring(0, 500) + '...';
            } else {
              // Fallback to simple text extraction
              $('script, style').remove();
              const text = $('body').text().replace(/\s+/g, ' ').trim();
              result = text.substring(0, 500) + '...';
            }
          } catch (readabilityError) {
            // Fallback to simple text extraction
            $('script, style').remove();
            const text = $('body').text().replace(/\s+/g, ' ').trim();
            result = text.substring(0, 500) + '...';
          }
          break;
      }
      
      if (!result) {
        result = 'No content found on the page.';
      }
      
      return { result };
    } catch (error: unknown) {
      ctx.log.error(
        { err: error },
        'Failed to navigate to web page.',
      );
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          result: 'Request timed out while trying to navigate to the web page.'
        };
      }
      return {
        result: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
  name: 'webNavigate',
  parameters: webNavigateParams,
};