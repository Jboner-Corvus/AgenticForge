/// <reference types="vitest/globals" />
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../config.js', async () => {
  return {
    config: {
      WORKSPACE_PATH: '/mock-workspace',
    },
  };
});

vi.mock('fs', async () => {
  const vitest = await import('vitest');
  return {
    promises: {
      readFile: vitest.vi.fn(),
    },
  };
});

import loggerMock from '../../../../test/mocks/logger.js';
vi.mock('../../../../logger.js', () => ({
  getLogger: loggerMock,
}));

import { Queue } from 'bullmq';
import { promises as fs } from 'fs';

import { Ctx, ILlmProvider, SessionData } from '@/types.js';

import { getLogger } from '../../../../logger.js';
import { readFileTool } from './readFile.tool.js';

describe('readFileTool', () => {
  const mockCtx: Ctx = {
    llm: {} as ILlmProvider,
    log: getLogger(),
    reportProgress: vi.fn(),
    session: {} as SessionData,
    streamContent: vi.fn(),
    taskQueue: {} as Queue,
  };

  const mockFilePath = 'test-file.txt';
  const mockFileContent = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.readFile).mockResolvedValue(mockFileContent);
  });

  it('should read the entire content of a file', async () => {
    const result = await readFileTool.execute({ path: mockFilePath }, mockCtx);
    expect(result).toBe(mockFileContent);
    expect(loggerMock.info).toHaveBeenCalledWith(
      `Successfully read file: ${mockFilePath}`,
    );
  });

  it('should read a specific range of lines', async () => {
    const result = await readFileTool.execute(
      { end_line: 4, path: mockFilePath, start_line: 2 },
      mockCtx,
    );
    expect(result).toBe(`Line 2\nLine 3\nLine 4`);
  });

  it('should read a single line if only start_line is provided', async () => {
    const result = await readFileTool.execute(
      { path: mockFilePath, start_line: 3 },
      mockCtx,
    );
    expect(result).toBe(`Line 3`);
  });

  it('should return an error if file not found', async () => {
    vi.mocked(fs.readFile).mockRejectedValueOnce({ code: 'ENOENT' });

    const result = await readFileTool.execute(
      { path: 'nonexistent.txt' },
      mockCtx,
    );
    if (typeof result === 'object' && result && 'erreur' in result) {
      expect(result.erreur).toContain('File not found');
    } else {
      expect.fail('Expected an error object');
    }
  });

  it('should return an error for other file system errors', async () => {
    vi.mocked(fs.readFile).mockRejectedValueOnce(
      new Error('Permission denied'),
    );

    const result = await readFileTool.execute({ path: mockFilePath }, mockCtx);
    if (typeof result === 'object' && result && 'erreur' in result) {
      expect(result.erreur).toContain('Permission denied');
    } else {
      expect.fail('Expected an error object');
    }
  });
});
