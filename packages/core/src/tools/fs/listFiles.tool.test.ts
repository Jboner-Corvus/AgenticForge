import { Job, Queue } from 'bullmq';
/// <reference types="vitest/globals" />
import { promises as fs } from 'fs';
import path from 'path';
import { describe, expect, it, Mock, vi } from 'vitest';

import logger from '../../logger.js';
import { Ctx, SessionData } from '../../types.js';
import { listFilesTool } from './listFiles.tool.js';

vi.mock('fs', () => ({
  promises: {
    readdir: vi.fn(),
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

describe('listFilesTool', () => {
  const mockCtx: Ctx = {
    job: { id: 'test-job-id' } as Job,
    log: logger,
    reportProgress: vi.fn(),
    session: {} as SessionData,
    streamContent: vi.fn(),
    taskQueue: {} as Queue,
  };

  const mockWorkspaceDir = path.resolve(process.cwd(), 'workspace');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list files and directories in the specified path', async () => {
    const mockEntries = [
      { isDirectory: () => false, name: 'file1.txt' },
      { isDirectory: () => true, name: 'folder1' },
    ];
    (fs.readdir as Mock).mockResolvedValueOnce(mockEntries);

    const result = await listFilesTool.execute({ path: '.' }, mockCtx);
    expect(result).toContain('file1.txt');
    expect(result).toContain('folder1/');
    expect(mockCtx.log.info).toHaveBeenCalledWith(
      `Listed files in directory: ${mockWorkspaceDir}`,
    );
  });

  it('should return a message for an empty directory', async () => {
    (fs.readdir as Mock).mockResolvedValueOnce([]);

    const result = await listFilesTool.execute(
      { path: 'empty_folder' },
      mockCtx,
    );
    expect(result).toContain("Directory 'workspace/empty_folder' is empty.");
  });

  it('should return an error if directory not found', async () => {
    (fs.readdir as Mock).mockRejectedValueOnce({ code: 'ENOENT' });

    const result = await listFilesTool.execute(
      { path: 'nonexistent_folder' },
      mockCtx,
    );
    expect(result).toHaveProperty('erreur');
    expect(
      typeof result === 'object' && result !== null && 'erreur' in result
        ? result.erreur
        : result,
    ).toContain('Directory not found');
  });

  it('should return an error for other file system errors', async () => {
    (fs.readdir as Mock).mockRejectedValueOnce(new Error('Permission denied'));

    const result = await listFilesTool.execute({ path: '.' }, mockCtx);
    expect(typeof result).toBe('object');
    if (typeof result === 'object' && result !== null && 'erreur' in result) {
      expect(result.erreur).toContain('Permission denied');
    } else {
      throw new Error('Expected an object with an erreur property.');
    }
  });
});
