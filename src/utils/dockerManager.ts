/**
 * src/utils/dockerManager.ts
 *
 * Fournit des fonctions pour exécuter du code dans des conteneurs Docker sécurisés (sandbox).
 */

import Docker from 'dockerode';
import { config } from '../config.js';
import logger from '../logger.js';

const docker = new Docker(); // Se connecte au socket Docker local par défaut

// Définition manuelle du type Mount car il n'est pas exporté par @types/dockerode
interface DockerMount {
  Target: string;
  Source: string;
  Type: 'bind' | 'volume' | 'tmpfs';
  ReadOnly?: boolean;
}

interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

interface SandboxOptions {
  workingDir?: string;
  mounts?: DockerMount[];
}

/**
 * Exécute une commande dans un conteneur Docker jetable.
 * @param imageName - L'image Docker à utiliser.
 * @param command - La commande à exécuter.
 * @param options - Options supplémentaires pour le sandbox (workingDir, mounts).
 * @returns Une promesse qui se résout avec le résultat de l'exécution.
 */
export async function runInSandbox(
  imageName: string,
  command: string[],
  options: SandboxOptions = {},
): Promise<ExecutionResult> {
  const log = logger.child({ module: 'DockerManager', imageName });
  log.info({ command, options }, 'Starting sandboxed execution');

  let container: Docker.Container | null = null;
  try {
    await pullImageIfNotExists(imageName);

    container = await docker.createContainer({
      Image: imageName,
      Cmd: command,
      Tty: false,
      WorkingDir: options.workingDir,
      HostConfig: {
        Memory: 2048 * 1024 * 1024, // CORRECTION: Passage de 512MB à 2048MB (2GB)
        CpuShares: 512,
        NetworkMode: 'bridge',
        Mounts: options.mounts,
      },
    });

    await container.start();

    const waitPromise = container.wait();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error('Execution timed out')),
        config.CODE_EXECUTION_TIMEOUT_MS,
      ),
    );

    const result = (await Promise.race([waitPromise, timeoutPromise])) as {
      StatusCode: number;
    };

    const logStream = await container.logs({
      follow: false,
      stdout: true,
      stderr: true,
    });

    const { stdout, stderr } = demuxStream(logStream as Buffer);

    log.info(
      { exitCode: result.StatusCode, stdout, stderr },
      'Sandboxed execution finished',
    );

    return {
      stdout: stdout,
      stderr: stderr,
      exitCode: result.StatusCode,
    };
  } catch (error) {
    log.error({ err: error }, 'Error during sandboxed execution');
    throw error;
  } finally {
    if (container) {
      await container.remove({ force: true });
      log.debug('Sandbox container removed.');
    }
  }
}

/**
 * Tire une image Docker si elle n'est pas déjà présente localement.
 */
async function pullImageIfNotExists(imageName: string): Promise<void> {
  try {
    await docker.getImage(imageName).inspect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error?.statusCode === 404) {
      logger.info(`Image ${imageName} not found locally, pulling...`);
      const stream = await docker.pull(imageName);
      await new Promise((resolve, reject) => {
        docker.modem.followProgress(stream, (err, res) =>
          err ? reject(err) : resolve(res),
        );
      });
      logger.info(`Image ${imageName} pulled successfully.`);
    } else {
      throw error;
    }
  }
}

/**
 * Démultiplexe le flux de logs de Docker en stdout et stderr.
 */
function demuxStream(stream: Buffer): { stdout: string; stderr: string } {
  let stdout = '';
  let stderr = '';
  let offset = 0;

  while (offset < stream.length) {
    const type = stream[offset];
    const length = stream.readUInt32BE(offset + 4);
    offset += 8;
    const payload = stream.toString('utf-8', offset, offset + length);
    if (type === 1) {
      stdout += payload;
    } else if (type === 2) {
      stderr += payload;
    }
    offset += length;
  }
  return { stdout, stderr };
}
