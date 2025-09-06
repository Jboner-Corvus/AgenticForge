import { z } from 'zod';
import type { Tool } from '../../../../types.ts';
import { getConfig } from '../../../../config.ts';
import {
  makeAlphaVantageRequest,
  formatAlphaVantageResponse,
  AlphaVantageBaseParams,
} from './common.ts';

// Parameters for Forex APIs
const ForexParams = z.object({
  function: z.enum([
    'CURRENCY_EXCHANGE_RATE',
    'FX_INTRADAY',
    'FX_DAILY',
    'FX_WEEKLY',
    'FX_MONTHLY'
  ]).describe('Forex function to execute'),
  from_symbol: z.string().min(3).max(3).optional().describe('From currency symbol (e.g., USD, EUR, GBP) - required for FX functions'),
  to_symbol: z.string().min(3).max(3).optional().describe('To currency symbol (e.g., USD, EUR, GBP) - required for FX functions'),
  from_currency: z.string().optional().describe('From currency for exchange rate (physical or crypto) - required for CURRENCY_EXCHANGE_RATE'),
  to_currency: z.string().optional().describe('To currency for exchange rate (physical or crypto) - required for CURRENCY_EXCHANGE_RATE'),
  interval: z.enum(['1min', '5min', '15min', '30min', '60min']).optional().describe('Time interval - required for FX_INTRADAY'),
  outputsize: z.enum(['compact', 'full']).optional().default('compact').describe('Data size: compact (100 points) or full (all available)'),
  datatype: z.enum(['json', 'csv']).optional().default('json').describe('Response format'),
  apikey: z.string().optional().describe('Alpha Vantage API key (optional if set in config)'),
});

export const forexTool: Tool<typeof ForexParams> = {
  description: 'Comprehensive foreign exchange (Forex) data including realtime exchange rates, intraday, daily, weekly, and monthly time series for currency pairs. Supports both physical currencies and cryptocurrencies.',

  execute: async (params, context) => {
    const { log } = context;
    const parsedParams = ForexParams.parse(params);

    try {
      log.info('Executing Forex API', {
        function: parsedParams.function,
        from_symbol: parsedParams.from_symbol,
        to_symbol: parsedParams.to_symbol
      });

      // Get API key from config if not provided
      const apiKey = parsedParams.apikey || getConfig().ALPHA_VANTAGE_API_KEY;
      if (!apiKey) {
        throw new Error('Alpha Vantage API key is required. Please set ALPHA_VANTAGE_API_KEY in your .env file or provide it as a parameter.');
      }

      // Prepare API parameters
      const apiParams: Record<string, string> = {
        apikey: apiKey,
      };

      // Add function-specific parameters
      switch (parsedParams.function) {
        case 'CURRENCY_EXCHANGE_RATE':
          apiParams.function = 'CURRENCY_EXCHANGE_RATE';
          if (!parsedParams.from_currency) throw new Error('from_currency is required for CURRENCY_EXCHANGE_RATE');
          if (!parsedParams.to_currency) throw new Error('to_currency is required for CURRENCY_EXCHANGE_RATE');
          apiParams.from_currency = parsedParams.from_currency;
          apiParams.to_currency = parsedParams.to_currency;
          if (parsedParams.datatype) apiParams.datatype = parsedParams.datatype;
          break;

        case 'FX_INTRADAY':
          apiParams.function = 'FX_INTRADAY';
          if (!parsedParams.from_symbol) throw new Error('from_symbol is required for FX_INTRADAY');
          if (!parsedParams.to_symbol) throw new Error('to_symbol is required for FX_INTRADAY');
          if (!parsedParams.interval) throw new Error('interval is required for FX_INTRADAY');
          apiParams.from_symbol = parsedParams.from_symbol;
          apiParams.to_symbol = parsedParams.to_symbol;
          apiParams.interval = parsedParams.interval;
          if (parsedParams.outputsize) apiParams.outputsize = parsedParams.outputsize;
          if (parsedParams.datatype) apiParams.datatype = parsedParams.datatype;
          break;

        case 'FX_DAILY':
          apiParams.function = 'FX_DAILY';
          if (!parsedParams.from_symbol) throw new Error('from_symbol is required for FX_DAILY');
          if (!parsedParams.to_symbol) throw new Error('to_symbol is required for FX_DAILY');
          apiParams.from_symbol = parsedParams.from_symbol;
          apiParams.to_symbol = parsedParams.to_symbol;
          if (parsedParams.outputsize) apiParams.outputsize = parsedParams.outputsize;
          if (parsedParams.datatype) apiParams.datatype = parsedParams.datatype;
          break;

        case 'FX_WEEKLY':
          apiParams.function = 'FX_WEEKLY';
          if (!parsedParams.from_symbol) throw new Error('from_symbol is required for FX_WEEKLY');
          if (!parsedParams.to_symbol) throw new Error('to_symbol is required for FX_WEEKLY');
          apiParams.from_symbol = parsedParams.from_symbol;
          apiParams.to_symbol = parsedParams.to_symbol;
          if (parsedParams.datatype) apiParams.datatype = parsedParams.datatype;
          break;

        case 'FX_MONTHLY':
          apiParams.function = 'FX_MONTHLY';
          if (!parsedParams.from_symbol) throw new Error('from_symbol is required for FX_MONTHLY');
          if (!parsedParams.to_symbol) throw new Error('to_symbol is required for FX_MONTHLY');
          apiParams.from_symbol = parsedParams.from_symbol;
          apiParams.to_symbol = parsedParams.to_symbol;
          if (parsedParams.datatype) apiParams.datatype = parsedParams.datatype;
          break;
      }

      const data = await makeAlphaVantageRequest(parsedParams.function, apiParams, parsedParams.datatype);

      log.info('Successfully executed Forex API', {
        function: parsedParams.function,
        dataType: typeof data
      });

      return formatAlphaVantageResponse(data, parsedParams.function);

    } catch (error) {
      log.error({ err: error, params: parsedParams }, 'Error executing Forex API');
      throw new Error(
        `Failed to execute ${parsedParams.function}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  },

  name: 'forex',
  parameters: ForexParams,
};