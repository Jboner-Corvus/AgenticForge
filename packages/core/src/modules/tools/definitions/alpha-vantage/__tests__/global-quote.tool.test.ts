import { globalQuoteTool } from '../global-quote.tool.ts';
import { getLoggerInstance } from '../../../../../logger.ts';
import type { MinimalJob, SessionData } from '../../../../../types.ts';

describe('Global Quote Tool', () => {
  const mockJob: MinimalJob = {
    data: {
      prompt: 'test prompt'
    },
    id: 'test-job',
    isFailed: async () => false,
    name: 'test-job-name'
  };

  const mockSession: SessionData = {
    history: [],
    identities: [],
    name: 'test-session',
    timestamp: Date.now()
  };

  const mockContext = {
    log: getLoggerInstance().child({ test: 'global-quote' }),
    job: mockJob,
    llm: null as any,
    reportProgress: async () => {},
    session: mockSession,
    streamContent: async () => {},
    taskQueue: null as any,
  };

  it('should fetch global quote data for TSLA', async () => {
    const params = {
      symbol: 'TSLA',
    };

    const result = await globalQuoteTool.execute(params, mockContext);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.function).toBe('GLOBAL_QUOTE');
    expect(result.data).toBeDefined();
    console.log('API Response:', JSON.stringify(result, null, 2));
    // The API response structure may vary, just check that we got some data
    expect(Object.keys(result.data).length).toBeGreaterThan(0);
  }, 30000); // 30 second timeout for API call

  it('should work with config API key', async () => {
    const params = {
      symbol: 'AAPL', // Test with another valid symbol
    };

    const result = await globalQuoteTool.execute(params, mockContext);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.function).toBe('GLOBAL_QUOTE');
    expect(result.data).toBeDefined();
    // Just verify we got some data back
    expect(Object.keys(result.data).length).toBeGreaterThan(0);
  }, 30000);
});