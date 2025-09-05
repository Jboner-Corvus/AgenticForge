import { z } from 'zod';
import type { Tool } from '../../../../types.ts';
import {
  makeAlphaVantageRequest,
  formatAlphaVantageResponse,
  AlphaVantageBaseParams,
  IntervalParam,
} from './common.ts';

const WTIParams = AlphaVantageBaseParams.merge(IntervalParam);

export const wtiTool: Tool<typeof WTIParams> = {
  description: 'Returns West Texas Intermediate (WTI) crude oil prices. WTI is a major oil benchmark for North American crude oil prices',
  
  execute: async (params, context) => {
    const { log } = context;
    const parsedParams = WTIParams.parse(params);
    
    try {
      log.info('Fetching WTI crude oil prices', { 
        interval: parsedParams.interval
      });

      const apiParams: Record<string, string> = {
        interval: parsedParams.interval,
        apikey: parsedParams.apikey,
      };

      const data = await makeAlphaVantageRequest('WTI', apiParams);
      
      log.info('Successfully fetched WTI crude oil prices', { 
        interval: parsedParams.interval,
        dataType: typeof data
      });

      return formatAlphaVantageResponse(data, 'WTI');
      
    } catch (error) {
      log.error({ err: error, params: parsedParams }, 'Error fetching WTI crude oil prices');
      throw new Error(
        `Failed to fetch WTI crude oil prices: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  },
  
  name: 'wti',
  parameters: WTIParams,
};