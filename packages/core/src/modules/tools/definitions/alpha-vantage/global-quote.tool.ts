import { z } from 'zod';
import type { Tool } from '../../../../types.ts';
import { getConfig } from '../../../../config.ts';
import {
  makeAlphaVantageRequest,
  formatAlphaVantageResponse,
  AlphaVantageBaseParams,
  SymbolParam,
} from './common.ts';

const GlobalQuoteParams = AlphaVantageBaseParams.merge(SymbolParam).extend({
  entitlement: z
    .enum(['delayed', 'realtime'])
    .optional()
    .describe(
      'Data entitlement: "delayed" for 15-minute delayed data, "realtime" for real-time data',
    ),
});

export const globalQuoteTool: Tool<typeof GlobalQuoteParams> = {
  description:
    'Returns the latest price and volume information for the specified security',

  execute: async (params, context) => {
    const { log } = context;
    const parsedParams = GlobalQuoteParams.parse(params);

    try {
      log.info('Fetching global quote data', {
        symbol: parsedParams.symbol,
      });

      // Get API key from config if not provided
      const apiKey = parsedParams.apikey || getConfig().ALPHA_VANTAGE_API_KEY;
      if (!apiKey) {
        throw new Error(
          'Alpha Vantage API key is required. Please set ALPHA_VANTAGE_API_KEY in your .env file or provide it as a parameter.',
        );
      }

      // Prepare API parameters
      const apiParams: Record<string, string> = {
        symbol: parsedParams.symbol,
        apikey: apiKey,
      };

      // Add optional parameters
      if (parsedParams.entitlement) {
        apiParams.entitlement = parsedParams.entitlement;
      }

      const data = await makeAlphaVantageRequest('GLOBAL_QUOTE', apiParams);

      log.info('Successfully fetched global quote data', {
        symbol: parsedParams.symbol,
        dataType: typeof data,
      });

      return formatAlphaVantageResponse(data, 'GLOBAL_QUOTE');
    } catch (error) {
      log.error(
        { err: error, params: parsedParams },
        'Error fetching global quote data',
      );
      throw new Error(
        `Failed to fetch global quote data for ${parsedParams.symbol}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  },

  name: 'global_quote',
  parameters: GlobalQuoteParams,
};
