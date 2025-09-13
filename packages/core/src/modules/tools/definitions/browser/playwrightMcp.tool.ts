import { z } from 'zod';
import { getLogger } from '../../../../logger.ts';
import { Tool, Ctx } from '../../../../types.ts';
import { getRedisClientInstance } from '../../../../modules/redis/redisClient.ts';

// Import Playwright directly
import { chromium, Browser, BrowserContext, Page } from 'playwright';

// Import configuration
import { getPlaywrightMcpConfig } from './playwrightMcp.config.ts';

const logger = getLogger().child({ module: 'PlaywrightTool' });

// Browser instance
let browser: Browser | null = null;
let context: BrowserContext | null = null;
let page: Page | null = null;
let isInitialized = false;

// Helper function to send events to UI
const sendEvent = async (ctx: Ctx, type: string, data: unknown) => {
  if (ctx.job?.id) {
    const channel = `job:${ctx.job.id}:events`;
    const event = JSON.stringify({
      type,
      data,
      timestamp: Date.now(),
      jobId: ctx.job.id,
      sessionId: ctx.session?.id,
    });
    await getRedisClientInstance().publish(channel, event);
    ctx.log.info({ channel, type, data }, 'Published event to Redis');

    // Also send browser events with a standardized format for the frontend
    if (type.startsWith('browser.')) {
      const browserEvent = JSON.stringify({
        type: 'browser.event',
        data: {
          type,
          data: data,
        },
        timestamp: Date.now(),
        jobId: ctx.job.id,
        sessionId: ctx.session?.id,
      });
      await getRedisClientInstance().publish(channel, browserEvent);
      ctx.log.info(
        { channel, type: 'browser.event', data },
        'Published browser event to Redis',
      );
    }
  }
};

// Get configuration from external config file
const config = getPlaywrightMcpConfig();
const AUTO_SCREENSHOT_CONFIG = config.screenshots;

// Track screenshot timing to prevent spam
let lastScreenshotTime = 0;
let screenshotCountThisMinute = 0;
let minuteStartTime = Date.now();

// Helper function to check if screenshot should be taken
const shouldTakeScreenshot = (action: string): boolean => {
  if (!AUTO_SCREENSHOT_CONFIG.enabled) return false;

  const now = Date.now();

  // Reset counter every minute
  if (now - minuteStartTime > 60000) {
    screenshotCountThisMinute = 0;
    minuteStartTime = now;
  }

  // Check rate limiting
  if (
    screenshotCountThisMinute >= AUTO_SCREENSHOT_CONFIG.maxScreenshotsPerMinute
  ) {
    return false;
  }

  // Check cooldown
  if (now - lastScreenshotTime < AUTO_SCREENSHOT_CONFIG.screenshotCooldown) {
    return false;
  }

  // Check frequency settings
  if (AUTO_SCREENSHOT_CONFIG.frequency === 'minimal') {
    return ['navigate', 'click', 'type', 'screenshot'].includes(action);
  } else if (AUTO_SCREENSHOT_CONFIG.frequency === 'major') {
    return !['waitForSelector', 'getContent'].includes(action);
  }

  // 'all' frequency - take screenshot for all actions
  return true;
};

