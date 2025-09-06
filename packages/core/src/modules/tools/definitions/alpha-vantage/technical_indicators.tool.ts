import { z } from 'zod';
import type { Tool } from '../../../../types.ts';
import { getConfig } from '../../../../config.ts';
import {
  makeAlphaVantageRequest,
  formatAlphaVantageResponse,
  AlphaVantageBaseParams,
  SymbolParam,
  IntervalParam,
  DataTypeParam,
} from './common.ts';

// Combined parameters for Technical Indicators APIs
const TechnicalIndicatorsParams = z.object({
  function: z.enum([
    'SMA', 'EMA', 'WMA', 'DEMA', 'TEMA', 'TRIMA', 'KAMA', 'MAMA', 'VWAP', 'T3',
    'MACD', 'MACDEXT', 'STOCH', 'STOCHF', 'RSI', 'STOCHRSI', 'WILLR', 'ADX',
    'ADXR', 'APO', 'PPO', 'MOM', 'BOP', 'CCI', 'CMO', 'ROC', 'ROCR', 'AROON', 'AROONOSC',
    'MFI', 'TRIX', 'ULTOSC', 'DX', 'MINUS_DI', 'PLUS_DI', 'MINUS_DM', 'PLUS_DM',
    'BBANDS', 'MIDPOINT', 'MIDPRICE', 'SAR', 'TRANGE', 'ATR', 'NATR', 'AD', 'ADOSC',
    'OBV', 'HT_TRENDLINE', 'HT_SINE', 'HT_TRENDMODE', 'HT_DCPERIOD', 'HT_DCPHASE', 'HT_PHASOR'
  ]).describe('Technical indicator function to execute'),
  symbol: z.string().min(1).max(10).describe('Stock symbol (e.g., IBM, AAPL)'),
  interval: z.enum(['1min', '5min', '15min', '30min', '60min', 'daily', 'weekly', 'monthly']).describe('Time interval for data points'),
  time_period: z.number().int().min(1).max(200).optional().default(14).describe('Number of data points used for calculation'),
  series_type: z.enum(['close', 'open', 'high', 'low']).optional().default('close').describe('Price series to use for calculation'),
  fastperiod: z.number().int().min(1).max(200).optional().default(12).describe('Fast period for MACD/APO/PPO'),
  slowperiod: z.number().int().min(1).max(200).optional().default(26).describe('Slow period for MACD/APO/PPO'),
  signalperiod: z.number().int().min(1).max(200).optional().default(9).describe('Signal period for MACD'),
  fastkperiod: z.number().int().min(1).max(200).optional().default(5).describe('Fast K period for STOCH'),
  fastdperiod: z.number().int().min(1).max(200).optional().default(3).describe('Fast D period for STOCH'),
  slowkperiod: z.number().int().min(1).max(200).optional().default(3).describe('Slow K period for STOCH'),
  slowdperiod: z.number().int().min(1).max(200).optional().default(3).describe('Slow D period for STOCH'),
  fastlimit: z.number().min(0).max(1).optional().default(0.01).describe('Fast limit for MAMA'),
  slowlimit: z.number().min(0).max(1).optional().default(0.01).describe('Slow limit for MAMA'),
  fastmatype: z.number().int().min(0).max(8).optional().default(0).describe('Fast MA type for MACDEXT'),
  slowmatype: z.number().int().min(0).max(8).optional().default(0).describe('Slow MA type for MACDEXT'),
  signalmatype: z.number().int().min(0).max(8).optional().default(0).describe('Signal MA type for MACDEXT'),
  slowkmatype: z.number().int().min(0).max(8).optional().default(0).describe('Slow K MA type for STOCH'),
  slowdmatype: z.number().int().min(0).max(8).optional().default(0).describe('Slow D MA type for STOCH'),
  fastdmatype: z.number().int().min(0).max(8).optional().default(0).describe('Fast D MA type for STOCHF'),
  matype: z.number().int().min(0).max(8).optional().default(0).describe('MA type for APO/PPO'),
  timeperiod1: z.number().int().min(1).max(200).optional().default(7).describe('First time period for ULTOSC'),
  timeperiod2: z.number().int().min(1).max(200).optional().default(14).describe('Second time period for ULTOSC'),
  timeperiod3: z.number().int().min(1).max(200).optional().default(28).describe('Third time period for ULTOSC'),
  nbdevup: z.number().min(0).max(10).optional().default(2).describe('Standard deviation multiplier for upper BBANDS'),
  nbdevdn: z.number().min(0).max(10).optional().default(2).describe('Standard deviation multiplier for lower BBANDS'),
  acceleration: z.number().min(0).max(1).optional().default(0.01).describe('Acceleration factor for SAR'),
  maximum: z.number().min(0).max(1).optional().default(0.20).describe('Maximum acceleration for SAR'),
  month: z.string().optional().describe('Month for intraday data (YYYY-MM format)'),
  datatype: z.enum(['json', 'csv']).optional().default('json').describe('Response format'),
  apikey: z.string().optional().describe('Alpha Vantage API key (optional if set in config)'),
});

