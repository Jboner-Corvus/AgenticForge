import { z } from 'zod';
import type { Tool } from '../../../../types.ts';
import {
  makeAlphaVantageRequest,
  formatAlphaVantageResponse,
  AlphaVantageBaseParams,
} from './common.ts';

const DigitalCurrencyDailyParams = AlphaVantageBaseParams.extend({
  symbol: z
    .string()
    .min(1)
    .max(10)
    .transform(val => val.toUpperCase())
    .describe('Digital currency symbol (e.g., BTC, ETH, LTC)'),
  market: z
    .string()
    .length(3)
    .transform(val => val.toUpperCase())
    .describe('Market currency code to price the digital currency in (3-letter ISO code, e.g., USD, EUR, CNY)'),
});

export const digitalCurrencyDailyTool: Tool<typeof DigitalCurrencyDailyParams> = {
  description: 'Returns daily time series data for digital/crypto currencies, including open, high, low, close, and volume information in both the market currency and USD',
  
  execute: async (params, context) => {
    const { log } = context;
    const parsedParams = DigitalCurrencyDailyParams.parse(params);
    
    try {
      log.info('Fetching daily digital currency data', { 
        symbol: parsedParams.symbol,
        market: parsedParams.market
      });

      const apiParams: Record<string, string> = {
        symbol: parsedParams.symbol,
        market: parsedParams.market,
        apikey: parsedParams.apikey,
      };

      const data = await makeAlphaVantageRequest('DIGITAL_CURRENCY_DAILY', apiParams);
      
      log.info('Successfully fetched daily digital currency data', { 
        symbol: parsedParams.symbol,
        market: parsedParams.market,
        dataType: typeof data
      });

      return formatAlphaVantageResponse(data, 'DIGITAL_CURRENCY_DAILY');
      
    } catch (error) {
      log.error({ err: error, params: parsedParams }, 'Error fetching daily digital currency data');
      throw new Error(
        `Failed to fetch daily digital currency data for ${parsedParams.symbol}/${parsedParams.market}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  },
  
  name: 'digital_currency_daily',
  parameters: DigitalCurrencyDailyParams,
};