// Helper function to capture screenshot and send to UI with enhanced robustness
const captureAndSendScreenshot = async (
  ctx: Ctx,
  action: string,
  selector?: string,
  retries = 3,
) => {
  // Check if we should take a screenshot
  if (!shouldTakeScreenshot(action)) {
    logger.debug(
      { action },
      'Screenshot skipped due to rate limiting or configuration',
    );
    return false;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Ensure page is ready and loaded
      if (!page || !page.isClosed()) {
        await initializeBrowser();
      }

      if (!page) {
        throw new Error('Browser page not available');
      }

      // Wait for page to be ready
      await page.waitForLoadState('domcontentloaded', { timeout: 5000 });

      // Take screenshot with error handling (no quality option for PNG)
      const screenshotResult = await executePlaywrightAction('screenshot', {
        fullPage: false,
        timeout: 10000,
      });

      let screenshotBuffer: Buffer | null = null;

      if (screenshotResult?.result) {
        if (Buffer.isBuffer(screenshotResult.result)) {
          screenshotBuffer = screenshotResult.result;
        } else if (
          typeof screenshotResult.result === 'object' &&
          screenshotResult.result.type === 'Buffer' &&
          Array.isArray(screenshotResult.result.data)
        ) {
          // Handle serialized Buffer from MCP
          screenshotBuffer = Buffer.from(screenshotResult.result.data);
        }
      }

      if (screenshotBuffer) {
        // Convert buffer to base64
        const base64Data = screenshotBuffer.toString('base64');

        // Validate base64 data
        if (base64Data && base64Data.length > 100) {
          // Update rate limiting counters
          lastScreenshotTime = Date.now();
          screenshotCountThisMinute++;

          await sendEvent(ctx, 'browser.screenshot.realtime', {
            imageData: base64Data,
            action: action,
            selector: selector,
            timestamp: Date.now(),
            attempt: attempt,
            automatic: true,
          });

          logger.info(
            { action, selector, attempt, bufferSize: screenshotBuffer.length },
            'Automatic screenshot captured and sent successfully',
          );
          return true;
        }
      }

      throw new Error('Invalid screenshot data received');
    } catch (error) {
      logger.warn(
        {
          error: error instanceof Error ? error.message : String(error),
          action,
          selector,
          attempt,
        },
        `Screenshot attempt ${attempt}/${retries} failed`,
      );

      if (attempt === retries) {
        // Send error event instead of failing silently
        await sendEvent(ctx, 'browser.screenshot.error', {
          action: action,
          selector: selector,
          error: error instanceof Error ? error.message : String(error),
          timestamp: Date.now(),
          automatic: true,
        });
        return false;
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  return false;
};

// Initialize Playwright Browser with enhanced robustness
async function initializeBrowser(): Promise<void> {
  // Check if browser is still alive and functional
  if (isInitialized && browser && context && page && !page.isClosed()) {
    try {
      // Test if page is responsive
      await page.evaluate('() => document.readyState', { timeout: 1000 });
      return;
    } catch (error) {
      logger.warn(
        { error },
        'Existing browser instance is unresponsive, reinitializing',
      );
      await cleanupBrowser();
    }
  }

  try {
    logger.info('Initializing Playwright Browser...');

    // Cleanup any existing instances
    await cleanupBrowser();

    // Get configuration
    const config = getPlaywrightMcpConfig();

    // Enhanced browser launch arguments for better stability
    const launchArgs = [
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
      '--memory-pressure-off',
      ...(config.browser.launchOptions?.args || []),
    ];

    // Launch browser with timeout and error handling
    browser = await chromium.launch({
      headless: config.browser.headless,
      args: launchArgs,
      timeout: 30000,
      ...config.browser.launchOptions,
    });

    // Create context with enhanced settings
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      acceptDownloads: false,
      ignoreHTTPSErrors: true,
      javaScriptEnabled: true,
      deviceScaleFactor: 1,
    });

    // Create page with error handlers
    page = await context.newPage();

    // Set page timeouts
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);

    // Add error handlers
    page.on('crash', () => {
      logger.error('Page crashed, marking for reinitialization');
      isInitialized = false;
    });

    page.on('close', () => {
      logger.info('Page closed, marking for reinitialization');
      isInitialized = false;
    });

    isInitialized = true;
    logger.info(
      'Playwright Browser initialized successfully with enhanced settings',
    );
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to initialize Playwright Browser',
    );
    await cleanupBrowser();
    throw new Error(
      `Browser initialization failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

// Helper function to cleanup browser instances
async function cleanupBrowser(): Promise<void> {
  try {
    if (page && !page.isClosed()) {
      await page.close().catch(() => {}); // Ignore errors
    }
    if (context) {
      await context.close().catch(() => {}); // Ignore errors
    }
    if (browser) {
      await browser.close().catch(() => {}); // Ignore errors
    }
  } catch (error) {
    logger.warn(
      { error: error instanceof Error ? error.message : String(error) },
      'Error during browser cleanup',
    );
  } finally {
    page = null;
    context = null;
    browser = null;
    isInitialized = false;
  }
}

// Helper function to execute Playwright actions with enhanced robustness
async function executePlaywrightAction(
  action: string,
  args: any,
): Promise<any> {
  const maxRetries = 3;
  const retryDelay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await initializeBrowser();

      if (!page || page.isClosed()) {
        throw new Error('Browser page not initialized or closed');
      }

      logger.debug({ action, args, attempt }, 'Executing Playwright action');

      let result: any = null;
      const timeout = args.timeout || 30000;

      switch (action) {
        case 'navigate':
          // Enhanced navigation with better error handling
          try {
            result = await page.goto(args.url, {
              waitUntil: args.waitUntil || 'domcontentloaded',
              timeout: timeout,
            });

            // Wait for page to be truly ready
            await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
          } catch (navError) {
            logger.warn(
              { navError, url: args.url, attempt },
              'Navigation attempt failed',
            );
            if (attempt === maxRetries) throw navError;
            continue;
          }
          break;

        case 'click':
          // Enhanced click with element verification
          try {
            await page.waitForSelector(args.selector, {
              timeout: 10000,
              state: 'visible',
            });
            result = await page.click(args.selector, {
              button: args.button || 'left',
              timeout: timeout,
            });
          } catch (clickError) {
            logger.warn(
              { clickError, selector: args.selector, attempt },
              'Click attempt failed',
            );
            if (attempt === maxRetries) throw clickError;
            continue;
          }
          break;

        case 'type':
          // Enhanced typing with element verification
          try {
            await page.waitForSelector(args.selector, {
              timeout: 10000,
              state: 'visible',
            });
            if (args.clear) {
              await page.fill(args.selector, '');
            }
            result = await page.fill(args.selector, args.text, {
              timeout: timeout,
            });
          } catch (typeError) {
            logger.warn(
              { typeError, selector: args.selector, attempt },
              'Type attempt failed',
            );
            if (attempt === maxRetries) throw typeError;
            continue;
          }
          break;

        case 'screenshot':
          // Enhanced screenshot with robust error handling
          try {
            // Ensure page is ready for screenshot
            await page
              .waitForLoadState('networkidle', { timeout: 5000 })
              .catch(() => {
                logger.debug(
                  'Network idle timeout, proceeding with screenshot',
                );
              });

            const screenshotOptions: any = {
              type: 'png',
              timeout: timeout,
              animations: 'disabled', // Disable animations for consistent screenshots
            };

            // Only add quality for JPEG screenshots
            if (args.format === 'jpeg') {
              screenshotOptions.type = 'jpeg';
              screenshotOptions.quality = Math.max(
                50,
                Math.min(100, args.quality || 80),
              );
            }

            if (args.fullPage) {
              screenshotOptions.fullPage = true;
            }

            if (args.selector) {
              await page.waitForSelector(args.selector, {
                timeout: 5000,
                state: 'visible',
              });
              const element = await page.locator(args.selector).first();
              const isVisible = await element.isVisible();
              if (!isVisible) {
                throw new Error(`Element ${args.selector} is not visible`);
              }
              result = await element.screenshot(screenshotOptions);
            } else {
              result = await page.screenshot(screenshotOptions);
            }

            // Validate screenshot result
            if (!Buffer.isBuffer(result) || result.length === 0) {
              throw new Error('Invalid screenshot data: empty or not a buffer');
            }
          } catch (screenshotError) {
            logger.warn(
              { screenshotError, selector: args.selector, attempt },
              'Screenshot attempt failed',
            );
            if (attempt === maxRetries) throw screenshotError;
            continue;
          }
          break;

        case 'evaluate':
          try {
            result = await page.evaluate(args.script, { timeout: timeout });
          } catch (evalError) {
            logger.warn({ evalError, attempt }, 'Evaluate attempt failed');
            if (attempt === maxRetries) throw evalError;
            continue;
          }
          break;

        case 'waitForSelector':
          try {
            result = await page.waitForSelector(args.selector, {
              timeout: args.timeout || 30000,
              state: args.state || 'visible',
            });
          } catch (waitError) {
            logger.warn(
              { waitError, selector: args.selector, attempt },
              'Wait for selector attempt failed',
            );
            if (attempt === maxRetries) throw waitError;
            continue;
          }
          break;

        case 'getContent':
          try {
            if (args.selector) {
              await page.waitForSelector(args.selector, {
                timeout: 10000,
                state: 'attached',
              });
              const element = await page.locator(args.selector).first();
              if (args.property) {
                result =
                  (await element.getAttribute(args.property)) ||
                  (await element.evaluate(
                    (el, prop) => (el as any)[prop],
                    args.property,
                  ));
              } else {
                result = await element.textContent();
              }
            } else {
              result = await page.content();
            }
          } catch (contentError) {
            logger.warn(
              { contentError, selector: args.selector, attempt },
              'Get content attempt failed',
            );
            if (attempt === maxRetries) throw contentError;
            continue;
          }
          break;

        case 'setViewport':
          try {
            result = await page.setViewportSize({
              width: Math.max(320, Math.min(4096, args.width)),
              height: Math.max(240, Math.min(4096, args.height)),
            });
          } catch (viewportError) {
            logger.warn(
              { viewportError, attempt },
              'Set viewport attempt failed',
            );
            if (attempt === maxRetries) throw viewportError;
            continue;
          }
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      logger.debug(
        { action, resultType: typeof result, attempt },
        'Playwright action completed successfully',
      );
      return {
        content: [
          {
            type: 'text',
            text: result || `Action ${action} completed successfully`,
          },
        ],
        isError: false,
        result: result,
      };
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          action,
          args,
          attempt,
        },
        `Playwright action attempt ${attempt}/${maxRetries} failed`,
      );

      if (attempt === maxRetries) {
        throw new Error(
          `Playwright action '${action}' failed after ${maxRetries} attempts: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      // Wait before retry with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
    }
  }
}

