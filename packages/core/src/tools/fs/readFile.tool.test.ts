/// <reference types="vitest/globals" />
/// <reference types="vitest/globals" />
/// <reference types="vitest/globals" />
/// <reference types="vitest/globals" />
/// <reference types="vitest/globals" />
/// <reference types="vitest/globals" />
/// <reference types="vitest/globals" />
/// <reference types="vitest/globals" />
/// <reference types="vitest/globals" />
import { promises as fs } from 'fs';
import path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Job, Queue } from 'bullmq';
import { pino } from 'pino';

import { Ctx, SessionData } from '../../types.js';
import { readFileTool } from './readFile.tool.js';

vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
  },
}));

const mockLogger = pino({ enabled: false });

describe('readFileTool', () => {
  const mockCtx: Ctx = {
    job: { id: 'test-job-id' } as Job,
    log: {
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      fatal: vi.fn(),
      trace: vi.fn(),
      silent: vi.fn(),
      level: 'info',
    } as unknown as typeof mockLogger,
    reportProgress: vi.fn(),
    session: {} as SessionData,
    streamContent: vi.fn(),
    taskQueue: {} as Queue,
  };

  const mockFilePath = 'test-file.txt';
  const mockFileContent = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5';

  beforeEach(() => {
    vi.clearAllMocks();
    (fs.readFile as vi.MockedFunction<typeof fs.readFile>).mockResolvedValue(mockFileContent);
  });

  it('should read the entire content of a file', async () => {
    const result = await readFileTool.execute({ path: mockFilePath }, mockCtx);
    expect(result).toBe(`Content of ${mockFilePath}:\n\n${mockFileContent}`);
    expect(mockCtx.log.info).toHaveBeenCalledWith(`Successfully read file: ${mockFilePath}`);
  });

  it('should read a specific range of lines', async () => {
    const result = await readFileTool.execute({ end_line: 4, path: mockFilePath, start_line: 2 }, mockCtx);
    expect(result).toBe(`Content of ${mockFilePath} (lines 2-4):\n\nLine 2\nLine 3\nLine 4`);
  });

  it('should read a single line if only start_line is provided', async () => {
    const result = await readFileTool.execute({ path: mockFilePath, start_line: 3 }, mockCtx);
    expect(result).toBe(`Content of ${mockFilePath} (lines 3-4):\n\nLine 3`);
  });

  it('should return an error if file not found', async () => {
    (fs.readFile as vi.MockedFunction<typeof fs.readFile>).mockRejectedValueOnce({ code: 'ENOENT' });

    const result = await readFileTool.execute({ path: 'nonexistent.txt' }, mockCtx);
    if (typeof result === 'object' && result && 'erreur' in result) {
      expect(result.erreur).toContain('File not found');
    } else {
      expect.fail('Expected an error object');
    }
  });

  it('should return an error for other file system errors', async () => {
    (fs.readFile as vi.MockedFunction<typeof fs.readFile>).mockRejectedValueOnce(new Error('Permission denied'));

    const result = await readFileTool.execute({ path: mockFilePath }, mockCtx);
    if (typeof result === 'object' && result && 'erreur' in result) {
      expect(result.erreur).toContain('Permission denied');
    } else {
      expect.fail('Expected an error object');
    }
  });
});
