import { z } from 'zod';
import type { Tool } from '../../../../types.ts';
import { getConfig } from '../../../../config.ts';
import {
  makeAlphaVantageRequest,
  formatAlphaVantageResponse,
  AlphaVantageBaseParams,
  IntervalParam,
} from './common.ts';

const WTIParams = AlphaVantageBaseParams.merge(IntervalParam);

export const wtiTool: Tool<typeof WTIParams> = {
  description:
    'Returns West Texas Intermediate (WTI) crude oil prices. WTI is a major oil benchmark for North American crude oil prices',

  execute: async (params, context) => {
    const { log } = context;
    const parsedParams = WTIParams.parse(params);

    try {
      log.info('Fetching WTI crude oil prices', {
        interval: parsedParams.interval,
      });

      // Get API key from config if not provided
      const apiKey = parsedParams.apikey || getConfig().ALPHA_VANTAGE_API_KEY;
      if (!apiKey) {
        throw new Error(
          'Alpha Vantage API key is required. Please set ALPHA_VANTAGE_API_KEY in your .env file or provide it as a parameter.',
        );
      }

      const apiParams: Record<string, string> = {
        interval: parsedParams.interval,
        apikey: apiKey,
      };

      const data = await makeAlphaVantageRequest('WTI', apiParams);

      log.info('Successfully fetched WTI crude oil prices', {
        interval: parsedParams.interval,
        dataType: typeof data,
      });

      return formatAlphaVantageResponse(data, 'WTI');
    } catch (error) {
      log.error(
        { err: error, params: parsedParams },
        'Error fetching WTI crude oil prices',
      );
      throw new Error(
        `Failed to fetch WTI crude oil prices: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  },

  name: 'wti',
  parameters: WTIParams,
};
