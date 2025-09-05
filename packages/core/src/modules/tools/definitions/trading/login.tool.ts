import { z } from 'zod';
import { getLogger } from '../../../../logger.ts';
import { Tool, Ctx } from '../../../../types.ts';
import { getRedisClientInstance } from '../../../../modules/redis/redisClient.ts';
import {
  playwrightNavigateTool,
  playwrightClickTool,
  playwrightTypeTool,
  playwrightWaitForSelectorTool
} from '../browser/playwrightMcp.tool.ts';

const logger = getLogger().child({ module: 'TradingLoginTool' });

// Supported trading platforms with their login configurations
const TRADING_PLATFORMS = {
  binance: {
    name: 'Binance',
    url: 'https://www.binance.com/en/login',
    usernameSelector: 'input[placeholder*="email"], input[name="email"]',
    passwordSelector: 'input[type="password"]',
    submitSelector: 'button[type="submit"], button:has-text("Log In")',
    successSelector: '[data-testid="header-user"], .user-info, .account-menu',
    twoFactorSelector: 'input[placeholder*="2FA"], input[name*="code"]'
  },
  robinhood: {
    name: 'Robinhood',
    url: 'https://robinhood.com/login',
    usernameSelector: 'input[name="username"], input[placeholder*="email"]',
    passwordSelector: 'input[type="password"]',
    submitSelector: 'button[type="submit"], button:has-text("Sign In")',
    successSelector: '[data-testid="account-summary"], .account-value',
    twoFactorSelector: 'input[placeholder*="code"], input[name*="code"]'
  },
  interactivebrokers: {
    name: 'Interactive Brokers',
    url: 'https://www.ibkr.com/',
    usernameSelector: 'input[name="user_name"], input[id="user_name"]',
    passwordSelector: 'input[type="password"]',
    submitSelector: 'button[type="submit"], input[type="submit"]',
    successSelector: '.account-selector, .portfolio-summary',
    twoFactorSelector: 'input[name*="otp"], input[placeholder*="code"]'
  },
  tradingview: {
    name: 'TradingView',
    url: 'https://www.tradingview.com/accounts/signin/',
    usernameSelector: 'input[name="username"], input[placeholder*="email"]',
    passwordSelector: 'input[type="password"]',
    submitSelector: 'button[type="submit"], button:has-text("Sign in")',
    successSelector: '.tv-header__user-menu, .user-menu-button',
    twoFactorSelector: 'input[placeholder*="code"], input[name*="code"]'
  }
} as const;

type TradingPlatform = keyof typeof TRADING_PLATFORMS;

// Login parameters schema
const loginParams = z.object({
  platform: z.enum(['binance', 'robinhood', 'interactivebrokers', 'tradingview'])
    .describe('Trading platform to login to'),
  username: z.string().describe('Username/email for the trading account'),
  password: z.string().describe('Password for the trading account'),
  twoFactorCode: z.string().optional().describe('2FA code if required'),
  rememberMe: z.boolean().optional().default(false).describe('Whether to stay logged in'),
});

// Helper function to send login events to UI
const sendLoginEvent = async (ctx: Ctx, type: string, data: any) => {
  if (ctx.job?.id) {
    const channel = `job:${ctx.job.id}:events`;
    const event = JSON.stringify({
      type: `trading.${type}`,
      data,
      timestamp: Date.now(),
      jobId: ctx.job.id,
      sessionId: ctx.session?.id
    });
    await getRedisClientInstance().publish(channel, event);
    ctx.log.info({ channel, type, data }, 'Published trading login event');
  }
};

// Main login tool
export const tradingLoginTool: Tool<typeof loginParams, any> = {
  name: 'trading_login',
  description: 'Automate login to trading platforms using secure browser automation. Supports multiple platforms with 2FA handling.',
  parameters: loginParams,
  execute: async (params: z.infer<typeof loginParams>, ctx: Ctx) => {
    try {
      const platform = TRADING_PLATFORMS[params.platform];
      logger.info({ platform: params.platform, username: params.username }, 'Starting trading platform login');

      // Send login start event
      await sendLoginEvent(ctx, 'login.start', {
        platform: params.platform,
        platformName: platform.name
      });

      // Navigate to login page
      await playwrightNavigateTool.execute({
        url: platform.url,
        waitUntil: 'domcontentloaded'
      }, ctx);

      // Wait for login form to load
      await playwrightWaitForSelectorTool.execute({
        selector: platform.usernameSelector,
        timeout: 10000,
        state: 'visible'
      }, ctx);

      // Fill username
      await playwrightTypeTool.execute({
        selector: platform.usernameSelector,
        text: params.username,
        clear: true
      }, ctx);

      // Fill password
      await playwrightTypeTool.execute({
        selector: platform.passwordSelector,
        text: params.password,
        clear: true
      }, ctx);

      // Handle 2FA if provided
      if (params.twoFactorCode) {
        try {
          await playwrightWaitForSelectorTool.execute({
            selector: platform.twoFactorSelector,
            timeout: 5000,
            state: 'visible'
          }, ctx);
          await playwrightTypeTool.execute({
            selector: platform.twoFactorSelector,
            text: params.twoFactorCode,
            clear: true
          }, ctx);
        } catch (error) {
          logger.warn('2FA input not found, proceeding without it');
        }
      }

      // Submit login form
      await playwrightClickTool.execute({
        selector: platform.submitSelector,
        button: 'left'
      }, ctx);

      // Wait for successful login
      try {
        await playwrightWaitForSelectorTool.execute({
          selector: platform.successSelector,
          timeout: 15000,
          state: 'visible'
        }, ctx);

        // Send success event
        await sendLoginEvent(ctx, 'login.success', {
          platform: params.platform,
          platformName: platform.name,
          username: params.username
        });

        logger.info({ platform: params.platform }, 'Trading platform login successful');

        return {
          success: true,
          platform: params.platform,
          platformName: platform.name,
          status: 'logged_in',
          message: `Successfully logged into ${platform.name}`
        };

      } catch (error) {
        // Check if 2FA is required
        try {
          await playwrightWaitForSelectorTool.execute({
            selector: platform.twoFactorSelector,
            timeout: 3000,
            state: 'visible'
          }, ctx);

          await sendLoginEvent(ctx, 'login.2fa_required', {
            platform: params.platform,
            platformName: platform.name
          });

          return {
            success: false,
            platform: params.platform,
            status: '2fa_required',
            message: `2FA code required for ${platform.name}. Please provide twoFactorCode parameter.`
          };
        } catch (twoFactorError) {
          throw new Error(`Login failed for ${platform.name}: ${error}`);
        }
      }

    } catch (error) {
      logger.error({ error, platform: params.platform }, 'Trading platform login failed');

      // Send error event
      await sendLoginEvent(ctx, 'login.error', {
        platform: params.platform,
        error: error instanceof Error ? error.message : String(error)
      });

      throw new Error(`Failed to login to ${TRADING_PLATFORMS[params.platform].name}: ${error}`);
    }
  },
};

// Export platform configurations for other tools
export { TRADING_PLATFORMS };
export type { TradingPlatform };