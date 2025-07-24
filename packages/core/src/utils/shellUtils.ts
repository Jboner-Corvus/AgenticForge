// packages/core/src/utils/shellUtils.ts
import { spawn } from 'child_process';

import { config } from '../config.js';
import logger from '../logger.js';

export interface ShellCommandResult {
  exitCode: number;
  stderr: string;
  stdout: string;
}

export function executeShellCommand(
  command: string,
): Promise<ShellCommandResult> {
  const log = logger.child({ module: 'shellUtils' });
  return new Promise((resolve) => {
    log.info(`Executing shell command: ${command}`);

    const child = spawn(command, {
      cwd: config.WORKSPACE_PATH,
      shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash',
      stdio: 'pipe',
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    child.on('error', (error) => {
      log.error({ err: error }, `Failed to start shell command: ${command}`);
      resolve({
        exitCode: 1,
        stderr: `Failed to start command: ${error.message}`,
        stdout: '',
      });
    });

    child.on('close', (code) => {
      log.info(`Command finished with exit code: ${code}`);
      resolve({
        exitCode: code ?? 1,
        stderr,
        stdout,
      });
    });
  });
}
