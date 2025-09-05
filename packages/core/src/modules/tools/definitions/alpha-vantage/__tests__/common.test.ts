import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { makeAlphaVantageRequest, formatAlphaVantageResponse } from '../common.ts';

// Mock fetch globally
global.fetch = vi.fn();

describe('Alpha Vantage Common Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('makeAlphaVantageRequest', () => {
    it('should make successful API request with JSON response', async () => {
      const mockResponse = {
        'Global Quote': {
          '01. symbol': 'AAPL',
          '05. price': '150.00'
        }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await makeAlphaVantageRequest('GLOBAL_QUOTE', {
        symbol: 'AAPL',
        apikey: 'test-key'
      });

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=test-key')
      );
    });

    it('should make successful API request with CSV response', async () => {
      const mockCsvResponse = 'timestamp,open,high,low,close,volume\n2024-01-01,150.00,152.00,149.00,151.00,1000000';

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockCsvResponse)
      });

      const result = await makeAlphaVantageRequest('TIME_SERIES_DAILY', {
        symbol: 'AAPL',
        apikey: 'test-key',
        datatype: 'csv'
      }, 'csv');

      expect(result).toBe(mockCsvResponse);
    });

    it('should handle API error messages', async () => {
      const errorResponse = {
        'Error Message': 'Invalid API call'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(errorResponse)
      });

      await expect(makeAlphaVantageRequest('INVALID_FUNCTION', {
        apikey: 'test-key'
      })).rejects.toThrow('Alpha Vantage API Error: Invalid API call');
    });

    it('should handle rate limit messages', async () => {
      const rateLimitResponse = {
        'Note': 'Thank you for using Alpha Vantage! Our standard API call frequency is 25 requests per minute'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rateLimitResponse)
      });

      await expect(makeAlphaVantageRequest('GLOBAL_QUOTE', {
        symbol: 'AAPL',
        apikey: 'test-key'
      })).rejects.toThrow('Alpha Vantage Rate Limit');
    });

    it('should handle HTTP errors', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      await expect(makeAlphaVantageRequest('GLOBAL_QUOTE', {
        symbol: 'AAPL',
        apikey: 'test-key'
      })).rejects.toThrow('HTTP error! status: 404');
    });

    it('should handle network errors', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(makeAlphaVantageRequest('GLOBAL_QUOTE', {
        symbol: 'AAPL',
        apikey: 'test-key'
      })).rejects.toThrow('Failed to fetch data from Alpha Vantage: Network error');
    });
  });

  describe('formatAlphaVantageResponse', () => {
    it('should format response correctly', () => {
      const mockData = { 'Global Quote': { '01. symbol': 'AAPL' } };
      const functionName = 'GLOBAL_QUOTE';

      const result = formatAlphaVantageResponse(mockData, functionName);

      expect(result).toEqual({
        success: true,
        function: functionName,
        data: mockData,
        timestamp: expect.any(String)
      });

      // Verify timestamp is a valid ISO string
      expect(() => new Date(result.timestamp)).not.toThrow();
    });
  });
});