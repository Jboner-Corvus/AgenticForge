/// <reference types="vitest/globals" />
import { describe, expect, it, vi } from 'vitest';

// Mock modules first
vi.mock('../../../../config.js', async () => {
  return {
    config: {
      WORKSPACE_PATH: '/mock-workspace',
    },
  };
});

vi.mock('fs', async () => {
  const vitest = await import('vitest');
  return {
    promises: {
      mkdir: vitest.vi.fn(() => Promise.resolve()),
      readFile: vitest.vi.fn(() => Promise.resolve('existing content')),
      stat: vitest.vi.fn(() => Promise.resolve({ isFile: () => true })),
      writeFile: vitest.vi.fn(() => Promise.resolve()),
    },
  };
});

// Then import other dependencies
import { Queue } from 'bullmq';
import { promises as fs } from 'fs';
import path from 'path';

import { Ctx, ILlmProvider, SessionData } from '@/types.js';

import { config } from '../../../../config.js';
import { getLoggerInstance } from '../../../../logger.js';

const mockLogger = {
  child: vi.fn().mockReturnThis(),
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
};

vi.mock('../../../../logger.js', () => ({
  getLoggerInstance: vi.fn(() => mockLogger),
}));
import { writeFile as writeFileTool } from './writeFile.tool.js';

describe('writeFileTool', () => {
  let mockCtx: Ctx;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCtx = {
      llm: {} as ILlmProvider,
      log: getLoggerInstance(),
      reportProgress: vi.fn(),
      session: {} as SessionData,
      streamContent: vi.fn(),
      taskQueue: {} as Queue,
    };
  });

  it('should write content to a new file', async () => {
    vi.mocked(fs.stat).mockImplementationOnce(() =>
      Promise.reject({ code: 'ENOENT' }),
    ); // File does not exist
    const filePath = 'newfile.txt';
    const content = 'Hello, new file!';
    const result = await writeFileTool.execute(
      { content, path: filePath },
      mockCtx,
    );
    expect(fs.mkdir).toHaveBeenCalledWith(
      path.join(config.WORKSPACE_PATH, path.dirname(filePath)),
      { recursive: true },
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      path.join(config.WORKSPACE_PATH, filePath),
      content,
      'utf-8',
    );
    expect(result).toEqual({
      message: `Successfully wrote content to ${filePath}.`,
    });
  });

  it('should overwrite content in an existing file', async () => {
    vi.mocked(fs.readFile).mockResolvedValueOnce('old content');
    const filePath = 'existingfile.txt';
    const content = 'New content for existing file.';
    const result = await writeFileTool.execute(
      { content, path: filePath },
      mockCtx,
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      path.join(config.WORKSPACE_PATH, filePath),
      content,
      'utf-8',
    );
    expect(result).toEqual({
      message: `Successfully wrote content to ${filePath}.`,
    });
  });

  it('should not write if content is identical', async () => {
    vi.mocked(fs.readFile).mockResolvedValueOnce('existing content');
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
    vi.mocked(fs.writeFile).mockRejectedValueOnce(new Error('Disk full'));
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
    expect(getLoggerInstance().error).toHaveBeenCalled();
  });
});
