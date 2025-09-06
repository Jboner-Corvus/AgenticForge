import { z } from 'zod';
import { getConfig } from '../../../../config.ts';
import type { Tool } from '../../../../types.ts';
import {
  makeAlphaVantageRequest,
  formatAlphaVantageResponse,
  AlphaVantageBaseParams,
  SymbolParam,
  IntervalParam,
  OutputSizeParam,
  DataTypeParam,
} from './common.ts';

const TimeSeriesIntradayParams = AlphaVantageBaseParams
  .merge(SymbolParam)
  .merge(IntervalParam)
  .merge(OutputSizeParam)
  .merge(DataTypeParam)
  .extend({
    adjusted: z
      .boolean()
      .optional()
      .default(true)
      .describe('Whether to return adjusted data (true) or raw data (false)'),
    extended_hours: z
      .boolean()
      .optional()
      .default(true)
      .describe('Whether to include extended hours trading data'),
    month: z
      .string()
      .optional()
      .describe('Query specific month in YYYY-MM format (e.g., 2009-01)'),
    entitlement: z
      .enum(['delayed', 'realtime'])
      .optional()
      .describe('Data entitlement: "delayed" for 15-minute delayed data, "realtime" for real-time data'),
  });

export const timeSeriesIntradayTool: Tool<typeof TimeSeriesIntradayParams> = {
  description: 'Returns current and 20+ years of historical intraday OHLCV time series data for the specified equity',
  
  execute: async (params, context) => {
    const { log } = context;
    const parsedParams = TimeSeriesIntradayParams.parse(params);
    
    try {
      log.info('Fetching intraday time series data', { 
        symbol: parsedParams.symbol, 
        interval: parsedParams.interval 
      });

      // Prepare API parameters
      const apiParams: Record<string, string> = {
        symbol: parsedParams.symbol,
        interval: parsedParams.interval,
        outputsize: parsedParams.outputsize || 'compact',
        datatype: parsedParams.datatype || 'json',
        apikey: parsedParams.apikey || getConfig().ALPHA_VANTAGE_API_KEY || '',
      };

      // Add optional parameters
      if (parsedParams.month) {
        apiParams.month = parsedParams.month;
      }

      if (parsedParams.entitlement) {
        apiParams.entitlement = parsedParams.entitlement;
      }

      const data = await makeAlphaVantageRequest('TIME_SERIES_INTRADAY', apiParams, parsedParams.datatype);
      
      log.info('Successfully fetched intraday time series data', { 
        symbol: parsedParams.symbol,
        dataType: typeof data
      });

      return formatAlphaVantageResponse(data, 'TIME_SERIES_INTRADAY');
      
    } catch (error) {
      log.error({ err: error, params: parsedParams }, 'Error fetching intraday time series data');
      throw new Error(
        `Failed to fetch intraday time series data for ${parsedParams.symbol}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  },
  
  name: 'time_series_intraday',
  parameters: TimeSeriesIntradayParams,
};