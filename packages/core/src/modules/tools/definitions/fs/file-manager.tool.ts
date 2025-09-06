import { z } from 'zod';
import { readFile as fsReadFile, writeFile as fsWriteFile, readdir, stat } from 'fs/promises';
import { join, dirname } from 'path';
import type { Tool } from '../../../../types.ts';

const FileManagerParams = z.object({
  action: z.enum(['read', 'write', 'list', 'edit', 'delete'])
    .describe('File operation to perform'),
  path: z.string()
    .describe('File or directory path'),
  content: z.string()
    .optional()
    .describe('Content to write (required for write/edit actions)'),
  encoding: z.string()
    .optional()
    .default('utf8')
    .describe('File encoding'),
});

export const fileManagerTool: Tool<typeof FileManagerParams> = {
  description: 'Comprehensive file management tool - read, write, edit, list, and delete files',

  execute: async (params, context) => {
    const { log } = context;
    const parsedParams = FileManagerParams.parse(params);

    try {
      log.info('File operation', {
        action: parsedParams.action,
        path: parsedParams.path
      });

      switch (parsedParams.action) {
        case 'read':
          if (!parsedParams.path) {
            throw new Error('Path is required for read operation');
          }
          const content = await fsReadFile(parsedParams.path, parsedParams.encoding as BufferEncoding);
          return {
            success: true,
            action: 'read',
            path: parsedParams.path,
            content: content.toString(),
            encoding: parsedParams.encoding
          };

        case 'write':
          if (!parsedParams.path || parsedParams.content === undefined) {
            throw new Error('Path and content are required for write operation');
          }
          await fsWriteFile(parsedParams.path, parsedParams.content, parsedParams.encoding as BufferEncoding);
          return {
            success: true,
            action: 'write',
            path: parsedParams.path,
            bytesWritten: Buffer.byteLength(parsedParams.content, parsedParams.encoding as BufferEncoding)
          };

        case 'edit':
          if (!parsedParams.path || parsedParams.content === undefined) {
            throw new Error('Path and content are required for edit operation');
          }
          // For edit, we replace the entire file content
          await fsWriteFile(parsedParams.path, parsedParams.content, parsedParams.encoding as BufferEncoding);
          return {
            success: true,
            action: 'edit',
            path: parsedParams.path,
            bytesWritten: Buffer.byteLength(parsedParams.content, parsedParams.encoding as BufferEncoding)
          };

        case 'list':
          const targetPath = parsedParams.path || '.';
          const entries = await readdir(targetPath, { withFileTypes: true });
          const files = await Promise.all(
            entries.map(async (entry) => {
              const fullPath = join(targetPath, entry.name);
              const stats = await stat(fullPath);
              return {
                name: entry.name,
                type: entry.isDirectory() ? 'directory' : 'file',
                size: stats.size,
                modified: stats.mtime.toISOString(),
                path: fullPath
              };
            })
          );
          return {
            success: true,
            action: 'list',
            path: targetPath,
            files: files
          };

        case 'delete':
          // Note: Using fs.rm for deletion (available in Node.js 14+)
          const { rm } = await import('fs/promises');
          await rm(parsedParams.path, { recursive: true, force: true });
          return {
            success: true,
            action: 'delete',
            path: parsedParams.path
          };

        default:
          throw new Error(`Unsupported action: ${parsedParams.action}`);
      }

    } catch (error) {
      log.error({ err: error, params: parsedParams }, 'File operation error');
      throw new Error(
        `File operation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },

  name: 'file_manager',
  parameters: FileManagerParams,
};