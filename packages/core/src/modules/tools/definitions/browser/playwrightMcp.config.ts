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

export interface StealthConfig {
  /** Enable complete stealth mode */
  enabled: boolean;
  /** Spoof user agent randomly */
  randomUserAgent: boolean;
  /** Hide webdriver property */
  hideWebdriver: boolean;
  /** Spoof canvas fingerprint */
  spoofCanvas: boolean;
  /** Fake WebGL renderer */
  fakeWebGL: boolean;
  /** Simulate real plugins */
  fakePlugins: boolean;
  /** Randomize screen resolution */
  randomizeResolution: boolean;
  /** Human-like mouse movements */
  humanMouseMovement: boolean;
  /** Variable typing speed */
  humanTyping: boolean;
  /** Proxy configuration */
  proxyRotation: boolean;
  /** Timezone spoofing */
  spoofTimezone: boolean;
  /** Language spoofing */
  spoofLanguage: boolean;
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
  stealth: StealthConfig;
}

const DEFAULT_CONFIG: PlaywrightMcpConfig = {
  browser: {
    headless: true,
    launchOptions: {
      args: [
        // Basic security args
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',

        // Anti-detection args
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor',
        '--disable-web-security',
        '--disable-infobars',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-default-apps',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-field-trial-config',
        '--disable-back-forward-cache',
        '--disable-ipc-flooding-protection',
        '--enable-features=NetworkService,NetworkServiceLogging',
        '--memory-pressure-off',
        '--max_old_space_size=4096',

        // Hide automation traces
        '--exclude-switches=enable-automation',
        '--disable-automation',
        '--no-default-browser-check',
        '--no-first-run',
        '--disable-component-extensions-with-background-pages',
        '--disable-background-networking',
        '--disable-sync',
        '--metrics-recording-only',
        '--disable-default-apps',
      ],
      timeout: 30000,
    },
  },
  screenshots: {
    enabled: true,
    frequency: 'all', // 'all', 'major', 'minimal'
    maxScreenshotsPerMinute: 10,
    screenshotCooldown: 2000, // 2 seconds minimum between screenshots
    quality: 80,
    maxRetries: 2,
  },
  stealth: {
    enabled: true,
    randomUserAgent: true,
    hideWebdriver: true,
    spoofCanvas: true,
    fakeWebGL: true,
    fakePlugins: true,
    randomizeResolution: true,
    humanMouseMovement: true,
    humanTyping: true,
    proxyRotation: false, // Disabled by default, enable when needed
    spoofTimezone: true,
    spoofLanguage: true,
  },
};

/**
 * Get Playwright MCP configuration
 * Can be overridden by environment variables or external config
 */
export function getPlaywrightMcpConfig(): PlaywrightMcpConfig {
  // Check for environment variable overrides
  const headless = process.env.PLAYWRIGHT_HEADLESS !== 'false'; // Default to true
  const screenshotEnabled = process.env.PLAYWRIGHT_AUTO_SCREENSHOTS !== 'false'; // Default to true
  const screenshotFrequency =
    (process.env.PLAYWRIGHT_SCREENSHOT_FREQUENCY as
      | 'all'
      | 'major'
      | 'minimal') || 'all';
  const maxScreenshots = parseInt(
    process.env.PLAYWRIGHT_MAX_SCREENSHOTS_PER_MINUTE || '10',
  );
  const screenshotCooldown = parseInt(
    process.env.PLAYWRIGHT_SCREENSHOT_COOLDOWN || '2000',
  );

  return {
    ...DEFAULT_CONFIG,
    browser: {
      ...DEFAULT_CONFIG.browser,
      headless,
    },
    screenshots: {
      ...DEFAULT_CONFIG.screenshots,
      enabled: screenshotEnabled,
      frequency: screenshotFrequency,
      maxScreenshotsPerMinute: maxScreenshots,
      screenshotCooldown: screenshotCooldown,
    },
  };
}

/**
 * Update configuration at runtime (for testing or dynamic changes)
 */
