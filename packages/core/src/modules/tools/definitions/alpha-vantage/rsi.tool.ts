import { z } from 'zod';
import { getConfig } from '../../../../config.ts';
import type { Tool } from '../../../../types.ts';
import {
  makeAlphaVantageRequest,
  formatAlphaVantageResponse,
  AlphaVantageBaseParams,
  SymbolParam,
  IntervalParam,
  DataTypeParam,
} from './common.ts';

const RSIParams = AlphaVantageBaseParams.merge(SymbolParam)
  .merge(IntervalParam)
  .merge(DataTypeParam)
  .extend({
    time_period: z
      .number()
      .int()
      .min(2)
      .max(200)
      .optional()
      .default(14)
      .describe(
        'Number of data points used to calculate the RSI (typically 14)',
      ),
    series_type: z
      .enum(['close', 'open', 'high', 'low'])
      .optional()
      .default('close')
      .describe('Price series to use for calculation'),
    entitlement: z
      .enum(['delayed', 'realtime'])
      .optional()
      .describe(
        'Data entitlement: "delayed" for 15-minute delayed data, "realtime" for real-time data',
      ),
  });

export const rsiTool: Tool<typeof RSIParams> = {
  description:
    'Returns Relative Strength Index (RSI) values for the specified security. RSI is a momentum oscillator that measures the speed and magnitude of price changes, typically used to identify overbought or oversold conditions (values above 70 indicate overbought, below 30 indicate oversold)',

  execute: async (params, context) => {
    const { log } = context;
    const parsedParams = RSIParams.parse(params);

    try {
      log.info('Fetching Relative Strength Index (RSI) data', {
        symbol: parsedParams.symbol,
        interval: parsedParams.interval,
        time_period: parsedParams.time_period,
      });

      // Prepare API parameters
      const apiParams: Record<string, string> = {
        symbol: parsedParams.symbol,
        interval: parsedParams.interval,
        time_period: parsedParams.time_period?.toString() || '60',
        series_type: parsedParams.series_type,
        apikey: parsedParams.apikey || getConfig().ALPHA_VANTAGE_API_KEY || '',
      };

      // Add optional parameters
      if (parsedParams.entitlement) {
        apiParams.entitlement = parsedParams.entitlement;
      }

      const data = await makeAlphaVantageRequest(
        'RSI',
        apiParams,
        parsedParams.datatype,
      );

      log.info('Successfully fetched RSI data', {
        symbol: parsedParams.symbol,
        time_period: parsedParams.time_period,
        dataType: typeof data,
      });

      return formatAlphaVantageResponse(data, 'RSI');
    } catch (error) {
      log.error(
        { err: error, params: parsedParams },
        'Error fetching RSI data',
      );
      throw new Error(
        `Failed to fetch RSI data for ${parsedParams.symbol}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  },

  name: 'rsi',
  parameters: RSIParams,
};
