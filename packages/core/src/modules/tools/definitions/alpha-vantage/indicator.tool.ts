import { z } from 'zod';
import type { Tool } from '../../../../types.ts';
import { getConfig } from '../../../../config.ts';
import {
  makeAlphaVantageRequest,
  formatAlphaVantageResponse,
  AlphaVantageBaseParams,
  SymbolParam,
  IntervalParam,
  DataTypeParam,
} from './common.ts';

const IndicatorParams = AlphaVantageBaseParams
  .merge(SymbolParam)
  .merge(IntervalParam)
  .merge(DataTypeParam)
  .extend({
    indicator_type: z
      .enum(['rsi', 'sma', 'ema', 'macd', 'stoch', 'bbands'])
      .describe('Type of technical indicator to calculate'),
    time_period: z
      .number()
      .int()
      .min(1)
      .max(200)
      .optional()
      .describe('Number of data points used for calculation (default: 14 for RSI, 20 for SMA)'),
    series_type: z
      .enum(['close', 'open', 'high', 'low'])
      .optional()
      .default('close')
      .describe('Price series to use for calculation'),
    entitlement: z
      .enum(['delayed', 'realtime'])
      .optional()
      .describe('Data entitlement: "delayed" for 15-minute delayed data, "realtime" for real-time data'),
  });

export const indicatorTool: Tool<typeof IndicatorParams> = {
  description: 'Returns technical indicator values for the specified security. Supported indicators include RSI, SMA, EMA, MACD, STOCH, and BBANDS.',
  
  execute: async (params, context) => {
    const { log } = context;
    const parsedParams = IndicatorParams.parse(params);
    
    try {
      log.info('Fetching technical indicator data', { 
        symbol: parsedParams.symbol,
        indicator_type: parsedParams.indicator_type,
        interval: parsedParams.interval,
        time_period: parsedParams.time_period
      });

      // Prepare API parameters
      const apiParams: Record<string, string> = {
        symbol: parsedParams.symbol,
        interval: parsedParams.interval,
        series_type: parsedParams.series_type,
        apikey: parsedParams.apikey || getConfig().ALPHA_VANTAGE_API_KEY || '',
      };

      // Add time_period with appropriate defaults
      const timePeriod = parsedParams.time_period || (parsedParams.indicator_type === 'rsi' ? 14 : 20);
      apiParams.time_period = timePeriod.toString();

      // Add optional parameters
      if (parsedParams.entitlement) {
        apiParams.entitlement = parsedParams.entitlement;
      }

      const data = await makeAlphaVantageRequest(parsedParams.indicator_type.toUpperCase(), apiParams, parsedParams.datatype);
      
      log.info('Successfully fetched indicator data', { 
        symbol: parsedParams.symbol,
        indicator_type: parsedParams.indicator_type,
        time_period: timePeriod,
        dataType: typeof data
      });

      return formatAlphaVantageResponse(data, parsedParams.indicator_type.toUpperCase());
      
    } catch (error) {
      log.error({ err: error, params: parsedParams }, 'Error fetching indicator data');
      throw new Error(
        `Failed to fetch ${parsedParams.indicator_type.toUpperCase()} data for ${parsedParams.symbol}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  },
  
  name: 'indicator',
  parameters: IndicatorParams,
};