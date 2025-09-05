import { z } from 'zod';
import type { Tool } from '../../../../types.ts';
import {
  makeAlphaVantageRequest,
  formatAlphaVantageResponse,
  AlphaVantageBaseParams,
  SymbolParam,
  IntervalParam,
  DataTypeParam,
} from './common.ts';

const SMAParams = AlphaVantageBaseParams
  .merge(SymbolParam)
  .merge(IntervalParam)
  .merge(DataTypeParam)
  .extend({
    time_period: z
      .number()
      .int()
      .min(1)
      .max(200)
      .describe('Number of data points used to calculate the moving average'),
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

export const smaTool: Tool<typeof SMAParams> = {
  description: 'Returns Simple Moving Average (SMA) values for the specified security. SMA is a technical indicator that smooths price data by calculating the average price over a specific period',
  
  execute: async (params, context) => {
    const { log } = context;
    const parsedParams = SMAParams.parse(params);
    
    try {
      log.info('Fetching Simple Moving Average (SMA) data', { 
        symbol: parsedParams.symbol,
        interval: parsedParams.interval,
        time_period: parsedParams.time_period
      });

      // Prepare API parameters
      const apiParams: Record<string, string> = {
        symbol: parsedParams.symbol,
        interval: parsedParams.interval,
        time_period: parsedParams.time_period.toString(),
        series_type: parsedParams.series_type,
        datatype: parsedParams.datatype,
        apikey: parsedParams.apikey,
      };

      // Add optional parameters
      if (parsedParams.entitlement) {
        apiParams.entitlement = parsedParams.entitlement;
      }

      const data = await makeAlphaVantageRequest('SMA', apiParams, parsedParams.datatype);
      
      log.info('Successfully fetched SMA data', { 
        symbol: parsedParams.symbol,
        time_period: parsedParams.time_period,
        dataType: typeof data
      });

      return formatAlphaVantageResponse(data, 'SMA');
      
    } catch (error) {
      log.error({ err: error, params: parsedParams }, 'Error fetching SMA data');
      throw new Error(
        `Failed to fetch SMA data for ${parsedParams.symbol}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  },
  
  name: 'sma',
  parameters: SMAParams,
};