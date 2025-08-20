import { Queue } from 'bullmq';
import { promises as fs } from 'fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getLoggerInstance } from '../../../../logger.ts';
import { Ctx, ILlmProvider, SessionData } from '../../../../types.ts';
import { runQualityGate } from '../../../../utils/qualityGate';
import { createToolTool } from './createTool.tool';

vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn(() => Promise.resolve()),
    writeFile: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('../../../../utils/qualityGate', () => ({
  runQualityGate: vi.fn(() => Promise.resolve({ output: '', success: true })),
}));

// Define the mock for getLoggerInstance outside vi.mock to ensure consistency
const mockLoggerInstance = {
  child: vi.fn().mockReturnThis(),
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
};

vi.mock('../../../../logger.ts', () => ({
  getLoggerInstance: vi.fn(() => mockLoggerInstance),
}));

describe('createToolTool', () => {
  let mockCtx: Ctx;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCtx = {
      llm: {} as ILlmProvider,
      log: getLoggerInstance(),
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

    const warnSpy = vi.spyOn(mockLoggerInstance, 'warn');

    const result = await createToolTool.execute(args, mockCtx);

    expect(warnSpy).toHaveBeenCalledWith('AGENT IS CREATING A NEW TOOL.', {
      tool: 'test-tool',
    });
    expect(fs.mkdir).toHaveBeenCalled();
    expect(fs.writeFile).toHaveBeenCalled();
    expect(result).toContain("Outil 'test-tool' généré avec schémas Zod");
  });
});
