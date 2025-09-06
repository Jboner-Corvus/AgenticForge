// Alpha Vantage MCP Tools for AgenticForge
// This module provides comprehensive financial data access through Alpha Vantage API

// Organized Tool Categories (6 main tools)
export { coreStockApisTool } from './core_stock_apis.tool.ts';
export { alphaIntelligenceTool } from './alpha_intelligence.tool.ts';
export { economicIndicatorsTool } from './economic_indicators.tool.ts';
export { forexTool } from './forex.tool.ts';
export { technicalIndicatorsTool } from './technical_indicators.tool.ts';

// Legacy individual tools (still available for backward compatibility)
export { timeSeriesIntradayTool } from './time-series-intraday.tool.ts';
export { timeSeriesDailyTool } from './time-series-daily.tool.ts';
export { globalQuoteTool } from './global-quote.tool.ts';
export { symbolSearchTool } from './symbol-search.tool.ts';
export { companyOverviewTool } from './company-overview.tool.ts';
export { newsSentimentTool } from './news-sentiment.tool.ts';
export { smaTool } from './sma.tool.ts';
export { rsiTool } from './rsi.tool.ts';
export { indicatorTool } from './indicator.tool.ts';
export { fxDailyTool } from './fx-daily.tool.ts';
export { digitalCurrencyDailyTool } from './digital-currency-daily.tool.ts';
export { wtiTool } from './commodity-wti.tool.ts';
export { inflationTool } from './inflation.tool.ts';
export { pingTool } from './ping.tool.ts';

// Import organized tools
import { coreStockApisTool } from './core_stock_apis.tool.ts';
import { alphaIntelligenceTool } from './alpha_intelligence.tool.ts';
import { economicIndicatorsTool } from './economic_indicators.tool.ts';
import { forexTool } from './forex.tool.ts';
import { technicalIndicatorsTool } from './technical_indicators.tool.ts';

// Import legacy tools for backward compatibility
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

// Tool categories for organization (organized into 6 main categories)
export const ALPHA_VANTAGE_TOOL_CATEGORIES = {
  CORE_STOCK_APIS: [
    'core_stock_apis'
  ],
  ALPHA_INTELLIGENCE: [
    'alpha_intelligence'
  ],
  ECONOMIC_INDICATORS: [
    'economic_indicators'
  ],
  FOREX: [
    'forex'
  ],
  TECHNICAL_INDICATORS: [
    'technical_indicators'
  ]
} as const;

// All tools array for convenience (organized 6 main tools)
export const ALL_ALPHA_VANTAGE_TOOLS = [
  coreStockApisTool,
  alphaIntelligenceTool,
  economicIndicatorsTool,
  forexTool,
  technicalIndicatorsTool,
] as const;

// Legacy tools array for backward compatibility
export const ALL_ALPHA_VANTAGE_LEGACY_TOOLS = [
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