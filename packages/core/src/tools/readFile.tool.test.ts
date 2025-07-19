/// <reference types="vitest/globals" />
import { Queue } from 'bullmq';
import { promises as fs } from 'fs';
import { describe, expect, it, Mock, vi } from 'vitest';

import logger from '../../logger.js';
import { Ctx, ILlmProvider, SessionData } from '../../src/types.js';
import { readFileTool } from './fs/readFile.tool.js';

vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
  },
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

describe('readFileTool', () => {
  const mockCtx: Ctx = {
    llm: {} as ILlmProvider,
    log: logger,
    reportProgress: vi.fn(),
    session: {} as SessionData,
    streamContent: vi.fn(),
    taskQueue: {} as Queue,
  };

  const mockFilePath = 'test-file.txt';
  const mockFileContent = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5';

  beforeEach(() => {
    vi.clearAllMocks();
    (fs.readFile as Mock).mockResolvedValue(mockFileContent);
  });

  it('should read the entire content of a file', async () => {
    const result = await readFileTool.execute({ path: mockFilePath }, mockCtx);
    expect(result).toBe(mockFileContent);
    expect(mockCtx.log.info).toHaveBeenCalledWith(
      `Successfully read file: ${mockFilePath}`,
    );
  });

  it('should read a specific range of lines', async () => {
    const result = await readFileTool.execute(
      { end_line: 4, path: mockFilePath, start_line: 2 },
      mockCtx,
    );
    expect(result).toBe(
      `Line 2
Line 3
Line 4`,
    );
  });

  it('should read a single line if only start_line is provided', async () => {
    const result = await readFileTool.execute(
      { path: mockFilePath, start_line: 3 },
      mockCtx,
    );
    expect(result).toBe(`Line 3`);
  });

  it('should return an error if file not found', async () => {
    (fs.readFile as Mock).mockRejectedValueOnce({ code: 'ENOENT' });

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
    (fs.readFile as Mock).mockRejectedValueOnce(new Error('Permission denied'));

    const result = await readFileTool.execute({ path: mockFilePath }, mockCtx);
    if (typeof result === 'object' && result && 'erreur' in result) {
      expect(result.erreur).toContain('Permission denied');
    } else {
      expect.fail('Expected an error object');
    }
  });
});
