import { spawn } from 'child_process';

import { config } from '../config';
import { Ctx } from '../types.js';

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
    const workingDir = config.WORKER_WORKSPACE_PATH || config.HOST_PROJECT_PATH;
    const shellPath = process.env.SHELL || '/usr/bin/bash';
    console.log(`[SHELLUTILS-DEBUG] shellPath: ${shellPath}`);

    ctx.log.info(
      {
        cwd: workingDir,
        path: process.env.PATH,
        shell: shellPath,
      },
      'Executing shell command with environment:',
    );

    const child = spawn(shellPath, ['-c', command], {
      cwd: workingDir,
      env: process.env,
      stdio: 'pipe',
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
      ctx.log.error(
        {
          cwd: workingDir,
          err,
          path: process.env.PATH,
          shell: shellPath,
        },
        'Shell command execution failed',
      );
      reject(err);
    });
  });
}
