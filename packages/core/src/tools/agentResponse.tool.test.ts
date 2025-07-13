import { Job, Queue } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';

import { Ctx, SessionData } from '../types.js';
import { agentResponseTool } from './agentResponse.tool.js';
import logger from '../../logger.js';

describe('agentResponseTool', () => {
  const mockCtx: Ctx = {
    job: { id: 'test-job-id' } as Job,
    log: logger.default,
    reportProgress: vi.fn(),
    session: {} as SessionData,
    streamContent: vi.fn(),
    taskQueue: {} as Queue,
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