export function updatePlaywrightMcpConfig(
  updates: Partial<PlaywrightMcpConfig>,
): void {
  // This would require modifying the DEFAULT_CONFIG or storing config in a mutable way
  // For now, this is a placeholder for future enhancement
  console.warn('Runtime config updates not yet implemented');
}

/**
 * Generate random realistic user agent
 */
export function generateRandomUserAgent(): string {
  const userAgents = [
    // Chrome Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',

    // Chrome macOS
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',

    // Firefox Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:119.0) Gecko/20100101 Firefox/119.0',

    // Safari macOS
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',

    // Edge Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  ];

  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

/**
 * Generate random screen resolution
 */
export function generateRandomResolution(): { width: number; height: number } {
  const resolutions = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1536, height: 864 },
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
    { width: 1600, height: 900 },
    { width: 2560, height: 1440 },
    { width: 1920, height: 1200 },
  ];

  return resolutions[Math.floor(Math.random() * resolutions.length)];
}

/**
 * Generate random timezone
 */
export function generateRandomTimezone(): string {
  const timezones = [
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
    'America/Toronto',
    'Europe/Amsterdam',
  ];

  return timezones[Math.floor(Math.random() * timezones.length)];
}

/**
 * Generate random language preference
 */
export function generateRandomLanguage(): string[] {
  const languages = [
    ['en-US', 'en'],
    ['en-GB', 'en'],
    ['fr-FR', 'fr'],
    ['de-DE', 'de'],
    ['es-ES', 'es'],
    ['it-IT', 'it'],
    ['pt-BR', 'pt'],
    ['ru-RU', 'ru'],
    ['ja-JP', 'ja'],
    ['zh-CN', 'zh'],
  ];

  return languages[Math.floor(Math.random() * languages.length)];
}

/**
 * Generate fake WebGL renderer info
 */
export function generateFakeWebGLRenderer(): {
  renderer: string;
  vendor: string;
} {
  const renderers = [
    {
      renderer:
        'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
      vendor: 'Google Inc. (NVIDIA)',
    },
    {
      renderer:
        'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)',
      vendor: 'Google Inc. (Intel)',
    },
    {
      renderer:
        'ANGLE (AMD, AMD Radeon RX 6700 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
      vendor: 'Google Inc. (AMD)',
    },
    { renderer: 'Apple GPU', vendor: 'Apple Inc.' },
    { renderer: 'NVIDIA GeForce GTX 1660', vendor: 'NVIDIA Corporation' },
    { renderer: 'Intel Iris Xe Graphics', vendor: 'Intel Inc.' },
  ];

  return renderers[Math.floor(Math.random() * renderers.length)];
}

/**
 * Generate human-like typing delays (milliseconds)
 */
export function generateHumanTypingDelay(): number {
  // Human typing speed: 40-80 WPM = 200-500ms per character
  const baseDelay = Math.random() * 300 + 100; // 100-400ms base
  const variation = (Math.random() - 0.5) * 100; // ±50ms variation
  return Math.max(50, baseDelay + variation);
}

/**
 * Generate stealth browser launch arguments
 */
export function getStealthLaunchArgs(): string[] {
  return [
    // Essential stealth args
    '--disable-blink-features=AutomationControlled',
    '--exclude-switches=enable-automation',
    '--disable-automation',

    // Remove automation indicators
    '--disable-infobars',
    '--disable-web-security',
    '--disable-features=VizDisplayCompositor',
    '--disable-default-apps',
    '--no-default-browser-check',
    '--no-first-run',

    // Performance and stealth
    '--disable-extensions',
    '--disable-plugins',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-field-trial-config',
    '--disable-back-forward-cache',
    '--disable-ipc-flooding-protection',
    '--disable-component-extensions-with-background-pages',
    '--disable-background-networking',
    '--disable-sync',
    '--metrics-recording-only',

    // Memory and performance
    '--memory-pressure-off',
    '--max_old_space_size=4096',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
  ];
}
