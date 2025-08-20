import { spawn } from 'child_process';
import { access, constants } from 'fs/promises';

import { config } from '../config';
import { Ctx } from '../types.ts';

export interface ShellCommandResult {
  exitCode: null | number;
  stderr: string;
  stdout: string;
}

export async function executeShellCommand(
  command: string,
  ctx: Ctx,
  timeoutMs: number = 30000, // 30 secondes par défaut
): Promise<ShellCommandResult> {
  // Validation de sécurité : commandes interdites
  const dangerousCommands = [
    'rm -rf /',
    'mkfs',
    'dd if=',
    'format',
    'fdisk',
    'shutdown',
    'reboot',
    'halt',
    'poweroff',
    'init 0',
    'init 6',
    'killall -9',
    'pkill -9 -f',
  ];
  
  const commandLower = command.toLowerCase();
  for (const dangerous of dangerousCommands) {
    if (commandLower.includes(dangerous.toLowerCase())) {
      throw new Error(`Commande dangereuse détectée et bloquée: ${dangerous}`);
    }
  }

  // Limitation de la longueur de commande
  if (command.length > 1000) {
    throw new Error('Commande trop longue (max 1000 caractères)');
  }

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
        timeoutMs,
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
    let isFinished = false;

    // Timeout handler
    const timeoutId = setTimeout(() => {
      if (!isFinished) {
        isFinished = true;
        child.kill('SIGKILL');
        reject(new Error(`Commande interrompue après ${timeoutMs}ms (timeout)`));
      }
    }, timeoutMs);

    // Limites de taille de sortie (protection contre les sorties massives)
    const MAX_OUTPUT_SIZE = 10 * 1024 * 1024; // 10MB max

    child.stdout?.on('data', (data: Buffer) => {
      const chunk = data.toString();
      if (stdout.length + chunk.length > MAX_OUTPUT_SIZE) {
        child.kill('SIGKILL');
        clearTimeout(timeoutId);
        if (!isFinished) {
          isFinished = true;
          reject(new Error('Sortie trop volumineuse (>10MB), commande interrompue'));
        }
        return;
      }
      stdout += chunk;
      if (ctx.streamContent) {
        ctx.streamContent([
          { content: chunk, toolName: 'executeShellCommand', type: 'stdout' },
        ]);
      }
    });

    child.stderr?.on('data', (data: Buffer) => {
      const chunk = data.toString();
      if (stderr.length + chunk.length > MAX_OUTPUT_SIZE) {
        child.kill('SIGKILL');
        clearTimeout(timeoutId);
        if (!isFinished) {
          isFinished = true;
          reject(new Error('Erreur trop volumineuse (>10MB), commande interrompue'));
        }
        return;
      }
      stderr += chunk;
      if (ctx.streamContent) {
        ctx.streamContent([
          { content: chunk, toolName: 'executeShellCommand', type: 'stderr' },
        ]);
      }
    });

    child.on('close', (code: null | number) => {
      clearTimeout(timeoutId);
      if (!isFinished) {
        isFinished = true;
        resolve({ exitCode: code, stderr, stdout });
      }
    });

    child.on('error', (err: Error) => {
      clearTimeout(timeoutId);
      if (!isFinished) {
        isFinished = true;
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
      }
    });
  });
}
