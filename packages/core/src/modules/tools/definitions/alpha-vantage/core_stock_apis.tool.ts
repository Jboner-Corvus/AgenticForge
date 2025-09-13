import { z } from 'zod';
import type { Tool } from '../../../../types.ts';
import { getConfig } from '../../../../config.ts';
import {
  makeAlphaVantageRequest,
  formatAlphaVantageResponse,
  AlphaVantageBaseParams,
  SymbolParam,
  IntervalParam,
  OutputSizeParam,
  DataTypeParam,
} from './common.ts';

// Combined parameters for all core stock APIs
const CoreStockParams = z.object({
  function: z
    .enum([
      'TIME_SERIES_INTRADAY',
      'TIME_SERIES_DAILY',
      'TIME_SERIES_DAILY_ADJUSTED',
      'TIME_SERIES_WEEKLY',
      'TIME_SERIES_WEEKLY_ADJUSTED',
      'TIME_SERIES_MONTHLY',
      'TIME_SERIES_MONTHLY_ADJUSTED',
      'GLOBAL_QUOTE',
      'REALTIME_BULK_QUOTES',
      'SYMBOL_SEARCH',
      'MARKET_STATUS',
    ])
    .describe('Alpha Vantage function to execute'),
  symbol: z
    .string()
    .min(1)
    .max(10)
    .optional()
    .describe(
      'Stock symbol (e.g., IBM, AAPL) - required for most functions except SYMBOL_SEARCH and MARKET_STATUS',
    ),
  keywords: z
    .string()
    .optional()
    .describe(
      'Keywords to search for (e.g., "Microsoft", "MSFT") - required for SYMBOL_SEARCH',
    ),
  interval: z
    .enum(['1min', '5min', '15min', '30min', '60min'])
    .optional()
    .describe(
      'Time interval for data points - required for TIME_SERIES_INTRADAY',
    ),
  outputsize: z
    .enum(['compact', 'full'])
    .optional()
    .default('compact')
    .describe('Data size: compact (100 points) or full (all available)'),
  datatype: z
    .enum(['json', 'csv'])
    .optional()
    .default('json')
    .describe('Response format'),
  adjusted: z
    .boolean()
    .optional()
    .default(true)
    .describe(
      'Whether to return adjusted data (true) or raw data (false) - for TIME_SERIES_INTRADAY',
    ),
  extended_hours: z
    .boolean()
    .optional()
    .default(true)
    .describe(
      'Whether to include extended hours trading data - for TIME_SERIES_INTRADAY',
    ),
  month: z
    .string()
    .optional()
    .describe(
      'Query specific month in YYYY-MM format (e.g., 2009-01) - for TIME_SERIES_INTRADAY',
    ),
  entitlement: z
    .enum(['delayed', 'realtime'])
    .optional()
    .describe(
      'Data entitlement: "delayed" for 15-minute delayed data, "realtime" for real-time data',
    ),
  apikey: z
    .string()
    .optional()
    .describe('Alpha Vantage API key (automatically loaded from .env)'),
});

