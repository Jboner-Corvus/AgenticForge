import { z } from 'zod';
import { getConfig } from '../../../../config.ts';
import type { Tool } from '../../../../types.ts';
import {
  makeAlphaVantageRequest,
  formatAlphaVantageResponse,
  AlphaVantageBaseParams,
} from './common.ts';

const InflationParams = AlphaVantageBaseParams;

export const inflationTool: Tool<typeof InflationParams> = {
  description:
    'Returns inflation rates data for the United States. This data represents the annual percentage change in consumer prices, which is a key economic indicator for monetary policy and investment decisions',

  execute: async (params, context) => {
    const { log } = context;
    const parsedParams = InflationParams.parse(params);

    try {
      log.info('Fetching inflation rates data');

      const apiParams: Record<string, string> = {
        apikey: parsedParams.apikey || getConfig().ALPHA_VANTAGE_API_KEY || '',
      };

      const data = await makeAlphaVantageRequest('INFLATION', apiParams);

      log.info('Successfully fetched inflation rates data', {
        dataType: typeof data,
      });

      return formatAlphaVantageResponse(data, 'INFLATION');
    } catch (error) {
      log.error(
        { err: error, params: parsedParams },
        'Error fetching inflation rates data',
      );
      throw new Error(
        `Failed to fetch inflation rates data: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  },

  name: 'inflation',
  parameters: InflationParams,
};
