import { z } from 'zod';
import type { Tool } from '../../../../types.ts';

const WebAutomationParams = z.object({
  action: z.enum([
    'navigate',      // Go to URL
    'click',         // Click element
    'type',          // Type text
    'get_content',   // Get page content
    'screenshot',    // Take screenshot
    'wait',          // Wait for element
    'evaluate',      // Run JavaScript
    'set_viewport'   // Set viewport size
  ]).describe('Web automation action to perform'),
  url: z.string()
    .optional()
    .describe('URL to navigate to (required for navigate action)'),
  selector: z.string()
    .optional()
    .describe('CSS selector for element interaction'),
  text: z.string()
    .optional()
    .describe('Text to type (required for type action)'),
  script: z.string()
    .optional()
    .describe('JavaScript code to evaluate (required for evaluate action)'),
  width: z.number()
    .optional()
    .describe('Viewport width (required for set_viewport)'),
  height: z.number()
    .optional()
    .describe('Viewport height (required for set_viewport)'),
  timeout: z.number()
    .optional()
    .default(30000)
    .describe('Timeout in milliseconds'),
});

export const webAutomationTool: Tool<typeof WebAutomationParams> = {
  description: 'Comprehensive web automation tool - navigate, interact, and extract data from websites',

  execute: async (params, context) => {
    const { log } = context;
    const parsedParams = WebAutomationParams.parse(params);

    try {
      log.info('Web automation action', {
        action: parsedParams.action,
        url: parsedParams.url,
        selector: parsedParams.selector
      });

      // Import Playwright dynamically to avoid loading it unless needed
      const { chromium } = await import('playwright');

      // Launch browser
      const browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();

      try {
        let result: any = { success: true, action: parsedParams.action };

        switch (parsedParams.action) {
          case 'navigate':
            if (!parsedParams.url) {
              throw new Error('URL is required for navigate action');
            }
            await page.goto(parsedParams.url, { timeout: parsedParams.timeout });
            result.url = parsedParams.url;
            result.title = await page.title();
            break;

          case 'click':
            if (!parsedParams.selector) {
              throw new Error('Selector is required for click action');
            }
            await page.waitForSelector(parsedParams.selector, { timeout: parsedParams.timeout });
            await page.click(parsedParams.selector);
            result.selector = parsedParams.selector;
            break;

          case 'type':
            if (!parsedParams.selector || parsedParams.text === undefined) {
              throw new Error('Selector and text are required for type action');
            }
            await page.waitForSelector(parsedParams.selector, { timeout: parsedParams.timeout });
            await page.fill(parsedParams.selector, parsedParams.text);
            result.selector = parsedParams.selector;
            result.textLength = parsedParams.text.length;
            break;

          case 'get_content':
            const content = await page.content();
            result.content = content;
            result.contentLength = content.length;
            break;

          case 'screenshot':
            const screenshot = await page.screenshot({ type: 'png' });
            result.screenshot = screenshot.toString('base64');
            result.screenshotSize = screenshot.length;
            break;

          case 'wait':
            if (!parsedParams.selector) {
              throw new Error('Selector is required for wait action');
            }
            await page.waitForSelector(parsedParams.selector, { timeout: parsedParams.timeout });
            result.selector = parsedParams.selector;
            break;

          case 'evaluate':
            if (!parsedParams.script) {
              throw new Error('Script is required for evaluate action');
            }
            const evalResult = await page.evaluate(parsedParams.script);
            result.script = parsedParams.script;
            result.result = evalResult;
            break;

          case 'set_viewport':
            if (!parsedParams.width || !parsedParams.height) {
              throw new Error('Width and height are required for set_viewport action');
            }
            await page.setViewportSize({
              width: parsedParams.width,
              height: parsedParams.height
            });
            result.viewport = { width: parsedParams.width, height: parsedParams.height };
            break;

          default:
            throw new Error(`Unsupported action: ${parsedParams.action}`);
        }

        return result;

      } finally {
        await browser.close();
      }

    } catch (error) {
      log.error({ err: error, params: parsedParams }, 'Web automation error');
      throw new Error(
        `Web automation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },

  name: 'web_automation',
  parameters: WebAutomationParams,
};