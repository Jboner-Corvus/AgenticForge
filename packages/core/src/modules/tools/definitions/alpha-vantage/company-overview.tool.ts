import { z } from 'zod';
import type { Tool } from '../../../../types.ts';
import { getConfig } from '../../../../config.ts';
import {
  makeAlphaVantageRequest,
  formatAlphaVantageResponse,
  AlphaVantageBaseParams,
  SymbolParam,
} from './common.ts';

const CompanyOverviewParams = AlphaVantageBaseParams.merge(SymbolParam);

export const companyOverviewTool: Tool<typeof CompanyOverviewParams> = {
  description:
    'Returns comprehensive company information, financial ratios, and key metrics for the specified security',

  execute: async (params, context) => {
    const { log } = context;
    const parsedParams = CompanyOverviewParams.parse(params);

    try {
      log.info('Fetching company overview data', {
        symbol: parsedParams.symbol,
      });

      // Get API key from config if not provided
      const apiKey = parsedParams.apikey || getConfig().ALPHA_VANTAGE_API_KEY;
      if (!apiKey) {
        throw new Error(
          'Alpha Vantage API key is required. Please set ALPHA_VANTAGE_API_KEY in your .env file or provide it as a parameter.',
        );
      }

      const apiParams: Record<string, string> = {
        symbol: parsedParams.symbol,
        apikey: apiKey,
      };

      const data = await makeAlphaVantageRequest('OVERVIEW', apiParams);

      log.info('Successfully fetched company overview data', {
        symbol: parsedParams.symbol,
        company: data?.Name || 'Unknown',
      });

      return formatAlphaVantageResponse(data, 'OVERVIEW');
    } catch (error) {
      log.error(
        { err: error, params: parsedParams },
        'Error fetching company overview data',
      );
      throw new Error(
        `Failed to fetch company overview data for ${parsedParams.symbol}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  },

  name: 'company_overview',
  parameters: CompanyOverviewParams,
};
