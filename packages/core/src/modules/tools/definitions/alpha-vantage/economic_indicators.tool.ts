import { z } from 'zod';
import type { Tool } from '../../../../types.ts';
import { getConfig } from '../../../../config.ts';
import {
  makeAlphaVantageRequest,
  formatAlphaVantageResponse,
  AlphaVantageBaseParams,
} from './common.ts';

// Combined parameters for Economic Indicators APIs
const EconomicIndicatorsParams = z.object({
  function: z
    .enum([
      'INFLATION',
      'WTI',
      'REAL_GDP',
      'REAL_GDP_PER_CAPITA',
      'TREASURY_YIELD',
      'FEDERAL_FUNDS_RATE',
      'CPI',
      'RETAIL_SALES',
      'DURABLES',
      'UNEMPLOYMENT',
      'NONFARM_PAYROLL',
    ])
    .describe('Economic indicator function to execute'),
  interval: z
    .enum(['monthly', 'quarterly', 'annual', 'daily', 'weekly', 'semiannual'])
    .optional()
    .default('monthly')
    .describe('Data interval'),
  maturity: z
    .enum(['3month', '2year', '5year', '7year', '10year', '30year'])
    .optional()
    .default('10year')
    .describe('Treasury yield maturity - for TREASURY_YIELD'),
  datatype: z
    .enum(['json', 'csv'])
    .optional()
    .default('json')
    .describe('Response format'),
  apikey: z
    .string()
    .optional()
    .describe('Alpha Vantage API key (automatically loaded from .env)'),
});

export const economicIndicatorsTool: Tool<typeof EconomicIndicatorsParams> = {
  description:
    'Comprehensive economic indicators including inflation, GDP, treasury yields, federal funds rate, CPI, retail sales, durables, unemployment, and nonfarm payroll. Provides extensive macroeconomic data for comprehensive market analysis.',

  execute: async (params, context) => {
    const { log } = context;
    const parsedParams = EconomicIndicatorsParams.parse(params);

    try {
      log.info('Executing Economic Indicators API', {
        function: parsedParams.function,
        interval: parsedParams.interval,
      });

      // Get API key from config if not provided
      const apiKey = parsedParams.apikey || getConfig().ALPHA_VANTAGE_API_KEY;
      if (!apiKey) {
        throw new Error(
          'Alpha Vantage API key is required. Please set ALPHA_VANTAGE_API_KEY in your .env file or provide it as a parameter.',
        );
      }

      // Prepare API parameters based on function
      const apiParams: Record<string, string> = {
        apikey: apiKey,
      };

      switch (parsedParams.function) {
        case 'INFLATION':
          apiParams.function = 'INFLATION';
          if (parsedParams.datatype) apiParams.datatype = parsedParams.datatype;
          break;

        case 'WTI':
          apiParams.function = 'WTI';
          if (parsedParams.datatype) apiParams.datatype = parsedParams.datatype;
          break;

        case 'REAL_GDP':
          apiParams.function = 'REAL_GDP';
          if (parsedParams.interval) apiParams.interval = parsedParams.interval;
          if (parsedParams.datatype) apiParams.datatype = parsedParams.datatype;
          break;

        case 'REAL_GDP_PER_CAPITA':
          apiParams.function = 'REAL_GDP_PER_CAPITA';
          if (parsedParams.datatype) apiParams.datatype = parsedParams.datatype;
          break;

        case 'TREASURY_YIELD':
          apiParams.function = 'TREASURY_YIELD';
          if (parsedParams.interval) apiParams.interval = parsedParams.interval;
          if (parsedParams.maturity) apiParams.maturity = parsedParams.maturity;
          if (parsedParams.datatype) apiParams.datatype = parsedParams.datatype;
          break;

        case 'FEDERAL_FUNDS_RATE':
          apiParams.function = 'FEDERAL_FUNDS_RATE';
          if (parsedParams.interval) apiParams.interval = parsedParams.interval;
          if (parsedParams.datatype) apiParams.datatype = parsedParams.datatype;
          break;

        case 'CPI':
          apiParams.function = 'CPI';
          if (parsedParams.interval) apiParams.interval = parsedParams.interval;
          if (parsedParams.datatype) apiParams.datatype = parsedParams.datatype;
          break;

        case 'RETAIL_SALES':
          apiParams.function = 'RETAIL_SALES';
          if (parsedParams.datatype) apiParams.datatype = parsedParams.datatype;
          break;

        case 'DURABLES':
          apiParams.function = 'DURABLES';
          if (parsedParams.datatype) apiParams.datatype = parsedParams.datatype;
          break;

        case 'UNEMPLOYMENT':
          apiParams.function = 'UNEMPLOYMENT';
          if (parsedParams.datatype) apiParams.datatype = parsedParams.datatype;
          break;

        case 'NONFARM_PAYROLL':
          apiParams.function = 'NONFARM_PAYROLL';
          if (parsedParams.datatype) apiParams.datatype = parsedParams.datatype;
          break;
      }

      const data = await makeAlphaVantageRequest(
        parsedParams.function,
        apiParams,
        parsedParams.datatype,
      );

      log.info('Successfully executed Economic Indicators API', {
        function: parsedParams.function,
        dataType: typeof data,
      });

      return formatAlphaVantageResponse(data, parsedParams.function);
    } catch (error) {
      log.error(
        { err: error, params: parsedParams },
        'Error executing Economic Indicators API',
      );
      throw new Error(
        `Failed to execute ${parsedParams.function}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  },

  name: 'economic_indicators',
  parameters: EconomicIndicatorsParams,
};
