/**
 * Configuration for Playwright MCP Tools
 * Controls automatic screenshot behavior and other settings
 */

export interface AutoScreenshotConfig {
  /** Whether automatic screenshots are enabled */
  enabled: boolean;
  /** Frequency of screenshots: 'all', 'major', 'minimal' */
  frequency: 'all' | 'major' | 'minimal';
  /** Maximum screenshots per minute to prevent spam */
  maxScreenshotsPerMinute: number;
  /** Minimum time between screenshots in milliseconds */
  screenshotCooldown: number;
  /** Quality for automatic screenshots (1-100) */
  quality: number;
  /** Maximum retries for screenshot capture */
  maxRetries: number;
}

export interface PlaywrightMcpConfig {
  browser: {
    headless: boolean;
    launchOptions?: {
      args?: string[];
      timeout?: number;
    };
  };
  screenshots: AutoScreenshotConfig;
}

const DEFAULT_CONFIG: PlaywrightMcpConfig = {
  browser: {
    headless: true,
    launchOptions: {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--memory-pressure-off'
      ],
      timeout: 30000
    }
  },
  screenshots: {
    enabled: true,
    frequency: 'all', // 'all', 'major', 'minimal'
    maxScreenshotsPerMinute: 10,
    screenshotCooldown: 2000, // 2 seconds minimum between screenshots
    quality: 80,
    maxRetries: 2
  }
};

/**
 * Get Playwright MCP configuration
 * Can be overridden by environment variables or external config
 */
export function getPlaywrightMcpConfig(): PlaywrightMcpConfig {
  // Check for environment variable overrides
  const headless = process.env.PLAYWRIGHT_HEADLESS !== 'false'; // Default to true
  const screenshotEnabled = process.env.PLAYWRIGHT_AUTO_SCREENSHOTS !== 'false'; // Default to true
  const screenshotFrequency = (process.env.PLAYWRIGHT_SCREENSHOT_FREQUENCY as 'all' | 'major' | 'minimal') || 'all';
  const maxScreenshots = parseInt(process.env.PLAYWRIGHT_MAX_SCREENSHOTS_PER_MINUTE || '10');
  const screenshotCooldown = parseInt(process.env.PLAYWRIGHT_SCREENSHOT_COOLDOWN || '2000');

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
      screenshotCooldown: screenshotCooldown
    }
  };
}

/**
 * Update configuration at runtime (for testing or dynamic changes)
 */
export function updatePlaywrightMcpConfig(updates: Partial<PlaywrightMcpConfig>): void {
  // This would require modifying the DEFAULT_CONFIG or storing config in a mutable way
  // For now, this is a placeholder for future enhancement
  console.warn('Runtime config updates not yet implemented');
}