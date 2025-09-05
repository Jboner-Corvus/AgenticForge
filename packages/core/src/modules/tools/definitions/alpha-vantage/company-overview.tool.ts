import { z } from 'zod';
import type { Tool } from '../../../../types.ts';
import {
  makeAlphaVantageRequest,
  formatAlphaVantageResponse,
  AlphaVantageBaseParams,
  SymbolParam,
} from './common.ts';

const CompanyOverviewParams = AlphaVantageBaseParams.merge(SymbolParam);

export const companyOverviewTool: Tool<typeof CompanyOverviewParams> = {
  description: 'Returns comprehensive company information, financial ratios, and key metrics for the specified security',
  
  execute: async (params, context) => {
    const { log } = context;
    const parsedParams = CompanyOverviewParams.parse(params);
    
    try {
      log.info('Fetching company overview data', { 
        symbol: parsedParams.symbol 
      });

      const apiParams: Record<string, string> = {
        symbol: parsedParams.symbol,
        apikey: parsedParams.apikey,
      };

      const data = await makeAlphaVantageRequest('OVERVIEW', apiParams);
      
      log.info('Successfully fetched company overview data', { 
        symbol: parsedParams.symbol,
        company: data?.Name || 'Unknown'
      });

      return formatAlphaVantageResponse(data, 'OVERVIEW');
      
    } catch (error) {
      log.error({ err: error, params: parsedParams }, 'Error fetching company overview data');
      throw new Error(
        `Failed to fetch company overview data for ${parsedParams.symbol}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  },
  
  name: 'company_overview',
  parameters: CompanyOverviewParams,
};