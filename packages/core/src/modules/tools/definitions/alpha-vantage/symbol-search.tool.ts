import { z } from 'zod';
import { getConfig } from '../../../../config.ts';
import type { Tool } from '../../../../types.ts';
import {
  makeAlphaVantageRequest,
  formatAlphaVantageResponse,
  AlphaVantageBaseParams,
} from './common.ts';

const SymbolSearchParams = AlphaVantageBaseParams.extend({
  keywords: z
    .string()
    .min(1)
    .describe('Keywords to search for company symbols (e.g., "microsoft", "tech", "energy")'),
});

export const symbolSearchTool: Tool<typeof SymbolSearchParams> = {
  description: 'Search for symbols by keywords. Returns best matching symbols and company information based on the keywords',
  
  execute: async (params, context) => {
    const { log } = context;
    const parsedParams = SymbolSearchParams.parse(params);
    
    try {
      log.info('Searching symbols', { 
        keywords: parsedParams.keywords 
      });

      const apiParams: Record<string, string> = {
        keywords: parsedParams.keywords,
        apikey: parsedParams.apikey || getConfig().ALPHA_VANTAGE_API_KEY || '',
      };

      const data = await makeAlphaVantageRequest('SYMBOL_SEARCH', apiParams);
      
      log.info('Successfully searched symbols', { 
        keywords: parsedParams.keywords,
        resultsCount: data?.bestMatches?.length || 0
      });

      return formatAlphaVantageResponse(data, 'SYMBOL_SEARCH');
      
    } catch (error) {
      log.error({ err: error, params: parsedParams }, 'Error searching symbols');
      throw new Error(
        `Failed to search symbols with keywords "${parsedParams.keywords}": ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  },
  
  name: 'symbol_search',
  parameters: SymbolSearchParams,
};