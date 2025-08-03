import { spawn } from 'child_process';
import { access, constants } from 'fs/promises';

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
  const workingDir = config.WORKER_WORKSPACE_PATH || config.HOST_PROJECT_PATH;

  async function findBashPath(): Promise<string> {
    const possiblePaths = ['/bin/bash', '/usr/bin/bash'];
    for (const p of possiblePaths) {
      try {
        await access(p, constants.X_OK); // Check if file exists and is executable
        return p;
      } catch (_e) {
        // Path not found or not executable, try next
      }
    }
    throw new Error('Bash executable not found at expected paths.');
  }

  let shellPath: string;
  try {
    shellPath = await findBashPath();
  } catch (error) {
    ctx.log.error({ err: error }, 'Failed to find bash executable.');
    throw error; // Re-throw the error to be caught by the caller
  }

  return new Promise((resolve, reject) => {
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
