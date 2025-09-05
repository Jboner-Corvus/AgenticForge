// Alpha Vantage MCP Tools for AgenticForge
// This module provides comprehensive financial data access through Alpha Vantage API

// Core Stock Data Tools
export { timeSeriesIntradayTool } from './time-series-intraday.tool.ts';
export { timeSeriesDailyTool } from './time-series-daily.tool.ts';
export { globalQuoteTool } from './global-quote.tool.ts';
export { symbolSearchTool } from './symbol-search.tool.ts';

// Fundamental Data Tools
export { companyOverviewTool } from './company-overview.tool.ts';

// News & Intelligence Tools
export { newsSentimentTool } from './news-sentiment.tool.ts';

// Technical Analysis Tools
export { smaTool } from './sma.tool.ts';
export { rsiTool } from './rsi.tool.ts';

// Foreign Exchange Tools
export { fxDailyTool } from './fx-daily.tool.ts';

// Cryptocurrency Tools
export { digitalCurrencyDailyTool } from './digital-currency-daily.tool.ts';

// Commodity Tools
export { wtiTool } from './commodity-wti.tool.ts';

// Economic Indicators Tools
export { inflationTool } from './inflation.tool.ts';

// Utility Tools
export { pingTool } from './ping.tool.ts';

// Import tools for array
import { timeSeriesIntradayTool } from './time-series-intraday.tool.ts';
import { timeSeriesDailyTool } from './time-series-daily.tool.ts';
import { globalQuoteTool } from './global-quote.tool.ts';
import { symbolSearchTool } from './symbol-search.tool.ts';
import { companyOverviewTool } from './company-overview.tool.ts';
import { newsSentimentTool } from './news-sentiment.tool.ts';
import { smaTool } from './sma.tool.ts';
import { rsiTool } from './rsi.tool.ts';
import { fxDailyTool } from './fx-daily.tool.ts';
import { digitalCurrencyDailyTool } from './digital-currency-daily.tool.ts';
import { wtiTool } from './commodity-wti.tool.ts';
import { inflationTool } from './inflation.tool.ts';
import { pingTool } from './ping.tool.ts';

// Common utilities
export * from './common.ts';

// Tool categories for organization
export const ALPHA_VANTAGE_TOOL_CATEGORIES = {
  CORE_STOCK: [
    'time_series_intraday',
    'time_series_daily', 
    'global_quote',
    'symbol_search'
  ],
  FUNDAMENTAL: [
    'company_overview'
  ],
  NEWS_INTELLIGENCE: [
    'news_sentiment'
  ],
  TECHNICAL_ANALYSIS: [
    'sma',
    'rsi'
  ],
  FOREX: [
    'fx_daily'
  ],
  CRYPTOCURRENCY: [
    'digital_currency_daily'
  ],
  COMMODITIES: [
    'wti'
  ],
  ECONOMIC_INDICATORS: [
    'inflation'
  ],
  UTILITIES: [
    'alpha_vantage_ping'
  ]
} as const;

// All tools array for convenience
export const ALL_ALPHA_VANTAGE_TOOLS = [
  timeSeriesIntradayTool,
  timeSeriesDailyTool,
  globalQuoteTool,
  symbolSearchTool,
  companyOverviewTool,
  newsSentimentTool,
  smaTool,
  rsiTool,
  fxDailyTool,
  digitalCurrencyDailyTool,
  wtiTool,
  inflationTool,
  pingTool,
] as const;