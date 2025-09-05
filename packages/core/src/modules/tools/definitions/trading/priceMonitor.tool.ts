import { z } from 'zod';
import { getLogger } from '../../../../logger.ts';
import { Tool, Ctx } from '../../../../types.ts';
import { getRedisClientInstance } from '../../../../modules/redis/redisClient.ts';
import {
  playwrightNavigateTool,
  playwrightGetContentTool,
  playwrightEvaluateTool,
  playwrightWaitForSelectorTool
} from '../browser/playwrightMcp.tool.ts';

const logger = getLogger().child({ module: 'TradingPriceMonitorTool' });

// Price monitoring configurations for different platforms
const PRICE_CONFIGS = {
  binance: {
    name: 'Binance',
    baseUrl: 'https://www.binance.com/en/trade/',
    priceSelector: '[data-testid="price-display"], .price-display, .current-price',
    priceScript: `
      const priceElement = document.querySelector('[data-testid="price-display"], .price-display, .current-price');
      return priceElement ? priceElement.textContent?.trim() : null;
    `,
    volumeSelector: '[data-testid="volume-display"], .volume-display',
    changeSelector: '[data-testid="price-change"], .price-change'
  },
  robinhood: {
    name: 'Robinhood',
    baseUrl: 'https://robinhood.com/stocks/',
    priceSelector: '.current-price, [data-testid="current-price"]',
    priceScript: `
      const priceElement = document.querySelector('.current-price, [data-testid="current-price"]');
      return priceElement ? priceElement.textContent?.trim() : null;
    `,
    volumeSelector: '.volume-display, [data-testid="volume"]',
    changeSelector: '.price-change, [data-testid="price-change"]'
  },
  yahoo: {
    name: 'Yahoo Finance',
    baseUrl: 'https://finance.yahoo.com/quote/',
    priceSelector: '[data-testid="qsp-price"], .price',
    priceScript: `
      const priceElement = document.querySelector('[data-testid="qsp-price"], .price');
      return priceElement ? priceElement.textContent?.trim() : null;
    `,
    volumeSelector: '[data-testid="qsp-volume"], .volume',
    changeSelector: '[data-testid="qsp-change"], .change'
  },
  tradingview: {
    name: 'TradingView',
    baseUrl: 'https://www.tradingview.com/symbols/',
    priceSelector: '.price-display, [data-testid="price"]',
    priceScript: `
      const priceElement = document.querySelector('.price-display, [data-testid="price"]');
      return priceElement ? priceElement.textContent?.trim() : null;
    `,
    volumeSelector: '.volume-display, [data-testid="volume"]',
    changeSelector: '.change-display, [data-testid="change"]'
  }
} as const;

type PricePlatform = keyof typeof PRICE_CONFIGS;

// Price monitoring parameters schema
const priceMonitorParams = z.object({
  platform: z.enum(['binance', 'robinhood', 'yahoo', 'tradingview'])
    .describe('Platform to monitor prices on'),
  symbol: z.string().describe('Trading symbol to monitor (e.g., BTCUSDT, AAPL)'),
  duration: z.number().min(1).max(300).optional().default(60)
    .describe('Monitoring duration in seconds (1-300)'),
  interval: z.number().min(1).max(30).optional().default(5)
    .describe('Price check interval in seconds (1-30)'),
  alertThreshold: z.number().optional()
    .describe('Price change percentage threshold for alerts (e.g., 1.0 for 1%)'),
});

// Helper function to send price monitoring events to UI
const sendPriceEvent = async (ctx: Ctx, type: string, data: any) => {
  if (ctx.job?.id) {
    const channel = `job:${ctx.job.id}:events`;
    const event = JSON.stringify({
      type: `trading.price.${type}`,
      data,
      timestamp: Date.now(),
      jobId: ctx.job.id,
      sessionId: ctx.session?.id
    });
    await getRedisClientInstance().publish(channel, event);
    ctx.log.info({ channel, type, data }, 'Published price monitoring event');
  }
};

// Helper function to extract numeric price from text
const extractPrice = (priceText: string): number | null => {
  if (!priceText) return null;

  // Remove common prefixes/suffixes and extract numeric value
  const cleanText = priceText.replace(/[$,\s]/g, '');
  const match = cleanText.match(/[\d,]+\.?\d*/);

  if (match) {
    return parseFloat(match[0].replace(/,/g, ''));
  }

  return null;
};

// Helper function to extract price change percentage
const extractChange = (changeText: string): number | null => {
  if (!changeText) return null;

  // Look for percentage values
  const percentMatch = changeText.match(/([+-]?\d+\.?\d*)%/);
  if (percentMatch) {
    return parseFloat(percentMatch[1]);
  }

  return null;
};

