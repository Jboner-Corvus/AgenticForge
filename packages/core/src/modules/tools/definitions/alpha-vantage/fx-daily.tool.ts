import { z } from 'zod';
import type { Tool } from '../../../../types.ts';
import {
  makeAlphaVantageRequest,
  formatAlphaVantageResponse,
  AlphaVantageBaseParams,
  OutputSizeParam,
  DataTypeParam,
} from './common.ts';

const FXDailyParams = AlphaVantageBaseParams
  .merge(OutputSizeParam)
  .merge(DataTypeParam)
  .extend({
    from_symbol: z
      .string()
      .length(3)
      .transform(val => val.toUpperCase())
      .describe('Source currency code (3-letter ISO code, e.g., EUR)'),
    to_symbol: z
      .string()
      .length(3)
      .transform(val => val.toUpperCase())
      .describe('Target currency code (3-letter ISO code, e.g., USD)'),
  });

export const fxDailyTool: Tool<typeof FXDailyParams> = {
  description: 'Returns daily foreign exchange (FX) rates for the specified currency pair, including open, high, low, and close prices',
  
  execute: async (params, context) => {
    const { log } = context;
    const parsedParams = FXDailyParams.parse(params);
    
    try {
      log.info('Fetching daily FX rates', { 
        from_symbol: parsedParams.from_symbol,
        to_symbol: parsedParams.to_symbol
      });

      const apiParams: Record<string, string> = {
        from_symbol: parsedParams.from_symbol,
        to_symbol: parsedParams.to_symbol,
        outputsize: parsedParams.outputsize,
        datatype: parsedParams.datatype,
        apikey: parsedParams.apikey,
      };

      const data = await makeAlphaVantageRequest('FX_DAILY', apiParams, parsedParams.datatype);
      
      log.info('Successfully fetched daily FX rates', { 
        from_symbol: parsedParams.from_symbol,
        to_symbol: parsedParams.to_symbol,
        dataType: typeof data
      });

      return formatAlphaVantageResponse(data, 'FX_DAILY');
      
    } catch (error) {
      log.error({ err: error, params: parsedParams }, 'Error fetching daily FX rates');
      throw new Error(
        `Failed to fetch daily FX rates for ${parsedParams.from_symbol}/${parsedParams.to_symbol}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  },
  
  name: 'fx_daily',
  parameters: FXDailyParams,
};