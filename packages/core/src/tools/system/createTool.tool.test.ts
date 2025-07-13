/// <reference types="vitest/globals" />
import { promises as fs } from 'fs';
import path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Job, Queue } from 'bullmq';

import { Ctx, SessionData } from '../../types.js';
import { createToolTool } from './createTool.tool.js';
import { runQualityGate, runToolTestsInSandbox } from '../../utils/qualityGate.js';

vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn(() => Promise.resolve()),
    writeFile: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('../../utils/qualityGate.js', () => ({
  runQualityGate: vi.fn(() => Promise.resolve({ output: 'Quality Gate Passed', success: true })),
  runToolTestsInSandbox: vi.fn(() => Promise.resolve({ output: 'Tool Tests Passed', success: true })),
}));

import logger from '../../logger.js';

describe('createToolTool', () => {

  const mockCtx: Ctx = {
    job: { id: 'test-job-id' } as Job,
    log: logger,
    reportProgress: vi.fn(),
    session: {} as SessionData,
    streamContent: vi.fn(),
    taskQueue: {} as Queue,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a new tool file and pass quality gates', async () => {
    const args = {
      description: 'A test tool',
      execute_function: 'async (args, ctx) => { return "executed"; }',
      parameters: '{ "param1": "z.string()" }',
      tool_name: 'test-tool',
    };

    const result = await createToolTool.execute(args, mockCtx);

    expect(fs.mkdir).toHaveBeenCalled();
    expect(fs.writeFile).toHaveBeenCalled();
    expect(result).toContain('Outil \'test-tool\' créé et validé.');
    expect(mockCtx.log.warn).toHaveBeenCalledWith('AGENT IS CREATING A NEW TOOL.', { tool: 'test-tool' });
  });

  it('should return an error if quality gate fails', async () => {
    (vi.mocked(runQualityGate) as vi.Mock).mockResolvedValueOnce({ output: 'Quality Gate Failed', success: false });

    const args = {
      description: 'A tool that fails quality gate',
      execute_function: 'async (args, ctx) => { return "executed"; }',
      parameters: '{}',
      tool_name: 'fail-tool',
    };

    const result = await createToolTool.execute(args, mockCtx);
    expect(result).toHaveProperty('erreur');
    expect(result.erreur).toContain('Le Quality Gate a échoué');
  });

  it('should return an error if tool tests fail', async () => {
    (vi.mocked(runToolTestsInSandbox) as vi.Mock).mockResolvedValueOnce({ output: 'Tool Tests Failed', success: false });

    const args = {
      description: 'A tool that fails tests',
      execute_function: 'async (args, ctx) => { return "executed"; }',
      parameters: '{}',
      tool_name: 'test-fail-tool',
    };

    const result = await createToolTool.execute(args, mockCtx);
    expect(result).toHaveProperty('erreur');
    expect(result.erreur).toContain('Le test du nouvel outil a échoué');
  });
});