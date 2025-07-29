/// <reference types="vitest/globals" />
import { Queue } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';

import { Ctx, ILlmProvider, SessionData } from '@/types.js';

import logger from '../../../../logger.js';
import loggerMock from '../../../../test/mocks/logger.js';
import { agentResponseTool } from './agentResponse.tool.js';
vi.mock('../../../../logger.js', async () => {
  const vitest = await import('vitest');
  const loggerMock = await vitest.vi.importActual(
    '../../../../test/mocks/logger.js',
  );
  return {
    default: loggerMock.default,
  };
});

describe('agentResponseTool', () => {
  const mockCtx: Ctx = {
    llm: {} as ILlmProvider,
    log: logger,
    reportProgress: vi.fn(),
    session: {} as SessionData,
    streamContent: vi.fn(),
    taskQueue: {} as Queue,
  };

  it('should return the response string', async () => {
    const response = 'Hello, user!';
    const result = await agentResponseTool.execute({ response }, mockCtx);
    expect(result).toBe(response);
    expect(loggerMock.info).toHaveBeenCalledWith('Responding to user', {
      args: { response },
    });
  });

  it('should handle empty response string', async () => {
    const response = '';
    const result = await agentResponseTool.execute({ response }, mockCtx);
    expect(result).toBe(response);
  });
});