export const technicalIndicatorsTool: Tool<typeof TechnicalIndicatorsParams> = {
  description: 'Comprehensive technical analysis indicators including moving averages (SMA, EMA, WMA, DEMA, TEMA), oscillators (RSI, MACD, Stochastic, Williams %R), trend indicators (ADX, Aroon), volatility measures (ATR, Bollinger Bands), volume indicators (MFI, OBV), and advanced mathematical transforms (Hilbert Transform). Provides extensive technical analysis data for market timing and trend analysis.',

  execute: async (params, context) => {
    const { log } = context;
    const parsedParams = TechnicalIndicatorsParams.parse(params);

    try {
      log.info('Executing Technical Indicators API', {
        function: parsedParams.function,
        symbol: parsedParams.symbol,
        interval: parsedParams.interval
      });

      // Get API key from config if not provided
      const apiKey = parsedParams.apikey || getConfig().ALPHA_VANTAGE_API_KEY;
      if (!apiKey) {
        throw new Error('Alpha Vantage API key is required. Please set ALPHA_VANTAGE_API_KEY in your .env file or provide it as a parameter.');
      }

      // Prepare API parameters
      const apiParams: Record<string, string> = {
        function: parsedParams.function,
        symbol: parsedParams.symbol,
        interval: parsedParams.interval,
        apikey: apiKey,
      };

      // Add function-specific parameters
      switch (parsedParams.function) {
        case 'SMA':
        case 'EMA':
        case 'WMA':
        case 'DEMA':
        case 'TEMA':
        case 'TRIMA':
        case 'KAMA':
        case 'RSI':
        case 'MOM':
        case 'ROC':
        case 'ROCR':
        case 'CCI':
        case 'CMO':
        case 'ADX':
        case 'ADXR':
        case 'DX':
        case 'MINUS_DI':
        case 'PLUS_DI':
        case 'MINUS_DM':
        case 'PLUS_DM':
        case 'ATR':
        case 'NATR':
        case 'WILLR':
          if (parsedParams.time_period) apiParams.time_period = parsedParams.time_period.toString();
          if (parsedParams.series_type) apiParams.series_type = parsedParams.series_type;
          if (parsedParams.month) apiParams.month = parsedParams.month;
          break;

        case 'MAMA':
          if (parsedParams.fastlimit !== undefined) apiParams.fastlimit = parsedParams.fastlimit.toString();
          if (parsedParams.slowlimit !== undefined) apiParams.slowlimit = parsedParams.slowlimit.toString();
          if (parsedParams.series_type) apiParams.series_type = parsedParams.series_type;
          if (parsedParams.month) apiParams.month = parsedParams.month;
          break;

        case 'VWAP':
        case 'TRANGE':
        case 'AD':
        case 'OBV':
          if (parsedParams.month) apiParams.month = parsedParams.month;
          break;

        case 'T3':
        case 'TRIX':
        case 'MIDPOINT':
        case 'HT_TRENDLINE':
        case 'HT_SINE':
        case 'HT_TRENDMODE':
        case 'HT_DCPERIOD':
        case 'HT_DCPHASE':
        case 'HT_PHASOR':
          if (parsedParams.time_period) apiParams.time_period = parsedParams.time_period.toString();
          if (parsedParams.series_type) apiParams.series_type = parsedParams.series_type;
          if (parsedParams.month) apiParams.month = parsedParams.month;
          break;

        case 'MACD':
          if (parsedParams.fastperiod) apiParams.fastperiod = parsedParams.fastperiod.toString();
          if (parsedParams.slowperiod) apiParams.slowperiod = parsedParams.slowperiod.toString();
          if (parsedParams.signalperiod) apiParams.signalperiod = parsedParams.signalperiod.toString();
          if (parsedParams.series_type) apiParams.series_type = parsedParams.series_type;
          if (parsedParams.month) apiParams.month = parsedParams.month;
          break;

        case 'MACDEXT':
          if (parsedParams.fastperiod) apiParams.fastperiod = parsedParams.fastperiod.toString();
          if (parsedParams.slowperiod) apiParams.slowperiod = parsedParams.slowperiod.toString();
          if (parsedParams.signalperiod) apiParams.signalperiod = parsedParams.signalperiod.toString();
          if (parsedParams.fastmatype) apiParams.fastmatype = parsedParams.fastmatype.toString();
          if (parsedParams.slowmatype) apiParams.slowmatype = parsedParams.slowmatype.toString();
          if (parsedParams.signalmatype) apiParams.signalmatype = parsedParams.signalmatype.toString();
          if (parsedParams.series_type) apiParams.series_type = parsedParams.series_type;
          if (parsedParams.month) apiParams.month = parsedParams.month;
          break;

        case 'STOCH':
          if (parsedParams.fastkperiod) apiParams.fastkperiod = parsedParams.fastkperiod.toString();
          if (parsedParams.slowkperiod) apiParams.slowkperiod = parsedParams.slowkperiod.toString();
          if (parsedParams.slowdperiod) apiParams.slowdperiod = parsedParams.slowdperiod.toString();
          if (parsedParams.slowkmatype) apiParams.slowkmatype = parsedParams.slowkmatype.toString();
          if (parsedParams.slowdmatype) apiParams.slowdmatype = parsedParams.slowdmatype.toString();
          if (parsedParams.month) apiParams.month = parsedParams.month;
          break;

        case 'STOCHF':
          if (parsedParams.fastkperiod) apiParams.fastkperiod = parsedParams.fastkperiod.toString();
          if (parsedParams.fastdperiod) apiParams.fastdperiod = parsedParams.fastdperiod.toString();
          if (parsedParams.fastdmatype) apiParams.fastdmatype = parsedParams.fastdmatype.toString();
          if (parsedParams.month) apiParams.month = parsedParams.month;
          break;

        case 'STOCHRSI':
          if (parsedParams.time_period) apiParams.time_period = parsedParams.time_period.toString();
          if (parsedParams.fastkperiod) apiParams.fastkperiod = parsedParams.fastkperiod.toString();
          if (parsedParams.fastdperiod) apiParams.fastdperiod = parsedParams.fastdperiod.toString();
          if (parsedParams.fastdmatype) apiParams.fastdmatype = parsedParams.fastdmatype.toString();
          if (parsedParams.series_type) apiParams.series_type = parsedParams.series_type;
          if (parsedParams.month) apiParams.month = parsedParams.month;
          break;

        case 'APO':
        case 'PPO':
          if (parsedParams.fastperiod) apiParams.fastperiod = parsedParams.fastperiod.toString();
          if (parsedParams.slowperiod) apiParams.slowperiod = parsedParams.slowperiod.toString();
          if (parsedParams.matype) apiParams.matype = parsedParams.matype.toString();
          if (parsedParams.series_type) apiParams.series_type = parsedParams.series_type;
          if (parsedParams.month) apiParams.month = parsedParams.month;
          break;

        case 'BOP':
        case 'MFI':
          if (parsedParams.time_period) apiParams.time_period = parsedParams.time_period.toString();
          if (parsedParams.month) apiParams.month = parsedParams.month;
          break;

        case 'ULTOSC':
          if (parsedParams.timeperiod1) apiParams.timeperiod1 = parsedParams.timeperiod1.toString();
          if (parsedParams.timeperiod2) apiParams.timeperiod2 = parsedParams.timeperiod2.toString();
          if (parsedParams.timeperiod3) apiParams.timeperiod3 = parsedParams.timeperiod3.toString();
          if (parsedParams.month) apiParams.month = parsedParams.month;
          break;

        case 'BBANDS':
          if (parsedParams.time_period) apiParams.time_period = parsedParams.time_period.toString();
          if (parsedParams.nbdevup) apiParams.nbdevup = parsedParams.nbdevup.toString();
          if (parsedParams.nbdevdn) apiParams.nbdevdn = parsedParams.nbdevdn.toString();
          if (parsedParams.matype) apiParams.matype = parsedParams.matype.toString();
          if (parsedParams.series_type) apiParams.series_type = parsedParams.series_type;
          if (parsedParams.month) apiParams.month = parsedParams.month;
          break;

        case 'MIDPRICE':
          if (parsedParams.time_period) apiParams.time_period = parsedParams.time_period.toString();
          if (parsedParams.month) apiParams.month = parsedParams.month;
          break;

        case 'SAR':
          if (parsedParams.acceleration) apiParams.acceleration = parsedParams.acceleration.toString();
          if (parsedParams.maximum) apiParams.maximum = parsedParams.maximum.toString();
          if (parsedParams.month) apiParams.month = parsedParams.month;
          break;

        case 'ADOSC':
          if (parsedParams.fastperiod) apiParams.fastperiod = parsedParams.fastperiod.toString();
          if (parsedParams.slowperiod) apiParams.slowperiod = parsedParams.slowperiod.toString();
          if (parsedParams.month) apiParams.month = parsedParams.month;
          break;

        case 'AROON':
        case 'AROONOSC':
          if (parsedParams.time_period) apiParams.time_period = parsedParams.time_period.toString();
          if (parsedParams.month) apiParams.month = parsedParams.month;
          break;
      }

      // Add datatype parameter
      if (parsedParams.datatype) apiParams.datatype = parsedParams.datatype;

      const data = await makeAlphaVantageRequest(parsedParams.function, apiParams, parsedParams.datatype);

      log.info('Successfully executed Technical Indicators API', {
        function: parsedParams.function,
        dataType: typeof data
      });

      return formatAlphaVantageResponse(data, parsedParams.function);

    } catch (error) {
      log.error({ err: error, params: parsedParams }, 'Error executing Technical Indicators API');
      throw new Error(
        `Failed to execute ${parsedParams.function}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  },

  name: 'technical_indicators',
  parameters: TechnicalIndicatorsParams,
};