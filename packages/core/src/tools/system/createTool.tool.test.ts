import { Job, Queue } from 'bullmq';
import { promises as fs } from 'fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import logger from '../../logger.js';
import { Ctx, SessionData } from '../../types.js';
import {
  runQualityGate,
  runToolTestsInSandbox,
} from '../../utils/qualityGate.js';
import { createToolTool } from './createTool.tool.js';

// Mock dependencies
vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn(() => Promise.resolve()),
    writeFile: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('../../utils/qualityGate.js', () => ({
  runQualityGate: vi.fn(),
  runToolTestsInSandbox: vi.fn(),
}));

vi.mock('../../logger.js', () => ({
  default: {
    child: vi.fn().mockReturnThis(),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('createToolTool', () => {
  let mockCtx: Ctx;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCtx = {
      log: logger,
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

    // Mock successful quality gate and test runs
    vi.mocked(runQualityGate).mockResolvedValue({
      output: 'Quality Gate Passed',
      success: true,
    });
    vi.mocked(runToolTestsInSandbox).mockResolvedValue({
      output: 'Tool Tests Passed',
      success: true,
    });

    const result = await createToolTool.execute(args, mockCtx);

    expect(mockCtx.log.warn).toHaveBeenCalledWith(
      'AGENT IS CREATING A NEW TOOL.',
      { tool: 'test-tool' },
    );
    expect(fs.mkdir).toHaveBeenCalled();
    expect(fs.writeFile).toHaveBeenCalled();
    expect(runQualityGate).toHaveBeenCalled();
    expect(runToolTestsInSandbox).toHaveBeenCalled();
    expect(result).toContain("Outil 'test-tool' créé et validé.");
  });

  it('should return an error message if quality gate fails', async () => {
    const args = {
      description: 'A tool that fails quality gate',
      execute_function: 'async (args, ctx) => { return "executed"; }',
      parameters: '{}',
      tool_name: 'fail-tool',
    };

    vi.mocked(runQualityGate).mockResolvedValue({
      output: 'Quality Gate Failed',
      success: false,
    });

    const result = await createToolTool.execute(args, mockCtx);

    expect(result).toEqual({
      erreur: 'Le Quality Gate a échoué: Quality Gate Failed',
    });
  });

  it('should return an error message if tool tests fail', async () => {
    const args = {
      description: 'A tool that fails tests',
      execute_function: 'async (args, ctx) => { return "executed"; }',
      parameters: '{}',
      tool_name: 'test-fail-tool',
    };

    vi.mocked(runQualityGate).mockResolvedValue({
      output: 'Quality Gate Passed',
      success: true,
    });
    vi.mocked(runToolTestsInSandbox).mockResolvedValue({
      output: 'Tool Tests Failed',
      success: false,
    });

    const result = await createToolTool.execute(args, mockCtx);

    expect(result).toEqual({
      erreur: 'Le test du nouvel outil a échoué: Tool Tests Failed',
    });
  });

  it('should return an error message if file system operations fail', async () => {
    const args = {
      description: 'A tool that fails file system operations',
      execute_function: 'async (args, ctx) => { return "executed"; }',
      parameters: '{}',
      tool_name: 'fs-fail-tool',
    };
    const errorMessage = 'Disk is full';
    vi.mocked(fs.writeFile).mockRejectedValue(new Error(errorMessage));

    const result = await createToolTool.execute(args, mockCtx);

    expect(result).toEqual({
      erreur: `Échec de la création de l'outil: ${errorMessage}`,
    });
  });
});