// Tool parameters schema
const navigateParams = z.object({
  url: z.string().url().describe('The URL to navigate to'),
  waitUntil: z
    .enum(['load', 'domcontentloaded', 'networkidle'])
    .optional()
    .describe('When to consider navigation complete'),
});

const clickParams = z.object({
  selector: z.string().describe('CSS selector for the element to click'),
  button: z
    .enum(['left', 'right', 'middle'])
    .optional()
    .default('left')
    .describe('Mouse button to use for clicking'),
});

const typeParams = z.object({
  selector: z.string().describe('CSS selector for the input element'),
  text: z.string().describe('Text to type into the element'),
  clear: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to clear the field before typing'),
});

const screenshotParams = z.object({
  fullPage: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to capture the full page or just the viewport'),
  selector: z
    .string()
    .optional()
    .describe('CSS selector to capture only a specific element'),
  format: z
    .enum(['png', 'jpeg'])
    .optional()
    .default('png')
    .describe('Image format (png or jpeg)'),
  quality: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .describe('Image quality (0-100, only for JPEG format)'),
});

const evaluateParams = z.object({
  script: z
    .string()
    .describe('JavaScript code to execute in the browser context'),
  returnByValue: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to return the result by value or by reference'),
});

const waitForSelectorParams = z.object({
  selector: z.string().describe('CSS selector to wait for'),
  timeout: z
    .number()
    .optional()
    .default(30000)
    .describe('Maximum time to wait in milliseconds'),
  state: z
    .enum(['attached', 'detached', 'visible', 'hidden'])
    .optional()
    .default('visible')
    .describe('Element state to wait for'),
});

