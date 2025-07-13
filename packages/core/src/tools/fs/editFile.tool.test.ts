/// <reference types="vitest/globals" />
import { promises as fs } from 'fs';
import path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Ctx } from '../types.js';
import { editFileTool } from './editFile.tool.js';

vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
  },
}));

describe('editFileTool', () => {
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

  const mockFilePath = 'test-file.txt';
  const mockWorkspaceDir = path.resolve(process.cwd(), 'workspace');
  const mockAbsolutePath = path.resolve(mockWorkspaceDir, mockFilePath);

  beforeEach(() => {
    vi.clearAllMocks();
    (fs.readFile as vi.Mock).mockResolvedValue('original content');
    (fs.writeFile as vi.Mock).mockResolvedValue(undefined);
  });

  it('should replace content in a file (string replacement)', async () => {
    const args = {
      content_to_replace: 'original',
      is_regex: false,
      new_content: 'new',
      path: mockFilePath,
    };
    (fs.readFile as vi.Mock).mockResolvedValueOnce('original content');

    const result = await editFileTool.execute(args, mockCtx);

    expect(fs.writeFile).toHaveBeenCalledWith(mockAbsolutePath, 'new content', 'utf-8');
    expect(result).toEqual({
      message: `Successfully edited content in ${mockFilePath}.`,
      modified_content: 'new content',
      original_content: 'original content',
      success: true,
    });
  });

  it('should replace content in a file (regex replacement)', async () => {
    const args = {
      content_to_replace: 'o(ri)ginal',
      is_regex: true,
      new_content: 'n$1w',
      path: mockFilePath,
    };
    (fs.readFile as vi.Mock).mockResolvedValueOnce('original content');

    const result = await editFileTool.execute(args, mockCtx);

    expect(fs.writeFile).toHaveBeenCalledWith(mockAbsolutePath, 'niw content', 'utf-8');
    expect(result).toEqual({
      message: `Successfully edited content in ${mockFilePath}.`,
      modified_content: 'niw content',
      original_content: 'original content',
      success: true,
    });
  });

  it('should return success if no changes are needed', async () => {
    const args = {
      content_to_replace: 'non-existent',
      is_regex: false,
      new_content: 'new',
      path: mockFilePath,
    };
    (fs.readFile as vi.Mock).mockResolvedValueOnce('original content');

    const result = await editFileTool.execute(args, mockCtx);

    expect(fs.writeFile).not.toHaveBeenCalled();
    expect(result).toEqual({
      message: `No changes were needed in ${mockFilePath}. The content was already correct.`,
      success: true,
    });
  });

  it('should return an error if file not found', async () => {
    const args = {
      content_to_replace: 'a',
      is_regex: false,
      new_content: 'b',
      path: 'non-existent.txt',
    };
    (fs.readFile as vi.Mock).mockRejectedValueOnce({ code: 'ENOENT' });

    const result = await editFileTool.execute(args, mockCtx);
    expect(result).toHaveProperty('erreur');
    expect(result.erreur).toContain('File not found');
  });

  it('should return an error for other file system errors', async () => {
    const args = {
      content_to_replace: 'a',
      is_regex: false,
      new_content: 'b',
      path: mockFilePath,
    };
    (fs.readFile as vi.Mock).mockRejectedValueOnce(new Error('Permission denied'));

    const result = await editFileTool.execute(args, mockCtx);
    expect(result).toHaveProperty('erreur');
    expect(result.erreur).toContain('Permission denied');
  });
});
