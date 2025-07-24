// packages/core/src/modules/tools/definitions/web/browserManager.ts
import { Browser, chromium } from 'playwright';

import logger from '../../../../logger.js';

let browser: Browser | null = null;

export async function closeBrowser(): Promise<void> {
  if (browser) {
    logger.info('Closing browser instance...');
    await browser.close();
    browser = null;
    logger.info('Browser instance closed.');
  }
}

export async function getBrowser(): Promise<Browser> {
  if (!browser) {
    logger.info('Launching new browser instance...');
    browser = await chromium.launch({});
    logger.info('Browser instance launched.');
  }
  return browser;
}
