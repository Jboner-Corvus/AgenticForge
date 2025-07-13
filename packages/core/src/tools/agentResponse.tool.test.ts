import { describe, it, expect, vi } from 'vitest';
import { agentResponseTool } from './agentResponse.tool';
import { Ctx } from '../types';

describe('agentResponseTool', () => {
  const mockCtx: Ctx = {
    log: {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
    },
    job: { id: 'test-job-id' } as any,
    session: {} as any,
    taskQueue: {} as any,
    reportProgress: vi.fn(),
    streamContent: vi.fn(),
  };

  it('should return the response string', async () => {
    const response = 'Hello, user!';
    const result = await agentResponseTool.execute({ response }, mockCtx);
    expect(result).toBe(response);
    expect(mockCtx.log.info).toHaveBeenCalledWith('Responding to user', { args: { response } });
  });

  it('should handle empty response string', async () => {
    const response = '';
    const result = await agentResponseTool.execute({ response }, mockCtx);
    expect(result).toBe(response);
  });
});
