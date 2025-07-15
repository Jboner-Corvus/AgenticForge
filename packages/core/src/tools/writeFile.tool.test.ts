import { Job, Queue } from 'bullmq';
/// <reference types="vitest/globals" />
import { promises as fs } from 'fs';
import path from 'path';
import { describe, expect, it, Mock, vi } from 'vitest';

import logger from '../../logger.js';
import { Ctx, SessionData } from '../../src/types.js';
import { writeFile as writeFileTool } from './fs/writeFile.tool.js';

vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn(() => Promise.resolve()),
    readFile: vi.fn(() => Promise.resolve('existing content')),
    stat: vi.fn(() => Promise.resolve({ isFile: () => true })),
    writeFile: vi.fn(() => Promise.resolve()),
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

describe('writeFileTool', () => {
  const mockCtx: Ctx = {
    log: logger,
    reportProgress: vi.fn(),
    session: {} as SessionData,
    streamContent: vi.fn(),
    taskQueue: {} as Queue,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should write content to a new file', async () => {
    (fs.stat as Mock).mockImplementationOnce(() =>
      Promise.reject({ code: 'ENOENT' }),
    ); // File does not exist
    const filePath = 'newfile.txt';
    const content = 'Hello, new file!';
    const result = await writeFileTool.execute(
      { content, path: filePath },
      mockCtx,
    );
    expect(fs.mkdir).toHaveBeenCalledWith(
      path.dirname(path.resolve(filePath)),
      { recursive: true },
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      path.resolve(filePath),
      content,
      'utf-8',
    );
    expect(result).toEqual({ message: `Successfully wrote content to ${filePath}.` });
  });

  it('should overwrite content in an existing file', async () => {
    (fs.readFile as Mock).mockResolvedValueOnce('old content');
    const filePath = 'existingfile.txt';
    const content = 'New content for existing file.';
    const result = await writeFileTool.execute(
      { content, path: filePath },
      mockCtx,
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      path.resolve(filePath),
      content,
      'utf-8',
    );
    expect(result).toEqual({ message: `Successfully wrote content to ${filePath}.` });
  });

  it('should not write if content is identical', async () => {
    (fs.readFile as Mock).mockResolvedValueOnce('existing content');
    const filePath = 'samecontent.txt';
    const content = 'existing content';
    const result = await writeFileTool.execute(
      { content, path: filePath },
      mockCtx,
    );
    expect(fs.writeFile).not.toHaveBeenCalled();
    expect(result).toEqual({
      message: `File ${filePath} already contains the desired content. No changes made.`,
    });
  });

  it('should return an error if file writing fails', async () => {
    (fs.writeFile as Mock).mockRejectedValueOnce(new Error('Disk full'));
    const filePath = 'errorfile.txt';
    const content = 'Some content';
    const result = await writeFileTool.execute(
      { content, path: filePath },
      mockCtx,
    );
    expect(typeof result).toBe('object');
    if (typeof result === 'object' && result !== null && 'erreur' in result) {
      expect(result.erreur).toContain('Disk full');
    } else {
      throw new Error('Expected an object with an erreur property.');
    }
    expect(mockCtx.log.error).toHaveBeenCalled();
  });
});