const getContentParams = z.object({
  selector: z
    .string()
    .optional()
    .describe(
      'CSS selector to get content from (if not provided, gets entire page)',
    ),
  property: z
    .string()
    .optional()
    .describe(
      'Property to get from the element (e.g., "textContent", "innerHTML", "value")',
    ),
});

const setViewportParams = z.object({
  width: z.number().min(1).describe('Viewport width in pixels'),
  height: z.number().min(1).describe('Viewport height in pixels'),
  deviceScaleFactor: z
    .number()
    .min(0.1)
    .max(5)
    .optional()
    .default(1)
    .describe('Device scale factor'),
});

// Navigate tool
export const playwrightNavigateTool: Tool<typeof navigateParams, any> = {
  name: 'playwright_navigate',
  description:
    'Navigate to a URL using Playwright browser automation. This tool provides reliable web navigation with proper wait conditions.',
  parameters: navigateParams,
  execute: async (params: z.infer<typeof navigateParams>, ctx: Ctx) => {
    try {
      logger.info(
        { url: params.url, waitUntil: params.waitUntil },
        'Navigating to URL',
      );

      // Send navigation event to UI
      await sendEvent(ctx, 'browser.navigating', { url: params.url });

      // Use Playwright action
      const result = await executePlaywrightAction('navigate', {
        url: params.url,
        waitUntil: params.waitUntil || 'load',
      });

      // Send page loaded event to UI
      await sendEvent(ctx, 'browser.page.loaded', { url: params.url });

      // Capture screenshot after navigation for visual feedback (non-blocking)
      captureAndSendScreenshot(ctx, 'navigation', params.url).catch((error) => {
        logger.warn(
          { error },
          'Non-critical screenshot capture failed after navigation',
        );
      });

      logger.info({ url: params.url }, 'Navigation completed successfully');

      return {
        success: true,
        url: params.url,
        result: result.content?.[0]?.text || 'Navigation completed',
      };
    } catch (error) {
      logger.error({ error, url: params.url }, 'Navigation failed');
      // Send error event to UI
      await sendEvent(ctx, 'browser.error', {
        message: `Navigation failed: ${error}`,
        url: params.url,
      });
      throw new Error(`Failed to navigate to ${params.url}: ${error}`);
    }
  },
};

