import { Job, Queue } from 'bullmq';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import logger from '../../logger.js';
import { Ctx, SessionData } from '../../types.js';
import { finishTool } from './finish.tool.js';

// Mock the logger
vi.mock('../../logger.js', () => ({
  default: {
    child: vi.fn().mockReturnThis(),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('finishTool', () => {
  let mockCtx: Ctx;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCtx = {
      job: { id: 'test-job-id' } as Job,
      log: logger,
      reportProgress: vi.fn(),
      session: {} as SessionData,
      streamContent: vi.fn(),
      taskQueue: {} as Queue,
    };
  });

  it('should return the final response string when called with an object', async () => {
    const response = 'Goal achieved!';
    const result = await finishTool.execute({ response }, mockCtx);
    expect(result).toBe(response);
    expect(mockCtx.log.info).toHaveBeenCalledWith(
      `Goal accomplished: ${response}`,
    );
  });

  it('should return the final response string when called with a string', async () => {
    const response = 'Direct goal achieved!';
    const result = await finishTool.execute(response, mockCtx);
    expect(result).toBe(response);
    expect(mockCtx.log.info).toHaveBeenCalledWith(
      `Goal accomplished: ${response}`,
    );
  });

  it('should return an error message if args are invalid', async () => {
    // Using `any` here is intentional to test the runtime handling of invalid arguments,
    // which is not possible with strict static types.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invalidArgs = null as any;
    await expect(finishTool.execute(invalidArgs, mockCtx)).rejects.toThrow(
      'An unexpected error occurred in finishTool: Invalid arguments provided to finishTool. A final answer is required.',
    );

    // Verify that the error was logged
    expect(mockCtx.log.error).toHaveBeenCalled();
  });
});
