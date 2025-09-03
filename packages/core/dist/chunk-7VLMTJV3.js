import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/modules/tools/definitions/browser/playwrightMcp.config.ts
init_esm_shims();
var DEFAULT_CONFIG = {
  browser: {
    headless: true,
    launchOptions: {
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-extensions",
        "--disable-plugins",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
        "--memory-pressure-off"
      ],
      timeout: 3e4
    }
  },
  screenshots: {
    enabled: true,
    frequency: "all",
    // 'all', 'major', 'minimal'
    maxScreenshotsPerMinute: 10,
    screenshotCooldown: 2e3,
    // 2 seconds minimum between screenshots
    quality: 80,
    maxRetries: 2
  }
};
function getPlaywrightMcpConfig() {
  const headless = process.env.PLAYWRIGHT_HEADLESS !== "false";
  const screenshotEnabled = process.env.PLAYWRIGHT_AUTO_SCREENSHOTS !== "false";
  const screenshotFrequency = process.env.PLAYWRIGHT_SCREENSHOT_FREQUENCY || "all";
  const maxScreenshots = parseInt(process.env.PLAYWRIGHT_MAX_SCREENSHOTS_PER_MINUTE || "10");
  const screenshotCooldown = parseInt(process.env.PLAYWRIGHT_SCREENSHOT_COOLDOWN || "2000");
  return {
    ...DEFAULT_CONFIG,
    browser: {
      ...DEFAULT_CONFIG.browser,
      headless
    },
    screenshots: {
      ...DEFAULT_CONFIG.screenshots,
      enabled: screenshotEnabled,
      frequency: screenshotFrequency,
      maxScreenshotsPerMinute: maxScreenshots,
      screenshotCooldown
    }
  };
}
function updatePlaywrightMcpConfig(updates) {
  console.warn("Runtime config updates not yet implemented");
}

export {
  getPlaywrightMcpConfig,
  updatePlaywrightMcpConfig
};
