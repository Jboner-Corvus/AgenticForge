import { z } from 'zod';
import type { Tool } from '../../../../types.ts';
import {
  makeAlphaVantageRequest,
  formatAlphaVantageResponse,
  AlphaVantageBaseParams,
} from './common.ts';

const NewsSentimentParams = AlphaVantageBaseParams.extend({
  tickers: z
    .string()
    .optional()
    .describe('Stock tickers separated by commas (e.g., "AAPL,TSLA,MSFT"). If not provided, returns general market news'),
  topics: z
    .string()
    .optional()
    .describe('News topics separated by commas (e.g., "technology,earnings,ipo"). Available topics: blockchain, earnings, ipo, mergers_and_acquisitions, financial_markets, economy_fiscal, economy_monetary, economy_macro, energy_transportation, finance, life_sciences, manufacturing, real_estate, retail_wholesale, technology'),
  time_from: z
    .string()
    .optional()
    .describe('Start time for news articles in format YYYYMMDDTHHMM (e.g., "20220410T0130")'),
  time_to: z
    .string()
    .optional()
    .describe('End time for news articles in format YYYYMMDDTHHMM (e.g., "20220410T0530")'),
  sort: z
    .enum(['LATEST', 'EARLIEST', 'RELEVANCE'])
    .optional()
    .default('LATEST')
    .describe('Sort order for news articles'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(1000)
    .optional()
    .default(50)
    .describe('Maximum number of news articles to return (1-1000)'),
});

export const newsSentimentTool: Tool<typeof NewsSentimentParams> = {
  description: 'Returns live and historical market news and sentiment data with AI-powered sentiment scores',
  
  execute: async (params, context) => {
    const { log } = context;
    const parsedParams = NewsSentimentParams.parse(params);
    
    try {
      log.info('Fetching news sentiment data', { 
        tickers: parsedParams.tickers,
        topics: parsedParams.topics
      });

      const apiParams: Record<string, string> = {
        apikey: parsedParams.apikey,
        sort: parsedParams.sort,
        limit: parsedParams.limit.toString(),
      };

      // Add optional parameters
      if (parsedParams.tickers) {
        apiParams.tickers = parsedParams.tickers;
      }

      if (parsedParams.topics) {
        apiParams.topics = parsedParams.topics;
      }

      if (parsedParams.time_from) {
        apiParams.time_from = parsedParams.time_from;
      }

      if (parsedParams.time_to) {
        apiParams.time_to = parsedParams.time_to;
      }

      const data = await makeAlphaVantageRequest('NEWS_SENTIMENT', apiParams);
      
      log.info('Successfully fetched news sentiment data', { 
        articlesCount: data?.items?.length || 0,
        overallSentiment: data?.sentiment_score_definition || 'N/A'
      });

      return formatAlphaVantageResponse(data, 'NEWS_SENTIMENT');
      
    } catch (error) {
      log.error({ err: error, params: parsedParams }, 'Error fetching news sentiment data');
      throw new Error(
        `Failed to fetch news sentiment data: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  },
  
  name: 'news_sentiment',
  parameters: NewsSentimentParams,
};