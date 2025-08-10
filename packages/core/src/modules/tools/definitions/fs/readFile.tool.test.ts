import { Queue } from 'bullmq';
import { promises as fs } from 'fs';
/// <reference types="vitest/globals" />
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getLoggerInstance } from '../../../../logger.js';
import { Ctx, ILlmProvider, SessionData } from '../../../../types.js';

vi.mock('../../../../logger.js', () => ({
  getLoggerInstance: vi.fn(() => ({
    child: vi.fn().mockReturnThis(),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  })),
}));
import { readFileTool } from './readFile.tool.js';

vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    stat: vi.fn().mockResolvedValue({ size: 100 }), // Mock stat to return a fake file size
  },
}));

describe('readFileTool', () => {
  const mockCtx: Ctx = {
    llm: {} as ILlmProvider,
    log: getLoggerInstance(),
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
  });
});
