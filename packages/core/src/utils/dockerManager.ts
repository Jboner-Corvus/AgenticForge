/**
 * src/utils/dockerManager.ts
 *
 * Fournit des fonctions pour exécuter du code localement.
 * Auparavant, utilisait des conteneurs Docker sécurisés (sandbox).
 * Cette version a été modifiée pour exécuter les commandes directement sur le système hôte.
 * ATTENTION : L'exécution de commandes de cette manière sans sandbox est un risque de sécurité.
 */

import { exec } from 'child_process';
import { promisify } from 'util';

import { config } from '../config.js';
import logger from '../logger.js';
import { UserError } from './errorUtils.js';

const execAsync = promisify(exec);

export interface ExecutionResult {
  exitCode: number;
  stderr: string;
  stdout: string;
}

// L'interface SandboxOptions est conservée pour la compatibilité de l'API,
// mais ses options ne sont plus utilisées.
export interface SandboxOptions {
  mounts?: unknown[]; // Type `unknown` car non utilisé
  workingDir?: string;
}

/**
 * Exécute une commande localement sur la machine hôte.
 * @param imageName - Ignoré. Conservé pour la compatibilité.
 * @param command - La commande à exécuter.
 * @param options - Options supplémentaires (seul workingDir est utilisé).
 * @returns Une promesse qui se résout avec le résultat de l'exécution.
 */
export async function runInSandbox(
  imageName: string, // Ce paramètre est maintenant ignoré
  command: string[],
  options: SandboxOptions = {},
): Promise<ExecutionResult> {
  const commandString = command.join(' ');
  const log = logger.child({
    command: commandString,
    module: 'LocalExecutionManager',
  });
  log.warn('Executing command directly on host. The sandbox is disabled.');
  log.info({ options }, 'Starting local execution');

  try {
    const promise = execAsync(commandString, {
      cwd: options.workingDir,
      timeout: config.CODE_EXECUTION_TIMEOUT_MS,
    });

    const result = await promise;

    log.info(
      {
        exitCode: 0,
        stderr: result.stderr,
        stdout: result.stdout,
      },
      'Local execution finished',
    );

    return {
      exitCode: 0, // `exec` lève une exception en cas d'échec, donc le code est 0 si réussi
      stderr: result.stderr,
      stdout: result.stdout,
    };
  } catch (error: unknown) {
    log.error({ err: error }, 'Error during local execution');

    // Check if the error is an instance of an ExecException (from child_process)
    if (error instanceof Error && 'code' in error && 'stderr' in error && 'stdout' in error) {
      return {
        exitCode: (error as any).code, // Cast to any for simplicity, or define a specific interface
        stderr: (error as any).stderr,
        stdout: (error as any).stdout,
      };
    }

    // If it's a timeout error (signal 'SIGTERM')
    if (error instanceof Error && 'signal' in error && (error as any).signal === 'SIGTERM') {
      throw new UserError('Execution timed out');
    }

    // For other errors, we re-throw them
    throw error;
  }
}
