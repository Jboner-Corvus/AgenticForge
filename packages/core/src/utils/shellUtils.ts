import { spawn } from 'child_process';

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
  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      cwd: config.HOST_PROJECT_PATH,
      env: process.env,
      shell: true,
      stdio: 'pipe'
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data: Buffer) => {
      const chunk = data.toString();
      stdout += chunk;
      if (ctx.streamContent) {
        ctx.streamContent([
          { content: chunk, toolName: 'executeShellCommand', type: 'stdout' },
        ]);
      }
    });

    child.stderr?.on('data', (data: Buffer) => {
      const chunk = data.toString();
      stderr += chunk;
      if (ctx.streamContent) {
        ctx.streamContent([
          { content: chunk, toolName: 'executeShellCommand', type: 'stderr' },
        ]);
      }
    });

    child.on('close', (code: null | number) => {
      resolve({ exitCode: code, stderr, stdout });
    });

    child.on('error', (err: Error) => {
      reject(err);
    });
  });
}