// Main price monitoring tool
export const tradingPriceMonitorTool: Tool<typeof priceMonitorParams, any> = {
  name: 'trading_monitor_price',
  description: 'Monitor real-time prices for trading symbols across multiple platforms with configurable alerts and intervals.',
  parameters: priceMonitorParams,
  execute: async (params: z.infer<typeof priceMonitorParams>, ctx: Ctx) => {
    try {
      const platform = PRICE_CONFIGS[params.platform];
      logger.info({
        platform: params.platform,
        symbol: params.symbol,
        duration: params.duration,
        interval: params.interval
      }, 'Starting price monitoring');

      // Send monitoring start event
      await sendPriceEvent(ctx, 'monitor.start', {
        platform: params.platform,
        platformName: platform.name,
        symbol: params.symbol,
        duration: params.duration,
        interval: params.interval,
        alertThreshold: params.alertThreshold
      });

      // Navigate to symbol page
      const symbolUrl = `${platform.baseUrl}${params.symbol}`;
      await playwrightNavigateTool.execute({
        url: symbolUrl,
        waitUntil: 'domcontentloaded'
      }, ctx);

      // Wait for price data to load
      await playwrightWaitForSelectorTool.execute({
        selector: platform.priceSelector,
        timeout: 10000,
        state: 'visible'
      }, ctx);

      const priceHistory: Array<{
        timestamp: number;
        price: number;
        volume?: string;
        change?: number;
      }> = [];

      let lastPrice: number | null = null;
      const startTime = Date.now();
      const endTime = startTime + (params.duration * 1000);

      // Monitoring loop
      while (Date.now() < endTime) {
        try {
          // Get current price using JavaScript evaluation
          const priceResult = await playwrightEvaluateTool.execute({
            script: platform.priceScript,
            returnByValue: true
          }, ctx);

          const priceText = priceResult.result;
          const currentPrice = extractPrice(priceText);

          if (currentPrice !== null) {
            // Get additional data if available
            let volume: string | undefined;
            let changePercent: number | undefined;

            try {
              const volumeResult = await playwrightGetContentTool.execute({
                selector: platform.volumeSelector
              }, ctx);
              volume = volumeResult.content;
            } catch (error) {
              // Volume not available, continue
            }

            try {
              const changeResult = await playwrightGetContentTool.execute({
                selector: platform.changeSelector
              }, ctx);
              const extractedChange = extractChange(changeResult.content);
              changePercent = extractedChange !== null ? extractedChange : undefined;
            } catch (error) {
              // Change not available, continue
            }

            const priceData = {
              timestamp: Date.now(),
              price: currentPrice,
              volume,
              change: changePercent
            };

            priceHistory.push(priceData);

            // Send real-time price update
            await sendPriceEvent(ctx, 'update', {
              platform: params.platform,
              symbol: params.symbol,
              ...priceData
            });

            // Check for alert threshold
            if (params.alertThreshold && lastPrice !== null) {
              const priceChangePercent = ((currentPrice - lastPrice) / lastPrice) * 100;
              if (Math.abs(priceChangePercent) >= params.alertThreshold) {
                await sendPriceEvent(ctx, 'alert', {
                  platform: params.platform,
                  symbol: params.symbol,
                  price: currentPrice,
                  lastPrice,
                  changePercent: priceChangePercent,
                  threshold: params.alertThreshold,
                  direction: priceChangePercent > 0 ? 'up' : 'down'
                });

                logger.info({
                  symbol: params.symbol,
                  price: currentPrice,
                  lastPrice,
                  changePercent: priceChangePercent
                }, 'Price alert triggered');
              }
            }

            lastPrice = currentPrice;
          }

          // Wait for next interval
          await new Promise(resolve => setTimeout(resolve, params.interval * 1000));

        } catch (error) {
          logger.warn({ error, symbol: params.symbol }, 'Error during price monitoring iteration');
          // Continue monitoring despite individual errors
          await new Promise(resolve => setTimeout(resolve, params.interval * 1000));
        }
      }

      // Calculate monitoring summary
      const summary = {
        platform: params.platform,
        platformName: platform.name,
        symbol: params.symbol,
        duration: params.duration,
        totalReadings: priceHistory.length,
        averagePrice: priceHistory.length > 0 ?
          priceHistory.reduce((sum, reading) => sum + reading.price, 0) / priceHistory.length : null,
        minPrice: priceHistory.length > 0 ? Math.min(...priceHistory.map(r => r.price)) : null,
        maxPrice: priceHistory.length > 0 ? Math.max(...priceHistory.map(r => r.price)) : null,
        latestPrice: priceHistory.length > 0 ? priceHistory[priceHistory.length - 1].price : null
      };

      // Send monitoring completion event
      await sendPriceEvent(ctx, 'monitor.complete', {
        ...summary,
        priceHistory
      });

      logger.info({
        platform: params.platform,
        symbol: params.symbol,
        readings: priceHistory.length
      }, 'Price monitoring completed');

      return {
        success: true,
        ...summary,
        priceHistory,
        message: `Price monitoring completed for ${params.symbol} on ${platform.name}`
      };

    } catch (error) {
      logger.error({ error, platform: params.platform, symbol: params.symbol }, 'Price monitoring failed');

      // Send error event
      await sendPriceEvent(ctx, 'monitor.error', {
        platform: params.platform,
        symbol: params.symbol,
        error: error instanceof Error ? error.message : String(error)
      });

      throw new Error(`Failed to monitor prices for ${params.symbol} on ${PRICE_CONFIGS[params.platform].name}: ${error}`);
    }
  },
};

// Export price monitoring configurations for other tools
export { PRICE_CONFIGS };
export type { PricePlatform };