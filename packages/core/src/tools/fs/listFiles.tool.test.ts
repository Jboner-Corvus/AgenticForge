/// <reference types="vitest/globals" />
/// <reference types="vitest/globals" />
/// <reference types="vitest/globals" />
/// <reference types="vitest/globals" />
/// <reference types="vitest/globals" />
/// <reference types="vitest/globals" />
/// <reference types="vitest/globals" />
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

import { Ctx } from '../types';
import { listFilesTool } from './fs/listFiles.tool';

vi.mock('fs', () => ({
  promises: {
    readdir: vi.fn(),
  },
}));

describe('listFilesTool', () => {
  const mockCtx: Ctx = {
    job: { id: 'test-job-id' } as any,
    log: {
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    },
    reportProgress: vi.fn(),
    session: {} as any,
    streamContent: vi.fn(),
    taskQueue: {} as any,
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
    (fs.readdir as vi.Mock).mockResolvedValueOnce(mockEntries);

    const result = await listFilesTool.execute({ path: '.' }, mockCtx);
    expect(result).toContain('file1.txt');
    expect(result).toContain('folder1/');
    expect(mockCtx.log.info).toHaveBeenCalledWith(`Listed files in directory: ${mockWorkspaceDir}`);
  });

  it('should return a message for an empty directory', async () => {
    (fs.readdir as vi.Mock).mockResolvedValueOnce([]);

    const result = await listFilesTool.execute({ path: 'empty_folder' }, mockCtx);
    expect(result).toContain('Directory \'workspace/empty_folder\' is empty.');
  });

  it('should return an error if directory not found', async () => {
    (fs.readdir as vi.Mock).mockRejectedValueOnce({ code: 'ENOENT' });

    const result = await listFilesTool.execute({ path: 'nonexistent_folder' }, mockCtx);
    expect(result).toHaveProperty('erreur');
    expect(result.erreur).toContain('Directory not found');
  });

  it('should return an error for other file system errors', async () => {
    (fs.readdir as vi.Mock).mockRejectedValueOnce(new Error('Permission denied'));

    const result = await listFilesTool.execute({ path: '.' }, mockCtx);
    expect(result).toHaveProperty('erreur');
    expect(result.erreur).toContain('Permission denied');
  });
});