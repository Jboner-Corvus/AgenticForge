import { z } from 'zod';

// Base API configuration
export const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

// Common parameter schemas
export const AlphaVantageBaseParams = z.object({
  apikey: z.string().optional().describe('Alpha Vantage API key (optional if set in config)'),
});

export const SymbolParam = z.object({
  symbol: z.string().min(1).max(10).describe('Stock symbol (e.g., IBM, AAPL)'),
});

export const IntervalParam = z.object({
  interval: z.enum(['1min', '5min', '15min', '30min', '60min']).describe('Time interval for data points'),
});

export const OutputSizeParam = z.object({
  outputsize: z.enum(['compact', 'full']).optional().default('compact').describe('Data size: compact (100 points) or full (all available)'),
});

export const DataTypeParam = z.object({
  datatype: z.enum(['json', 'csv']).optional().default('json').describe('Response format'),
});

// Utility function to make API requests
export async function makeAlphaVantageRequest(
  functionName: string,
  params: Record<string, any>,
  datatype: string = 'json'
): Promise<any> {
  const url = new URL(ALPHA_VANTAGE_BASE_URL);
  
  // Add function parameter
  url.searchParams.set('function', functionName);
  
  // Add all other parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  try {
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (datatype === 'json') {
      const data = await response.json();
      
      // Check for API errors
      if (data['Error Message']) {
        throw new Error(`Alpha Vantage API Error: ${data['Error Message']}`);
      }
      
      if (data['Note']) {
        throw new Error(`Alpha Vantage Rate Limit: ${data['Note']}`);
      }
      
      return data;
    } else {
      return await response.text();
    }
  } catch (error) {
    throw new Error(`Failed to fetch data from Alpha Vantage: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Helper function to validate and format response
export function formatAlphaVantageResponse(data: any, functionName: string) {
  return {
    success: true,
    function: functionName,
    data: data,
    timestamp: new Date().toISOString()
  };
}