// Click tool
export const playwrightClickTool: Tool<typeof clickParams, any> = {
  name: 'playwright_click',
  description:
    'Click on an element using Playwright browser automation. Supports different mouse buttons and precise element targeting.',
  parameters: clickParams,
  execute: async (params: z.infer<typeof clickParams>, ctx: Ctx) => {
    try {
      logger.info(
        { selector: params.selector, button: params.button },
        'Clicking element',
      );

      // Send click event to UI with visual annotation
      await sendEvent(ctx, 'browser.element.click', {
        selector: params.selector,
        button: params.button,
        action: 'highlighting element for click',
      });

      // Capture screenshot before click to show element highlighting (non-blocking)
      captureAndSendScreenshot(ctx, 'before_click', params.selector).catch(
        (error) => {
          logger.warn(
            { error },
            'Non-critical screenshot capture failed before click',
          );
        },
      );

      const result = await executePlaywrightAction('click', {
        selector: params.selector,
        button: params.button,
      });

      logger.info(
        { selector: params.selector },
        'Click completed successfully',
      );

      // Capture screenshot after click to show result (non-blocking)
      captureAndSendScreenshot(ctx, 'after_click', params.selector).catch(
        (error) => {
          logger.warn(
            { error },
            'Non-critical screenshot capture failed after click',
          );
        },
      );

      return {
        success: true,
        selector: params.selector,
        button: params.button,
        result: result.content?.[0]?.text || 'Click completed',
      };
    } catch (error) {
      logger.error({ error, selector: params.selector }, 'Click failed');
      // Send error event to UI
      await sendEvent(ctx, 'browser.error', {
        message: `Click failed: ${error}`,
        selector: params.selector,
      });
      throw new Error(`Failed to click element ${params.selector}: ${error}`);
    }
  },
};

