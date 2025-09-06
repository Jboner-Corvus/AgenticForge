import { describe, it, expect, beforeEach, vi } from 'vitest';
import { pingTool } from '../ping.tool.ts';
import type { MinimalJob, SessionData } from '../../../../../types.ts';

describe('pingTool', () => {
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

  const mockContext: any = {
    job: mockJob,
    log: { 
      info: vi.fn(), 
      error: vi.fn() 
    },
    reportProgress: async () => {},
    session: mockSession,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return pong response successfully', async () => {
    const params = {};

    const result = await pingTool.execute(params, mockContext);

    expect(result).toEqual({
      success: true,
      message: 'pong',
      timestamp: expect.any(String),
      service: 'Alpha Vantage Tools for AgenticForge'
    });

    expect(mockContext.log.info).toHaveBeenCalledWith('Alpha Vantage ping tool executed');
    expect(mockContext.log.info).toHaveBeenCalledWith('Alpha Vantage ping successful', result);
  });

  it('should have correct tool properties', () => {
    expect(pingTool.name).toBe('alpha_vantage_ping');
    expect(pingTool.description).toBe('Health check tool that returns "pong" to verify the Alpha Vantage tools are working correctly');
    expect(pingTool.parameters).toBeDefined();
  });
});