import { Queue } from 'bullmq';
/// <reference types="vitest/globals" />
import { promises as fs } from 'fs';
import path from 'path';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { Ctx, ILlmProvider, SessionData } from '../../src/types.js';
import logger from '../logger.ts';
import { editFileTool } from './fs/editFile.tool.js';

vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
  },
}));

vi.mock('../logger.ts', async () => {
  const { default: pino } = await vi.importActual<typeof import('pino')>('pino');
  const mockLogger = pino({
    enabled: false, // Disable logging output during tests
    level: 'info',
  });
  return {
    default: mockLogger,
  };
});

describe('editFileTool', () => {
  const mockCtx: Ctx = {
    llm: {} as ILlmProvider,
    log: logger,
    reportProgress: vi.fn(),
    session: {} as SessionData,
    streamContent: vi.fn(),
    taskQueue: {} as Queue,
  };

  const mockFilePath = 'test-file.txt';
  const mockWorkspaceDir = path.resolve(process.cwd(), 'workspace');
  const mockAbsolutePath = path.resolve(mockWorkspaceDir, mockFilePath);

  beforeEach(() => {
    vi.clearAllMocks();
    (fs.readFile as Mock).mockResolvedValue('original content');
    (fs.writeFile as Mock).mockResolvedValue(undefined);
  });

  it('should replace content in a file (string replacement)', async () => {
    const args = {
      content_to_replace: 'original',
      is_regex: false,
      new_content: 'new',
      path: mockFilePath,
    };
    (fs.readFile as Mock).mockResolvedValueOnce('original content');

    const result = await editFileTool.execute(args, mockCtx);

    expect(fs.writeFile).toHaveBeenCalledWith(
      mockAbsolutePath,
      'new content',
      'utf-8',
    );
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
    (fs.readFile as Mock).mockResolvedValueOnce('original content');

    const result = await editFileTool.execute(args, mockCtx);

    expect(fs.writeFile).toHaveBeenCalledWith(
      mockAbsolutePath,
      'nriw content',
      'utf-8',
    );
    expect(result).toEqual({
      message: `Successfully edited content in ${mockFilePath}.`,
      modified_content: 'nriw content',
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
    (fs.readFile as Mock).mockResolvedValueOnce('original content');

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
    (fs.readFile as Mock).mockRejectedValueOnce({ code: 'ENOENT' });

    const result = await editFileTool.execute(args, mockCtx);
    expect(result).toHaveProperty('erreur');
    expect(
      typeof result === 'object' && result !== null && 'erreur' in result
        ? result.erreur
        : result,
    ).toContain('File not found');
  });

  it('should return an error for other file system errors', async () => {
    const args = {
      content_to_replace: 'a',
      is_regex: false,
      new_content: 'b',
      path: mockFilePath,
    };
    (fs.readFile as Mock).mockRejectedValueOnce(new Error('Permission denied'));

    const result = await editFileTool.execute(args, mockCtx);
    expect(result).toHaveProperty('erreur');
    expect(
      typeof result === 'object' && result !== null && 'erreur' in result
        ? result.erreur
        : result,
    ).toContain('Permission denied');
  });
});
