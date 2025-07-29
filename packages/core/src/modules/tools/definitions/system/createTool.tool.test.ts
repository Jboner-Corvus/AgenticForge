import { Queue } from 'bullmq';
import { promises as fs } from 'fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Ctx, ILlmProvider, SessionData } from '@/types.js';

import { getLogger } from '../../../../logger.js';
import { runQualityGate } from '../../../../utils/qualityGate.js';
import { createToolTool } from './createTool.tool.js';

// Mock dependencies
vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn(() => Promise.resolve()),
    writeFile: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('../../../../utils/qualityGate.js', () => ({
  runQualityGate: vi.fn(() =>
    Promise.resolve({ output: 'Quality Gate Passed', success: true }),
  ),
}));

vi.mock('../../../../logger.js', () => ({
  getLogger: vi.fn(() => ({
    child: vi.fn().mockReturnThis(),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  })),
}));

describe('createToolTool', () => {
  let mockCtx: Ctx;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCtx = {
      llm: {} as ILlmProvider,
      log: getLogger(),
      reportProgress: vi.fn(),
      session: {} as SessionData,
      streamContent: vi.fn(),
      taskQueue: {} as Queue,
    };
  });

  it('should create a new tool file and pass quality gates', async () => {
    const args = {
      description: 'A test tool',
      execute_function: 'async (args, ctx) => { return "executed"; }',
      parameters: '{ "param1": "z.string()" }',
      tool_name: 'test-tool',
    };

    const warnSpy = vi.spyOn(mockCtx.log, 'warn');

    const result = await createToolTool.execute(args, mockCtx);

    expect(warnSpy).toHaveBeenCalledWith('AGENT IS CREATING A NEW TOOL.', {
      tool: 'test-tool',
    });
    expect(fs.mkdir).toHaveBeenCalled();
    expect(fs.writeFile).toHaveBeenCalled();
    expect(runQualityGate).toHaveBeenCalled();
    expect(result).toContain("Outil 'test-tool' créé et validé.");
  });
});
