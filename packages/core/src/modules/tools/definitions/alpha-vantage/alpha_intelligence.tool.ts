import { z } from 'zod';
import type { Tool } from '../../../../types.ts';
import { getConfig } from '../../../../config.ts';
import {
  makeAlphaVantageRequest,
  formatAlphaVantageResponse,
  AlphaVantageBaseParams,
  SymbolParam,
} from './common.ts';

// Combined parameters for Alpha Intelligence APIs
const AlphaIntelligenceParams = z.object({
  function: z
    .enum([
      'NEWS_SENTIMENT',
      'OVERVIEW',
      'EARNINGS_CALL_TRANSCRIPT',
      'TOP_GAINERS_LOSERS',
      'INSIDER_TRANSACTIONS',
      'ANALYTICS_FIXED_WINDOW',
      'ANALYTICS_SLIDING_WINDOW',
    ])
    .describe('Alpha Vantage intelligence function to execute'),
  symbol: z
    .string()
    .min(1)
    .max(10)
    .optional()
    .describe(
      'Stock symbol (e.g., IBM, AAPL) - required for OVERVIEW, EARNINGS_CALL_TRANSCRIPT, INSIDER_TRANSACTIONS',
    ),
  tickers: z
    .string()
    .optional()
    .describe('Stock tickers separated by commas - for NEWS_SENTIMENT'),
  topics: z
    .string()
    .optional()
    .describe('News topics separated by commas - for NEWS_SENTIMENT'),
  time_from: z
    .string()
    .optional()
    .describe(
      'Start time for news articles in format YYYYMMDDTHHMM - for NEWS_SENTIMENT',
    ),
  time_to: z
    .string()
    .optional()
    .describe(
      'End time for news articles in format YYYYMMDDTHHMM - for NEWS_SENTIMENT',
    ),
  sort: z
    .enum(['LATEST', 'EARLIEST', 'RELEVANCE'])
    .optional()
    .default('LATEST')
    .describe('Sort order for news articles - for NEWS_SENTIMENT'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(1000)
    .optional()
    .default(50)
    .describe('Maximum number of news articles to return - for NEWS_SENTIMENT'),
  quarter: z
    .string()
    .optional()
    .describe(
      'Fiscal quarter in YYYYQM format (e.g., 2024Q1) - for EARNINGS_CALL_TRANSCRIPT',
    ),
  symbols: z
    .string()
    .optional()
    .describe('Comma-separated list of symbols - for ANALYTICS functions'),
  range_param: z
    .string()
    .optional()
    .describe('Date range for the series - for ANALYTICS functions'),
  interval: z
    .enum([
      '1min',
      '5min',
      '15min',
      '30min',
      '60min',
      'DAILY',
      'WEEKLY',
      'MONTHLY',
    ])
    .optional()
    .describe('Time interval - for ANALYTICS functions'),
  window_size: z
    .number()
    .int()
    .min(10)
    .optional()
    .describe('Size of moving window - for ANALYTICS_SLIDING_WINDOW'),
  calculations: z
    .string()
    .optional()
    .describe('Comma-separated analytics metrics - for ANALYTICS functions'),
  ohlc: z
    .enum(['open', 'high', 'low', 'close'])
    .optional()
    .default('close')
    .describe('OHLC field for calculation - for ANALYTICS functions'),
  datatype: z
    .enum(['json', 'csv'])
    .optional()
    .default('json')
    .describe('Response format'),
  apikey: z
    .string()
    .optional()
    .describe('Alpha Vantage API key (automatically loaded from .env)'),
});

export const alphaIntelligenceTool: Tool<typeof AlphaIntelligenceParams> = {
  description:
    'Comprehensive Alpha Intelligence APIs including market news, sentiment analysis, company overviews, earnings transcripts, insider transactions, top gainers/losers, and advanced analytics. Provides extensive market intelligence and analytical tools.',

  execute: async (params, context) => {
    const { log } = context;
    const parsedParams = AlphaIntelligenceParams.parse(params);

    try {
      log.info('Executing Alpha Intelligence API', {
        function: parsedParams.function,
        symbol: parsedParams.symbol,
        tickers: parsedParams.tickers,
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
        case 'NEWS_SENTIMENT':
          apiParams.function = 'NEWS_SENTIMENT';
          if (parsedParams.tickers) apiParams.tickers = parsedParams.tickers;
          if (parsedParams.topics) apiParams.topics = parsedParams.topics;
          if (parsedParams.time_from)
            apiParams.time_from = parsedParams.time_from;
          if (parsedParams.time_to) apiParams.time_to = parsedParams.time_to;
          if (parsedParams.sort) apiParams.sort = parsedParams.sort;
          if (parsedParams.limit)
            apiParams.limit = parsedParams.limit.toString();
          if (parsedParams.datatype) apiParams.datatype = parsedParams.datatype;
          break;

        case 'OVERVIEW':
          apiParams.function = 'OVERVIEW';
          if (!parsedParams.symbol)
            throw new Error('Symbol is required for OVERVIEW');
          apiParams.symbol = parsedParams.symbol;
          if (parsedParams.datatype) apiParams.datatype = parsedParams.datatype;
          break;

        case 'EARNINGS_CALL_TRANSCRIPT':
          apiParams.function = 'EARNINGS_CALL_TRANSCRIPT';
          if (!parsedParams.symbol)
            throw new Error('Symbol is required for EARNINGS_CALL_TRANSCRIPT');
          if (!parsedParams.quarter)
            throw new Error('Quarter is required for EARNINGS_CALL_TRANSCRIPT');
          apiParams.symbol = parsedParams.symbol;
          apiParams.quarter = parsedParams.quarter;
          if (parsedParams.datatype) apiParams.datatype = parsedParams.datatype;
          break;

        case 'TOP_GAINERS_LOSERS':
          apiParams.function = 'TOP_GAINERS_LOSERS';
          if (parsedParams.datatype) apiParams.datatype = parsedParams.datatype;
          break;

        case 'INSIDER_TRANSACTIONS':
          apiParams.function = 'INSIDER_TRANSACTIONS';
          if (!parsedParams.symbol)
            throw new Error('Symbol is required for INSIDER_TRANSACTIONS');
          apiParams.symbol = parsedParams.symbol;
          if (parsedParams.datatype) apiParams.datatype = parsedParams.datatype;
          break;

        case 'ANALYTICS_FIXED_WINDOW':
          apiParams.function = 'ANALYTICS_FIXED_WINDOW';
          if (!parsedParams.symbols)
            throw new Error('Symbols is required for ANALYTICS_FIXED_WINDOW');
          if (!parsedParams.range_param)
            throw new Error('Range is required for ANALYTICS_FIXED_WINDOW');
          if (!parsedParams.interval)
            throw new Error('Interval is required for ANALYTICS_FIXED_WINDOW');
          if (!parsedParams.calculations)
            throw new Error(
              'Calculations is required for ANALYTICS_FIXED_WINDOW',
            );
          apiParams.SYMBOLS = parsedParams.symbols;
          apiParams.RANGE = parsedParams.range_param;
          apiParams.INTERVAL = parsedParams.interval;
          apiParams.CALCULATIONS = parsedParams.calculations;
          if (parsedParams.ohlc) apiParams.OHLC = parsedParams.ohlc;
          if (parsedParams.datatype) apiParams.datatype = parsedParams.datatype;
          break;

        case 'ANALYTICS_SLIDING_WINDOW':
          apiParams.function = 'ANALYTICS_SLIDING_WINDOW';
          if (!parsedParams.symbols)
            throw new Error('Symbols is required for ANALYTICS_SLIDING_WINDOW');
          if (!parsedParams.range_param)
            throw new Error('Range is required for ANALYTICS_SLIDING_WINDOW');
          if (!parsedParams.interval)
            throw new Error(
              'Interval is required for ANALYTICS_SLIDING_WINDOW',
            );
          if (!parsedParams.window_size)
            throw new Error(
              'Window size is required for ANALYTICS_SLIDING_WINDOW',
            );
          if (!parsedParams.calculations)
            throw new Error(
              'Calculations is required for ANALYTICS_SLIDING_WINDOW',
            );
          apiParams.SYMBOLS = parsedParams.symbols;
          apiParams.RANGE = parsedParams.range_param;
          apiParams.INTERVAL = parsedParams.interval;
          apiParams.WINDOW_SIZE = parsedParams.window_size.toString();
          apiParams.CALCULATIONS = parsedParams.calculations;
          if (parsedParams.ohlc) apiParams.OHLC = parsedParams.ohlc;
          if (parsedParams.datatype) apiParams.datatype = parsedParams.datatype;
          break;
      }

      const data = await makeAlphaVantageRequest(
        parsedParams.function,
        apiParams,
      );

      log.info('Successfully executed Alpha Intelligence API', {
        function: parsedParams.function,
        dataType: typeof data,
      });

      return formatAlphaVantageResponse(data, parsedParams.function);
    } catch (error) {
      log.error(
        { err: error, params: parsedParams },
        'Error executing Alpha Intelligence API',
      );
      throw new Error(
        `Failed to execute ${parsedParams.function}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  },

  name: 'alpha_intelligence',
  parameters: AlphaIntelligenceParams,
};
