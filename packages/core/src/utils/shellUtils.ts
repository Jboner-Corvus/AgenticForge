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
  const workingDir = config.WORKER_WORKSPACE_PATH || config.HOST_PROJECT_PATH;
  const shellPath = process.env.SHELL || '/usr/bin/bash';
  console.log(`[SHELLUTILS-DEBUG] shellPath: ${shellPath}`);

  ctx.log.info(
    {
        cwd: workingDir,
        node_env_shell: process.env.SHELL,
        path: process.env.PATH,
        shell: shellPath,
      },
    'Executing shell command with environment:',
  );

  // Helper function to run a simple shell command and return its result
  const runSimpleCommand = (cmd: string, args: string[]): Promise<ShellCommandResult> => {
    return new Promise((resolve, reject) => {
      const child = spawn(cmd, args, {
        cwd: workingDir,
        env: process.env,
        stdio: 'pipe',
      });
      let stdout = '';
      let stderr = '';
      child.stdout?.on('data', (data: Buffer) => { stdout += data.toString(); });
      child.stderr?.on('data', (data: Buffer) => { stderr += data.toString(); });
      child.on('close', (code: null | number) => { resolve({ exitCode: code, stdout, stderr }); });
      child.on('error', (err: Error) => { reject(err); });
    });
  };

  // Debugging: Check which bash is found from Node.js perspective
  const whichBashResult = await runSimpleCommand('which', ['bash']);
    ctx.log.info({ stderr: whichBashResult.stderr.trim(), stdout: whichBashResult.stdout.trim() }, 'which bash result from Node.js:');

  // Debugging: Check echo $SHELL from Node.js perspective
  const echoShellResult = await runSimpleCommand('bash', ['-c', 'echo $SHELL']);
  ctx.log.info({ echoShellStderr: echoShellResult.stderr.trim(), echoShell: echoShellResult.stdout.trim() }, 'echo $SHELL result from Node.js:');

  return new Promise((resolve, reject) => {
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