// Type tool
export const playwrightTypeTool: Tool<typeof typeParams, any> = {
  name: 'playwright_type',
  description:
    'Type text into an input element using Playwright browser automation. Supports clearing the field before typing.',
  parameters: typeParams,
  execute: async (params: z.infer<typeof typeParams>, ctx: Ctx) => {
    try {
      logger.info(
        { selector: params.selector, textLength: params.text.length },
        'Typing text',
      );

      // Send typing event to UI with visual feedback
      await sendEvent(ctx, 'browser.element.type', {
        selector: params.selector,
        textLength: params.text.length,
        cleared: params.clear,
        action: 'preparing to type text',
      });

      // Capture screenshot before typing to show focused element (non-blocking)
      captureAndSendScreenshot(ctx, 'before_type', params.selector).catch(
        (error) => {
          logger.warn(
            { error },
            'Non-critical screenshot capture failed before type',
          );
        },
      );

      const result = await executePlaywrightAction('type', {
        selector: params.selector,
        text: params.text,
        clear: params.clear,
      });

      logger.info(
        { selector: params.selector },
        'Typing completed successfully',
      );

      // Capture screenshot after typing to show result (non-blocking)
      captureAndSendScreenshot(ctx, 'after_type', params.selector).catch(
        (error) => {
          logger.warn(
            { error },
            'Non-critical screenshot capture failed after type',
          );
        },
      );

      return {
        success: true,
        selector: params.selector,
        textLength: params.text.length,
        cleared: params.clear,
        result: result.content?.[0]?.text || 'Typing completed',
      };
    } catch (error) {
      logger.error({ error, selector: params.selector }, 'Typing failed');
      // Send error event to UI
      await sendEvent(ctx, 'browser.error', {
        message: `Typing failed: ${error}`,
        selector: params.selector,
      });
      throw new Error(
        `Failed to type into element ${params.selector}: ${error}`,
      );
    }
  },
};

// Screenshot tool
export const playwrightScreenshotTool: Tool<typeof screenshotParams, any> = {
  name: 'playwright_screenshot',
  description:
    'Take a screenshot using Playwright browser automation. Supports full page, element-specific, and quality settings.',
  parameters: screenshotParams,
  execute: async (params: z.infer<typeof screenshotParams>, ctx: Ctx) => {
    try {
      logger.info(
        {
          fullPage: params.fullPage,
          selector: params.selector,
          quality: params.quality,
        },
        'Taking screenshot',
      );

      // Send screenshot event to UI
      await sendEvent(ctx, 'browser.screenshot.capturing', {
        fullPage: params.fullPage,
        selector: params.selector,
        quality: params.quality,
      });

      const result = await executePlaywrightAction('screenshot', {
        fullPage: params.fullPage,
        selector: params.selector,
        quality: params.quality,
      });

      logger.info('Screenshot captured successfully');

      // Send screenshot completed event to UI
      await sendEvent(ctx, 'browser.screenshot.captured', {
        fullPage: params.fullPage,
        selector: params.selector,
        format: 'png',
      });

      // Send screenshot data to UI for display
      if (result?.result && Buffer.isBuffer(result.result)) {
        const base64Data = result.result.toString('base64');
        if (base64Data && base64Data.length > 100) {
          await sendEvent(ctx, 'browser.screenshot.realtime', {
            imageData: base64Data,
            action: 'screenshot',
            selector: params.selector,
            timestamp: Date.now(),
          });
          logger.info('Screenshot data sent to UI for display');
        }
      }

      return {
        success: true,
        screenshotData: result.content?.[0]?.text || 'Screenshot data',
        format: 'png',
        fullPage: params.fullPage,
        selector: params.selector,
        result: result.content?.[0]?.text || 'Screenshot captured',
      };
    } catch (error) {
      logger.error({ error }, 'Screenshot failed');
      // Send error event to UI
      await sendEvent(ctx, 'browser.error', {
        message: `Screenshot failed: ${error}`,
        fullPage: params.fullPage,
        selector: params.selector,
      });
      throw new Error(`Failed to take screenshot: ${error}`);
    }
  },
};

