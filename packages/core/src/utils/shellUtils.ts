import { exec } from 'child_process';

import { Ctx } from '@/types';

import { config } from '../config';

export interface ShellCommandResult {
  exitCode: null | number;
  stderr: string;
  stdout: string;
}

export async function executeShellCommand(
  command: string,
  ctx: Ctx,
): Promise<ShellCommandResult> {
  return new Promise((resolve) => {
    exec(command, { cwd: config.HOST_PROJECT_PATH }, (error, stdout, stderr) => {
      if (ctx.streamContent) {
        if (stdout) {
          ctx.streamContent([
            { content: stdout, toolName: 'executeShellCommand', type: 'stdout' },
          ]);
        }
        if (stderr) {
          ctx.streamContent([
            { content: stderr, toolName: 'executeShellCommand', type: 'stderr' },
          ]);
        }
      }
      
      if (error) {
        resolve({ exitCode: error.code || 1, stderr, stdout });
      } else {
        resolve({ exitCode: 0, stderr, stdout });
      }
    });
  });
}
