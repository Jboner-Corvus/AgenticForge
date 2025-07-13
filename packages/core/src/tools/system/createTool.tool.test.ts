import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createToolTool } from './system/createTool.tool';
import { Ctx } from '../types';
import { promises as fs } from 'fs';
import path from 'path

vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn(() => Promise.resolve()),
    writeFile: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('../../utils/qualityGate', () => ({
  runQualityGate: vi.fn(() => Promise.resolve({ success: true, output: 'Quality Gate Passed' })),
  runToolTestsInSandbox: vi.fn(() => Promise.resolve({ success: true, output: 'Tool Tests Passed' })),
}));

describe('createToolTool', () => {
  const mockCtx: Ctx = {
    log: {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
    },
    job: { id: 'test-job-id' } as any,
    session: {} as any,
    taskQueue: {} as any,
    reportProgress: vi.fn(),
    streamContent: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a new tool file and pass quality gates', async () => {
    const args = {
      tool_name: 'test-tool',
      description: 'A test tool',
      parameters: '{ "param1": "z.string()" }',
      execute_function: 'async (args, ctx) => { return "executed"; }',
    };

    const result = await createToolTool.execute(args, mockCtx);

    expect(fs.mkdir).toHaveBeenCalled();
    expect(fs.writeFile).toHaveBeenCalled();
    expect(result).toContain('Outil \'test-tool\' créé et validé.');
    expect(mockCtx.log.warn).toHaveBeenCalledWith('AGENT IS CREATING A NEW TOOL.', { tool: 'test-tool' });
  });

  it('should return an error if quality gate fails', async () => {
    (vi.mocked(runQualityGate) as vi.Mock).mockResolvedValueOnce({ success: false, output: 'Quality Gate Failed' });

    const args = {
      tool_name: 'fail-tool',
      description: 'A tool that fails quality gate',
      parameters: '{}',
      execute_function: 'async (args, ctx) => { return "executed"; }',
    };

    const result = await createToolTool.execute(args, mockCtx);
    expect(result).toHaveProperty('erreur');
    expect(result.erreur).toContain('Le Quality Gate a échoué');
  });

  it('should return an error if tool tests fail', async () => {
    (vi.mocked(runToolTestsInSandbox) as vi.Mock).mockResolvedValueOnce({ success: false, output: 'Tool Tests Failed' });

    const args = {
      tool_name: 'test-fail-tool',
      description: 'A tool that fails tests',
      parameters: '{}',
      execute_function: 'async (args, ctx) => { return "executed"; }',
    };

    const result = await createToolTool.execute(args, mockCtx);
    expect(result).toHaveProperty('erreur');
    expect(result.erreur).toContain('Le test du nouvel outil a échoué');
  });
});