import { Job, Queue } from 'bullmq';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { Ctx, ILlmProvider, SessionData } from '@/types.js';

import { getLogger } from '../../../../logger.js';
import { finishTool, FinishToolSignal } from './finish.tool.js';

describe('finishTool', () => {
  let mockCtx: Ctx;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCtx = {
      job: { id: 'test-job-id' } as Job,
      llm: {} as ILlmProvider,
      log: getLogger(),
      reportProgress: vi.fn(),
      session: {} as SessionData,
      streamContent: vi.fn(),
      taskQueue: {} as Queue,
    };
    vi.spyOn(getLogger(), 'info');
    vi.spyOn(getLogger(), 'error');
  });

  it('should throw a FinishToolSignal with the final response when called with an object', async () => {
    const response = 'Goal achieved!';
    await expect(finishTool.execute({ response }, mockCtx)).rejects.toThrow(
      new FinishToolSignal(response),
    );
    expect(mockCtx.log.info as Mock).toHaveBeenCalledWith(
      `Goal accomplished: ${response}`,
    );
  });

  it('should throw a FinishToolSignal with the final response when called with a string', async () => {
    const response = 'Direct goal achieved!';
    await expect(finishTool.execute(response, mockCtx)).rejects.toThrow(
      new FinishToolSignal(response),
    );
    expect(mockCtx.log.info as Mock).toHaveBeenCalledWith(
      `Goal accomplished: ${response}`,
    );
  });

  it('should return an error message if args are invalid', async () => {
    // Using `any` here is intentional to test the runtime handling of invalid arguments,
    // which is not possible with strict static types.

    const invalidArgs = null as unknown as { response: string };
    await expect(finishTool.execute(invalidArgs, mockCtx)).rejects.toThrow(
      'An unexpected error occurred in finishTool: Invalid arguments provided to finishTool. A final answer is required.',
    );

    // Verify that the error was logged
    expect(mockCtx.log.error as Mock).toHaveBeenCalled();
  });
});