// Evaluate JavaScript tool
export const playwrightEvaluateTool: Tool<typeof evaluateParams, any> = {
  name: 'playwright_evaluate',
  description:
    'Execute JavaScript code in the browser context using Playwright. Allows dynamic interaction with web pages.',
  parameters: evaluateParams,
  execute: async (params: z.infer<typeof evaluateParams>, ctx: Ctx) => {
    try {
      logger.info(
        { scriptLength: params.script.length },
        'Evaluating JavaScript',
      );

      // Send JavaScript evaluation event to UI
      await sendEvent(ctx, 'browser.javascript.evaluating', {
        scriptLength: params.script.length,
      });

      const result = await executePlaywrightAction('evaluate', {
        script: params.script,
        returnByValue: params.returnByValue,
      });

      logger.info('JavaScript evaluation completed successfully');

      // Capture automatic screenshot after JavaScript execution
      captureAndSendScreenshot(
        ctx,
        'evaluate',
        undefined,
        AUTO_SCREENSHOT_CONFIG.maxRetries,
      ).catch((error) => {
        logger.warn(
          { error },
          'Non-critical automatic screenshot failed after JavaScript evaluation',
        );
      });

      return {
        success: true,
        result: result.content?.[0]?.text || 'JavaScript executed',
        scriptLength: params.script.length,
      };
    } catch (error) {
      logger.error({ error }, 'JavaScript evaluation failed');
      // Send error event to UI
      await sendEvent(ctx, 'browser.error', {
        message: `JavaScript evaluation failed: ${error}`,
        scriptLength: params.script.length,
      });
      throw new Error(`Failed to evaluate JavaScript: ${error}`);
    }
  },
};

// Wait for selector tool
export const playwrightWaitForSelectorTool: Tool<
  typeof waitForSelectorParams,
  any
> = {
  name: 'playwright_wait_for_selector',
  description:
    'Wait for an element to reach a specific state using Playwright. Useful for handling dynamic content loading.',
  parameters: waitForSelectorParams,
  execute: async (params: z.infer<typeof waitForSelectorParams>, ctx: Ctx) => {
    try {
      logger.info(
        {
          selector: params.selector,
          timeout: params.timeout,
          state: params.state,
        },
        'Waiting for selector',
      );

      // Send wait event to UI
      await sendEvent(ctx, 'browser.element.waiting', {
        selector: params.selector,
        timeout: params.timeout,
        state: params.state,
      });

      const result = await executePlaywrightAction('waitForSelector', {
        selector: params.selector,
        timeout: params.timeout,
        state: params.state,
      });

      logger.info(
        { selector: params.selector },
        'Selector wait completed successfully',
      );

      // Capture automatic screenshot after waiting for selector
      captureAndSendScreenshot(
        ctx,
        'waitForSelector',
        params.selector,
        AUTO_SCREENSHOT_CONFIG.maxRetries,
      ).catch((error) => {
        logger.warn(
          { error },
          'Non-critical automatic screenshot failed after wait for selector',
        );
      });

      return {
        success: true,
        selector: params.selector,
        state: params.state,
        timeout: params.timeout,
        result: result.content?.[0]?.text || 'Wait completed',
      };
    } catch (error) {
      logger.error(
        { error, selector: params.selector },
        'Wait for selector failed',
      );
      // Send error event to UI
      await sendEvent(ctx, 'browser.error', {
        message: `Wait for selector failed: ${error}`,
        selector: params.selector,
        timeout: params.timeout,
      });
      throw new Error(
        `Failed to wait for selector ${params.selector}: ${error}`,
      );
    }
  },
};