export const coreStockApisTool: Tool<typeof CoreStockParams> = {
  description:
    'Comprehensive core stock market data APIs including time series (intraday, daily, weekly, monthly), quotes, bulk quotes, symbol search, and market status. Supports both raw and adjusted data with flexible output formats.',

  execute: async (params, context) => {
    const { log } = context;
    const parsedParams = CoreStockParams.parse(params);

    try {
      log.info('Executing core stock API', {
        function: parsedParams.function,
        symbol: 'symbol' in parsedParams ? parsedParams.symbol : undefined,
        keywords:
          'keywords' in parsedParams ? parsedParams.keywords : undefined,
      });

      // Get API key from config if not provided
      const apiKey = parsedParams.apikey || getConfig().ALPHA_VANTAGE_API_KEY;
      if (!apiKey) {
        throw new Error(
          'Alpha Vantage API key is required. Please set ALPHA_VANTAGE_API_KEY in your .env file or provide it as a parameter.',
        );
      }

      // Prepare API parameters based on function
      const apiParams: Record<string, string> = {
        apikey: apiKey,
      };

      switch (parsedParams.function) {
        case 'TIME_SERIES_INTRADAY':
          apiParams.function = 'TIME_SERIES_INTRADAY';
          if (!parsedParams.symbol)
            throw new Error('Symbol is required for TIME_SERIES_INTRADAY');
          if (!parsedParams.interval)
            throw new Error('Interval is required for TIME_SERIES_INTRADAY');
          apiParams.symbol = parsedParams.symbol;
          apiParams.interval = parsedParams.interval;
          if (parsedParams.outputsize)
            apiParams.outputsize = parsedParams.outputsize;
          if (parsedParams.datatype) apiParams.datatype = parsedParams.datatype;
          if (parsedParams.adjusted !== undefined)
            apiParams.adjusted = parsedParams.adjusted.toString();
          if (parsedParams.extended_hours !== undefined)
            apiParams.extended_hours = parsedParams.extended_hours.toString();
          if (parsedParams.month) apiParams.month = parsedParams.month;
          if (parsedParams.entitlement)
            apiParams.entitlement = parsedParams.entitlement;
          break;

        case 'TIME_SERIES_DAILY':
          apiParams.function = 'TIME_SERIES_DAILY';
          if (!parsedParams.symbol)
            throw new Error('Symbol is required for TIME_SERIES_DAILY');
          apiParams.symbol = parsedParams.symbol;
          if (parsedParams.outputsize)
            apiParams.outputsize = parsedParams.outputsize;
          if (parsedParams.datatype) apiParams.datatype = parsedParams.datatype;
          if (parsedParams.entitlement)
            apiParams.entitlement = parsedParams.entitlement;
          break;

        case 'TIME_SERIES_DAILY_ADJUSTED':
          apiParams.function = 'TIME_SERIES_DAILY_ADJUSTED';
          if (!parsedParams.symbol)
            throw new Error(
              'Symbol is required for TIME_SERIES_DAILY_ADJUSTED',
            );
          apiParams.symbol = parsedParams.symbol;
          if (parsedParams.outputsize)
            apiParams.outputsize = parsedParams.outputsize;
          if (parsedParams.datatype) apiParams.datatype = parsedParams.datatype;
          break;

        case 'TIME_SERIES_WEEKLY':
          apiParams.function = 'TIME_SERIES_WEEKLY';
          if (!parsedParams.symbol)
            throw new Error('Symbol is required for TIME_SERIES_WEEKLY');
          apiParams.symbol = parsedParams.symbol;
          if (parsedParams.datatype) apiParams.datatype = parsedParams.datatype;
          break;

        case 'TIME_SERIES_WEEKLY_ADJUSTED':
          apiParams.function = 'TIME_SERIES_WEEKLY_ADJUSTED';
          if (!parsedParams.symbol)
            throw new Error(
              'Symbol is required for TIME_SERIES_WEEKLY_ADJUSTED',
            );
          apiParams.symbol = parsedParams.symbol;
          if (parsedParams.datatype) apiParams.datatype = parsedParams.datatype;
          break;

        case 'TIME_SERIES_MONTHLY':
          apiParams.function = 'TIME_SERIES_MONTHLY';
          if (!parsedParams.symbol)
            throw new Error('Symbol is required for TIME_SERIES_MONTHLY');
          apiParams.symbol = parsedParams.symbol;
          if (parsedParams.datatype) apiParams.datatype = parsedParams.datatype;
          break;

        case 'TIME_SERIES_MONTHLY_ADJUSTED':
          apiParams.function = 'TIME_SERIES_MONTHLY_ADJUSTED';
          if (!parsedParams.symbol)
            throw new Error(
              'Symbol is required for TIME_SERIES_MONTHLY_ADJUSTED',
            );
          apiParams.symbol = parsedParams.symbol;
          if (parsedParams.datatype) apiParams.datatype = parsedParams.datatype;
          break;

        case 'GLOBAL_QUOTE':
          apiParams.function = 'GLOBAL_QUOTE';
          if (!parsedParams.symbol)
            throw new Error('Symbol is required for GLOBAL_QUOTE');
          apiParams.symbol = parsedParams.symbol;
          if (parsedParams.datatype) apiParams.datatype = parsedParams.datatype;
          if (parsedParams.entitlement)
            apiParams.entitlement = parsedParams.entitlement;
          break;

        case 'REALTIME_BULK_QUOTES':
          apiParams.function = 'REALTIME_BULK_QUOTES';
          if (!parsedParams.symbol)
            throw new Error('Symbol is required for REALTIME_BULK_QUOTES');
          apiParams.symbol = parsedParams.symbol;
          if (parsedParams.datatype) apiParams.datatype = parsedParams.datatype;
          break;

        case 'SYMBOL_SEARCH':
          apiParams.function = 'SYMBOL_SEARCH';
          if (!parsedParams.keywords)
            throw new Error('Keywords is required for SYMBOL_SEARCH');
          apiParams.keywords = parsedParams.keywords;
          if (parsedParams.datatype) apiParams.datatype = parsedParams.datatype;
          break;

        case 'MARKET_STATUS':
          apiParams.function = 'MARKET_STATUS';
          break;
      }

      const data = await makeAlphaVantageRequest(
        parsedParams.function,
        apiParams,
        parsedParams.datatype || 'json',
      );

      log.info('Successfully executed core stock API', {
        function: parsedParams.function,
        dataType: typeof data,
      });

      return formatAlphaVantageResponse(data, parsedParams.function);
    } catch (error) {
      log.error(
        { err: error, params: parsedParams },
        'Error executing core stock API',
      );
      throw new Error(
        `Failed to execute ${parsedParams.function}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  },

  name: 'core_stock_apis',
  parameters: CoreStockParams,
};
