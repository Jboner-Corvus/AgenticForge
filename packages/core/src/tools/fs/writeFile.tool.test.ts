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

import { Ctx } from '../types.js';
import { writeFileTool } from './writeFile.tool.js';

vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn(() => Promise.resolve()),
    readFile: vi.fn(() => Promise.resolve('existing content')),
    stat: vi.fn(() => Promise.resolve({ isFile: () => true })),
    writeFile: vi.fn(() => Promise.resolve()),
  },
}));

describe('writeFileTool', () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should write content to a new file', async () => {
    (fs.stat as vi.Mock).mockImplementationOnce(() => Promise.reject({ code: 'ENOENT' })); // File does not exist
    const filePath = 'newfile.txt';
    const content = 'Hello, new file!';
    const result = await writeFileTool.execute({ content, path: filePath }, mockCtx);
    expect(fs.mkdir).toHaveBeenCalledWith(path.dirname(path.resolve(filePath)), { recursive: true });
    expect(fs.writeFile).toHaveBeenCalledWith(path.resolve(filePath), content, 'utf-8');
    expect(result).toBe(`Successfully wrote content to ${filePath}.`);
  });

  it('should overwrite content in an existing file', async () => {
    (fs.readFile as vi.Mock).mockResolvedValueOnce('old content');
    const filePath = 'existingfile.txt';
    const content = 'New content for existing file.';
    const result = await writeFileTool.execute({ content, path: filePath }, mockCtx);
    expect(fs.writeFile).toHaveBeenCalledWith(path.resolve(filePath), content, 'utf-8');
    expect(result).toBe(`Successfully wrote content to ${filePath}.`);
  });

  it('should not write if content is identical', async () => {
    (fs.readFile as vi.Mock).mockResolvedValueOnce('existing content');
    const filePath = 'samecontent.txt';
    const content = 'existing content';
    const result = await writeFileTool.execute({ content, path: filePath }, mockCtx);
    expect(fs.writeFile).not.toHaveBeenCalled();
    expect(result).toBe(`File ${filePath} already contains the desired content. No changes made.`);
  });

  it('should return an error if file writing fails', async () => {
    (fs.writeFile as vi.Mock).mockRejectedValueOnce(new Error('Disk full'));
    const filePath = 'errorfile.txt';
    const content = 'Some content';
    const result = await writeFileTool.execute({ content, path: filePath }, mockCtx);
    expect(result).toHaveProperty('erreur');
    expect(result.erreur).toContain('Disk full');
    expect(mockCtx.log.error).toHaveBeenCalled();
  });
});
