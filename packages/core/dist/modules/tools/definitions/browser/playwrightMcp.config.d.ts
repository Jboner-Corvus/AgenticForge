/**
 * Configuration for Playwright MCP Tools
 * Controls automatic screenshot behavior and other settings
 */
interface AutoScreenshotConfig {
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
interface PlaywrightMcpConfig {
    browser: {
        headless: boolean;
        launchOptions?: {
            args?: string[];
            timeout?: number;
        };
    };
    screenshots: AutoScreenshotConfig;
}
/**
 * Get Playwright MCP configuration
 * Can be overridden by environment variables or external config
 */
declare function getPlaywrightMcpConfig(): PlaywrightMcpConfig;
/**
 * Update configuration at runtime (for testing or dynamic changes)
 */
declare function updatePlaywrightMcpConfig(updates: Partial<PlaywrightMcpConfig>): void;

export { type AutoScreenshotConfig, type PlaywrightMcpConfig, getPlaywrightMcpConfig, updatePlaywrightMcpConfig };
