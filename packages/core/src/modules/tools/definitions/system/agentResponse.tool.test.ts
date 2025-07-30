/// <reference types="vitest/globals" />
import { Queue } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';

import { Ctx, ILlmProvider, SessionData } from '@/types.js';

const loggerMock = {
  child: vi.fn(() => ({
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  })),
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
};

vi.mock('../../../../logger.js', () => ({
  getLogger: vi.fn(() => loggerMock),
}));

import { agentResponse as agentResponseTool } from './agentResponse.tool.js';

describe('agentResponseTool', () => {
  const mockCtx: Ctx = {
    llm: {} as ILlmProvider,
    log: mockGetLogger(),
    reportProgress: vi.fn(),
    session: {} as SessionData,
    streamContent: vi.fn(),
    taskQueue: {} as Queue,
  };

  it('should return the response string', async () => {
    const response = 'Hello, user!';
    const result = await agentResponseTool.execute({ response }, mockCtx);
    expect(result).toBe(response);
    expect(mockGetLogger().info).toHaveBeenCalledWith('Responding to user', {
      args: { response },
    });
  });

  it('should handle empty response string', async () => {
    const response = '';
    const result = await agentResponseTool.execute({ response }, mockCtx);
    expect(result).toBe(response);
  });
});
