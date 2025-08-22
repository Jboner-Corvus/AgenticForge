// packages/core/src/modules/tools/definitions/web/browserManager.ts
import { getLogger } from '../../../../logger.ts';

let browser: any | null = null;
let chromium: any | null = null;

// Dynamically import Playwright to handle potential import errors
try {
  const playwright = await import('playwright-core');
  chromium = playwright.chromium;
} catch (error) {
  console.error('Failed to import Playwright:', error);
  getLogger().error('Failed to import Playwright:', error);
}

export async function closeBrowser(): Promise<void> {
  if (browser && browser.close) {
    getLogger().info('Closing browser instance...');
    await browser.close();
    browser = null;
    getLogger().info('Browser instance closed.');
  }
}

export async function getBrowser(): Promise<any> {
  if (!chromium) {
    throw new Error('Playwright is not available');
  }
  
  if (!browser) {
    getLogger().info('Launching new browser instance...');
    browser = await chromium.launch({});
    getLogger().info('Browser instance launched.');
  }
  return browser;
}
