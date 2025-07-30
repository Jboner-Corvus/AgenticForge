/// <reference types="vitest/globals" />
import { Queue } from 'bullmq';
import { promises as fs } from 'fs';
import { describe, expect, it, Mock, vi } from 'vitest';

import { Ctx, ILlmProvider, SessionData } from '@/types.js';

import { getLoggerInstance } from '../../../../logger.js';
import { listFilesTool } from './listDirectory.tool.js';

vi.mock('fs', () => ({
  promises: {
    readdir: vi.fn(),
  },
}));

vi.mock('../../../../logger.js', () => ({
  getLoggerInstance: vi.fn(() => ({
    child: vi.fn().mockReturnThis(),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  })),
}));

describe('listFilesTool', () => {
  const mockCtx: Ctx = {
    llm: {} as ILlmProvider,
    log: getLoggerInstance(),
    reportProgress: vi.fn(),
    session: {} as SessionData,
    streamContent: vi.fn(),
    taskQueue: {} as Queue,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list files in a directory', async () => {
    (fs.readdir as Mock).mockResolvedValue([
      { isDirectory: () => false, name: 'file1.txt' },
      { isDirectory: () => true, name: 'dir1' },
    ]);

    const result = await listFilesTool.execute({ path: '.' }, mockCtx);
    expect(result).toContain('file1.txt');
    expect(result).toContain('dir1/');
  });
});
