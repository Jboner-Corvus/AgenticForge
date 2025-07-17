/// <reference types="vitest/globals" />
import { Queue } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';

import logger from '../../logger.js';
import { Ctx, ILlmProvider, SessionData } from '../types.js';
import { agentResponseTool } from './system/agentResponse.tool.js';

vi.mock('../../logger.js', () => ({
  default: {
    child: vi.fn().mockReturnThis(),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

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
    expect(mockCtx.log.info).toHaveBeenCalledWith('Responding to user', {
      args: { response },
    });
  });

  it('should handle empty response string', async () => {
    const response = '';
    const result = await agentResponseTool.execute({ response }, mockCtx);
    expect(result).toBe(response);
  });
});
