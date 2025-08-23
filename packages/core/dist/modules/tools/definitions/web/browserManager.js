import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  getLogger
} from "../../../../chunk-5JE7E5SU.js";
import "../../../../chunk-DVHMHG4X.js";
import {
  init_esm_shims
} from "../../../../chunk-SB7UONON.js";

// src/modules/tools/definitions/web/browserManager.ts
init_esm_shims();
var browser = null;
var chromium = null;
try {
  const playwright = await import("../../../../playwright-core-HKJS6OPG.js");
  chromium = playwright.chromium;
} catch (error) {
  console.error("Failed to import Playwright:", error);
  getLogger().error("Failed to import Playwright:", error);
}
async function closeBrowser() {
  if (browser && browser.close) {
    getLogger().info("Closing browser instance...");
    await browser.close();
    browser = null;
    getLogger().info("Browser instance closed.");
  }
}
async function getBrowser() {
  if (!chromium) {
    throw new Error("Playwright is not available");
  }
  if (!browser) {
    getLogger().info("Launching new browser instance...");
    browser = await chromium.launch({});
    getLogger().info("Browser instance launched.");
  }
  return browser;
}
export {
  closeBrowser,
  getBrowser
};
