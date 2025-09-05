import { z } from 'zod';
import type { Tool } from '../../../../types.ts';
import {
  makeAlphaVantageRequest,
  formatAlphaVantageResponse,
  AlphaVantageBaseParams,
  SymbolParam,
  OutputSizeParam,
  DataTypeParam,
} from './common.ts';

const TimeSeriesDailyParams = AlphaVantageBaseParams
  .merge(SymbolParam)
  .merge(OutputSizeParam)
  .merge(DataTypeParam)
  .extend({
    entitlement: z
      .enum(['delayed', 'realtime'])
      .optional()
      .describe('Data entitlement: "delayed" for 15-minute delayed data, "realtime" for real-time data'),
  });

export const timeSeriesDailyTool: Tool<typeof TimeSeriesDailyParams> = {
  description: 'Returns raw daily time series (OHLCV) data for the specified equity, covering 20+ years of historical data',
  
  execute: async (params, context) => {
    const { log } = context;
    const parsedParams = TimeSeriesDailyParams.parse(params);
    
    try {
      log.info('Fetching daily time series data', { 
        symbol: parsedParams.symbol 
      });

      // Prepare API parameters
      const apiParams: Record<string, string> = {
        symbol: parsedParams.symbol,
        outputsize: parsedParams.outputsize,
        datatype: parsedParams.datatype,
        apikey: parsedParams.apikey,
      };

      // Add optional parameters
      if (parsedParams.entitlement) {
        apiParams.entitlement = parsedParams.entitlement;
      }

      const data = await makeAlphaVantageRequest('TIME_SERIES_DAILY', apiParams, parsedParams.datatype);
      
      log.info('Successfully fetched daily time series data', { 
        symbol: parsedParams.symbol,
        dataType: typeof data
      });

      return formatAlphaVantageResponse(data, 'TIME_SERIES_DAILY');
      
    } catch (error) {
      log.error({ err: error, params: parsedParams }, 'Error fetching daily time series data');
      throw new Error(
        `Failed to fetch daily time series data for ${parsedParams.symbol}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  },
  
  name: 'time_series_daily',
  parameters: TimeSeriesDailyParams,
};