// Get content tool
export const playwrightGetContentTool: Tool<typeof getContentParams, any> = {
  name: 'playwright_get_content',
  description:
    'Get content from web page elements using Playwright. Can extract text, HTML, or element properties.',
  parameters: getContentParams,
  execute: async (params: z.infer<typeof getContentParams>, ctx: Ctx) => {
    try {
      logger.info(
        { selector: params.selector, property: params.property },
        'Getting content',
      );

      // Send content extraction event to UI
      await sendEvent(ctx, 'browser.content.extracting', {
        selector: params.selector,
        property: params.property,
      });

      const result = await executePlaywrightAction('getContent', {
        selector: params.selector,
        property: params.property,
      });

      logger.info('Content retrieval completed successfully');

      // Send content extracted event to UI
      const contentLength = result.content?.[0]?.text?.length || 0;
      await sendEvent(ctx, 'browser.content.extracted', {
        length: contentLength,
        selector: params.selector,
        property: params.property,
      });

      // Capture automatic screenshot after content extraction
      captureAndSendScreenshot(
        ctx,
        'getContent',
        params.selector,
        AUTO_SCREENSHOT_CONFIG.maxRetries,
      ).catch((error) => {
        logger.warn(
          { error },
          'Non-critical automatic screenshot failed after content extraction',
        );
      });

      return {
        success: true,
        content: result.content?.[0]?.text || 'Page content retrieved',
        selector: params.selector,
        property: params.property,
      };
    } catch (error) {
      logger.error({ error }, 'Content retrieval failed');
      // Send error event to UI
      await sendEvent(ctx, 'browser.error', {
        message: `Content retrieval failed: ${error}`,
        selector: params.selector,
      });
      throw new Error(`Failed to get content: ${error}`);
    }
  },
};

// Set viewport tool
export const playwrightSetViewportTool: Tool<typeof setViewportParams, any> = {
  name: 'playwright_set_viewport',
  description:
    'Set the browser viewport size using Playwright. Useful for responsive testing and mobile emulation.',
  parameters: setViewportParams,
  execute: async (params: z.infer<typeof setViewportParams>, ctx: Ctx) => {
    try {
      logger.info(
        {
          width: params.width,
          height: params.height,
          deviceScaleFactor: params.deviceScaleFactor,
        },
        'Setting viewport',
      );

      // Send viewport change event to UI
      await sendEvent(ctx, 'browser.viewport.changing', {
        width: params.width,
        height: params.height,
        deviceScaleFactor: params.deviceScaleFactor,
      });

      const result = await executePlaywrightAction('setViewport', {
        width: params.width,
        height: params.height,
        deviceScaleFactor: params.deviceScaleFactor,
      });

      logger.info('Viewport set successfully');

      // Capture automatic screenshot after viewport change
      captureAndSendScreenshot(
        ctx,
        'setViewport',
        undefined,
        AUTO_SCREENSHOT_CONFIG.maxRetries,
      ).catch((error) => {
        logger.warn(
          { error },
          'Non-critical automatic screenshot failed after viewport change',
        );
      });

      return {
        success: true,
        width: params.width,
        height: params.height,
        deviceScaleFactor: params.deviceScaleFactor,
        result: result.content?.[0]?.text || 'Viewport set',
      };
    } catch (error) {
      logger.error({ error }, 'Set viewport failed');
      // Send error event to UI
      await sendEvent(ctx, 'browser.error', {
        message: `Set viewport failed: ${error}`,
        width: params.width,
        height: params.height,
      });
      throw new Error(`Failed to set viewport: ${error}`);
    }
  },
};

// Export all tools as an array for easy registration
export const playwrightMcpTools = [
  playwrightNavigateTool,
  playwrightClickTool,
  playwrightTypeTool,
  playwrightEvaluateTool,
  playwrightWaitForSelectorTool,
  playwrightGetContentTool,
  playwrightSetViewportTool,
];

logger.info(
  `Playwright MCP tools initialized: ${playwrightMcpTools.length} tools available`,
);
