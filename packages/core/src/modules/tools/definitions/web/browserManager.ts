// packages/core/src/modules/tools/definitions/web/browserManager.ts
import { Browser, chromium } from 'playwright-core';

import { getLogger } from '../../../../logger.js';

let browser: Browser | null = null;

export async function closeBrowser(): Promise<void> {
  if (browser) {
    getLogger().info('Closing browser instance...');
    await browser.close();
    browser = null;
    getLogger().info('Browser instance closed.');
  }
}

export async function getBrowser(): Promise<Browser> {
  if (!browser) {
    getLogger().info('Launching new browser instance...');
    browser = await chromium.launch({});
    getLogger().info('Browser instance launched.');
  }
  return browser;
}
