import { z } from 'zod';
import type { Tool } from '../../../../types.ts';
import { getConfig } from '../../../../config.ts';
import {
  makeAlphaVantageRequest,
  formatAlphaVantageResponse,
  AlphaVantageBaseParams,
  SymbolParam,
} from './common.ts';

const FinanceParams = AlphaVantageBaseParams
  .merge(SymbolParam)
  .extend({
    action: z.enum([
      'quote',           // Current price & volume
      'overview',        // Company information
      'daily',          // Historical daily data
      'intraday',       // Intraday data
      'technical',      // RSI, SMA, etc.
      'search'          // Symbol search
    ]).describe('Type of financial data to retrieve'),
    interval: z.enum(['1min', '5min', '15min', '30min', '60min'])
      .optional()
      .default('5min')
      .describe('Time interval for intraday data'),
    technical_indicator: z.enum(['rsi', 'sma', 'ema', 'macd', 'stoch', 'bbands'])
      .optional()
      .describe('Technical indicator to calculate'),
    outputsize: z.enum(['compact', 'full'])
      .optional()
      .default('compact')
      .describe('Data size: compact (100 points) or full (all available)'),
  });

export const financeTool: Tool<typeof FinanceParams> = {
  description: 'Comprehensive financial data tool - get quotes, company info, historical data, and technical analysis',

  execute: async (params, context) => {
    const { log } = context;
    const parsedParams = FinanceParams.parse(params);

    try {
      log.info('Fetching financial data', {
        symbol: parsedParams.symbol,
        action: parsedParams.action
      });

      // Get API key from config if not provided
      const apiKey = parsedParams.apikey || getConfig().ALPHA_VANTAGE_API_KEY;
      if (!apiKey) {
        throw new Error('Alpha Vantage API key is required. Please set ALPHA_VANTAGE_API_KEY in your .env file or provide it as a parameter.');
      }

      let functionName: string;
      let apiParams: Record<string, string> = {
        symbol: parsedParams.symbol,
        apikey: apiKey,
      };

      // Determine API function based on action
      switch (parsedParams.action) {
        case 'quote':
          functionName = 'GLOBAL_QUOTE';
          break;
        case 'overview':
          functionName = 'OVERVIEW';
          break;
        case 'daily':
          functionName = 'TIME_SERIES_DAILY';
          apiParams.outputsize = parsedParams.outputsize;
          break;
        case 'intraday':
          functionName = 'TIME_SERIES_INTRADAY';
          apiParams.interval = parsedParams.interval;
          apiParams.outputsize = parsedParams.outputsize;
          break;
        case 'technical':
          if (!parsedParams.technical_indicator) {
            throw new Error('technical_indicator is required when action is "technical"');
          }
          switch (parsedParams.technical_indicator) {
            case 'rsi':
              functionName = 'RSI';
              break;
            case 'sma':
              functionName = 'SMA';
              break;
            case 'ema':
              functionName = 'EMA';
              break;
            case 'macd':
              functionName = 'MACD';
              break;
            case 'stoch':
              functionName = 'STOCH';
              break;
            case 'bbands':
              functionName = 'BBANDS';
              break;
            default:
              throw new Error(`Unsupported technical indicator: ${parsedParams.technical_indicator}`);
          }
          apiParams.interval = parsedParams.interval;
          apiParams.time_period = '14'; // Default period
          break;
        case 'search':
          functionName = 'SYMBOL_SEARCH';
          break;
        default:
          throw new Error(`Unsupported action: ${parsedParams.action}`);
      }

      const data = await makeAlphaVantageRequest(functionName, apiParams);

      log.info('Successfully fetched financial data', {
        symbol: parsedParams.symbol,
        action: parsedParams.action,
        function: functionName
      });

      return formatAlphaVantageResponse(data, functionName);

    } catch (error) {
      log.error({ err: error, params: parsedParams }, 'Error fetching financial data');
      throw new Error(
        `Failed to fetch financial data for ${parsedParams.symbol}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  },

  name: 'finance',
  parameters: FinanceParams,
};