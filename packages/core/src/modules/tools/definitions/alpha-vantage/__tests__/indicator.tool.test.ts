import { describe, it, expect, vi } from 'vitest';
import { indicatorTool } from '../indicator.tool.ts';
import { makeAlphaVantageRequest } from '../common.ts';

// Mock the makeAlphaVantageRequest function
vi.mock('../common.ts', () => ({
  makeAlphaVantageRequest: vi.fn(),
  formatAlphaVantageResponse: vi.fn((data) => data),
  AlphaVantageBaseParams: {
    merge: vi.fn().mockReturnValue({
      merge: vi.fn().mockReturnValue({
        merge: vi.fn().mockReturnValue({
          extend: vi.fn().mockReturnValue({
            parse: vi.fn((params) => params),
          }),
        }),
      }),
    }),
  },
  SymbolParam: {
    merge: vi.fn().mockReturnThis(),
  },
  IntervalParam: {
    merge: vi.fn().mockReturnThis(),
  },
  DataTypeParam: {
    merge: vi.fn().mockReturnThis(),
  },
  getConfig: vi.fn().mockReturnValue({ ALPHA_VANTAGE_API_KEY: 'test-key' }),
}));

describe('indicatorTool', () => {
  it('should have the correct name', () => {
    expect(indicatorTool.name).toBe('indicator');
  });

  it('should have a description', () => {
    expect(indicatorTool.description).toBeDefined();
    expect(typeof indicatorTool.description).toBe('string');
  });

  it('should have parameters schema', () => {
    expect(indicatorTool.parameters).toBeDefined();
  });

  it('should execute without errors when valid parameters are provided', async () => {
    // Mock the API response
    const mockResponse = {
      'Technical Analysis: RSI': {
        '2023-01-01': { RSI: '70.50' },
      },
    };

    vi.mocked(makeAlphaVantageRequest).mockResolvedValue(mockResponse);

    const params = {
      symbol: 'AAPL',
      interval: '1min' as const,
      indicator_type: 'rsi' as const,
      time_period: 14,
      datatype: 'json' as const,
      series_type: 'close' as const,
    };

    const context = {
      log: {
        info: vi.fn(),
        error: vi.fn(),
      },
    } as any;

    const result = await indicatorTool.execute(params, context);
    expect(result).toEqual(mockResponse);
  });
});
