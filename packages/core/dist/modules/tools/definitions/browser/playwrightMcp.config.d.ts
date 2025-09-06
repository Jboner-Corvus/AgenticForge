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
interface StealthConfig {
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
interface PlaywrightMcpConfig {
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
/**
 * Get Playwright MCP configuration
 * Can be overridden by environment variables or external config
 */
declare function getPlaywrightMcpConfig(): PlaywrightMcpConfig;
/**
 * Update configuration at runtime (for testing or dynamic changes)
 */
declare function updatePlaywrightMcpConfig(updates: Partial<PlaywrightMcpConfig>): void;
/**
 * Generate random realistic user agent
 */
declare function generateRandomUserAgent(): string;
/**
 * Generate random screen resolution
 */
declare function generateRandomResolution(): {
    width: number;
    height: number;
};
/**
 * Generate random timezone
 */
declare function generateRandomTimezone(): string;
/**
 * Generate random language preference
 */
declare function generateRandomLanguage(): string[];
/**
 * Generate fake WebGL renderer info
 */
declare function generateFakeWebGLRenderer(): {
    renderer: string;
    vendor: string;
};
/**
 * Generate human-like typing delays (milliseconds)
 */
declare function generateHumanTypingDelay(): number;
/**
 * Generate stealth browser launch arguments
 */
declare function getStealthLaunchArgs(): string[];

export { type AutoScreenshotConfig, type PlaywrightMcpConfig, type StealthConfig, generateFakeWebGLRenderer, generateHumanTypingDelay, generateRandomLanguage, generateRandomResolution, generateRandomTimezone, generateRandomUserAgent, getPlaywrightMcpConfig, getStealthLaunchArgs, updatePlaywrightMcpConfig };
