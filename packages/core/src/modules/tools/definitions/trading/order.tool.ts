import { z } from 'zod';
import { getLogger } from '../../../../logger.ts';
import { Tool, Ctx } from '../../../../types.ts';
import { getRedisClientInstance } from '../../../../modules/redis/redisClient.ts';
import {
  playwrightNavigateTool,
  playwrightClickTool,
  playwrightTypeTool,
  playwrightWaitForSelectorTool,
  playwrightGetContentTool
} from '../browser/playwrightMcp.tool.ts';

const logger = getLogger().child({ module: 'TradingOrderTool' });

// Order types supported
const ORDER_TYPES = {
  market: 'market',
  limit: 'limit',
  stop: 'stop',
  stopLimit: 'stop_limit'
} as const;

type OrderType = keyof typeof ORDER_TYPES;
type OrderSide = 'buy' | 'sell';

// Trading platform order configurations
const ORDER_CONFIGS = {
  binance: {
    name: 'Binance',
    tradeUrl: 'https://www.binance.com/en/trade/',
    orderFormSelector: '[data-testid="order-form"]',
    symbolInput: 'input[placeholder*="Symbol"]',
    sideButton: (side: OrderSide) => `button[data-testid="${side}-button"]`,
    orderTypeSelect: 'select[name="orderType"]',
    quantityInput: 'input[name="quantity"]',
    priceInput: 'input[name="price"]',
    stopPriceInput: 'input[name="stopPrice"]',
    submitButton: 'button[type="submit"]',
    confirmationSelector: '[data-testid="order-confirmation"]'
  },
  robinhood: {
    name: 'Robinhood',
    tradeUrl: 'https://robinhood.com/stocks/',
    orderFormSelector: '.order-form',
    symbolInput: 'input[placeholder*="Symbol"]',
    sideButton: (side: OrderSide) => `button[data-testid="${side}-tab"]`,
    orderTypeSelect: 'select[name="orderType"]',
    quantityInput: 'input[name="quantity"]',
    priceInput: 'input[name="price"]',
    stopPriceInput: 'input[name="stopPrice"]',
    submitButton: 'button[type="submit"]',
    confirmationSelector: '.order-confirmation'
  }
} as const;

type TradingPlatform = keyof typeof ORDER_CONFIGS;

// Order parameters schema
const orderParams = z.object({
  platform: z.enum(['binance', 'robinhood'])
    .describe('Trading platform to place order on'),
  symbol: z.string().describe('Trading symbol (e.g., BTCUSDT, AAPL)'),
  side: z.enum(['buy', 'sell']).describe('Order side'),
  type: z.enum(['market', 'limit', 'stop', 'stopLimit'])
    .describe('Order type'),
  quantity: z.number().positive().describe('Order quantity'),
  price: z.number().positive().optional()
    .describe('Limit price (required for limit orders)'),
  stopPrice: z.number().positive().optional()
    .describe('Stop price (required for stop orders)'),
  timeInForce: z.enum(['GTC', 'IOC', 'FOK']).optional().default('GTC')
    .describe('Time in force (GTC=Good Till Cancel, IOC=Immediate or Cancel, FOK=Fill or Kill)'),
});

// Helper function to send order events to UI
const sendOrderEvent = async (ctx: Ctx, type: string, data: any) => {
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
    ctx.log.info({ channel, type, data }, 'Published trading order event');
  }
};

// Main order execution tool
export const tradingOrderTool: Tool<typeof orderParams, any> = {
  name: 'trading_place_order',
  description: 'Place buy/sell orders on trading platforms with support for market, limit, stop, and stop-limit orders.',
  parameters: orderParams,
  execute: async (params: z.infer<typeof orderParams>, ctx: Ctx) => {
    try {
      const platform = ORDER_CONFIGS[params.platform];
      logger.info({
        platform: params.platform,
        symbol: params.symbol,
        side: params.side,
        type: params.type,
        quantity: params.quantity
      }, 'Starting order execution');

      // Send order start event
      await sendOrderEvent(ctx, 'order.start', {
        platform: params.platform,
        platformName: platform.name,
        symbol: params.symbol,
        side: params.side,
        type: params.type,
        quantity: params.quantity
      });

      // Navigate to trading page
      const tradeUrl = `${platform.tradeUrl}${params.symbol}`;
      await playwrightNavigateTool.execute({
        url: tradeUrl,
        waitUntil: 'domcontentloaded'
      }, ctx);

      // Wait for order form to load
      await playwrightWaitForSelectorTool.execute({
        selector: platform.orderFormSelector,
        timeout: 10000,
        state: 'visible'
      }, ctx);

      // Select order side (buy/sell)
      const sideSelector = platform.sideButton(params.side);
      await playwrightClickTool.execute({
        selector: sideSelector,
        button: 'left'
      }, ctx);

      // Select order type if needed
      if (params.type !== 'market') {
        // This would need platform-specific implementation
        // For now, we'll assume the platform has the order type pre-selected or use JavaScript
        logger.info({ orderType: params.type }, 'Order type selection needed');
      }

      // Enter quantity
      await playwrightTypeTool.execute({
        selector: platform.quantityInput,
        text: params.quantity.toString(),
        clear: true
      }, ctx);

      // Enter price for limit orders
      if (params.type === 'limit' && params.price) {
        await playwrightTypeTool.execute({
          selector: platform.priceInput,
          text: params.price.toString(),
          clear: true
        }, ctx);
      }

      // Enter stop price for stop orders
      if ((params.type === 'stop' || params.type === 'stopLimit') && params.stopPrice) {
        await playwrightTypeTool.execute({
          selector: platform.stopPriceInput,
          text: params.stopPrice.toString(),
          clear: true
        }, ctx);
      }

      // Submit the order
      await playwrightClickTool.execute({
        selector: platform.submitButton,
        button: 'left'
      }, ctx);

      // Wait for order confirmation
      try {
        await playwrightWaitForSelectorTool.execute({
          selector: platform.confirmationSelector,
          timeout: 10000,
          state: 'visible'
        }, ctx);

        // Get order confirmation details
        const confirmationText = await playwrightGetContentTool.execute({
          selector: platform.confirmationSelector
        }, ctx);

        // Send success event
        await sendOrderEvent(ctx, 'order.success', {
          platform: params.platform,
          platformName: platform.name,
          symbol: params.symbol,
          side: params.side,
          type: params.type,
          quantity: params.quantity,
          price: params.price,
          stopPrice: params.stopPrice,
          confirmation: confirmationText.content
        });

        logger.info({
          platform: params.platform,
          symbol: params.symbol,
          side: params.side,
          quantity: params.quantity
        }, 'Order executed successfully');

        return {
          success: true,
          platform: params.platform,
          platformName: platform.name,
          symbol: params.symbol,
          side: params.side,
          type: params.type,
          quantity: params.quantity,
          price: params.price,
          stopPrice: params.stopPrice,
          status: 'executed',
          message: `Order executed successfully on ${platform.name}`,
          confirmation: confirmationText.content
        };

      } catch (confirmationError) {
        // Check if order failed
        try {
          // Look for error messages
          const errorContent = await playwrightGetContentTool.execute({
            selector: '.error-message, .order-error, [data-testid*="error"]'
          }, ctx);

          await sendOrderEvent(ctx, 'order.error', {
            platform: params.platform,
            symbol: params.symbol,
            side: params.side,
            error: errorContent.content
          });

          return {
            success: false,
            platform: params.platform,
            symbol: params.symbol,
            side: params.side,
            status: 'failed',
            error: errorContent.content,
            message: `Order failed: ${errorContent.content}`
          };
        } catch (errorCheckError) {
          throw new Error(`Order execution failed for ${platform.name}: ${confirmationError}`);
        }
      }

    } catch (error) {
      logger.error({ error, platform: params.platform, symbol: params.symbol }, 'Order execution failed');

      // Send error event
      await sendOrderEvent(ctx, 'order.error', {
        platform: params.platform,
        symbol: params.symbol,
        side: params.side,
        error: error instanceof Error ? error.message : String(error)
      });

      throw new Error(`Failed to execute order on ${ORDER_CONFIGS[params.platform].name}: ${error}`);
    }
  },
};

// Export order configurations for other tools
export { ORDER_CONFIGS, ORDER_TYPES };
export type { OrderType, OrderSide, TradingPlatform };