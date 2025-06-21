/**
 * src/utils/dockerManager.ts
 *
 * Fournit des fonctions pour exécuter du code dans des conteneurs Docker sécurisés (sandbox).
 */

import Docker from 'dockerode';
import { config } from '../config.js';
import logger from '../logger.js';

const docker = new Docker(); // Se connecte au socket Docker local par défaut

interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Exécute une commande dans un conteneur Docker jetable.
 * @param imageName - L'image Docker à utiliser (ex: 'python:3.11-slim').
 * @param command - La commande à exécuter (ex: ['python', '-c', 'print("hello")']).
 * @returns Une promesse qui se résout avec le résultat de l'exécution.
 */
export async function runInSandbox(imageName: string, command: string[]): Promise<ExecutionResult> {
  const log = logger.child({ module: 'DockerManager', imageName });
  log.info({ command }, 'Starting sandboxed execution');

  let container: Docker.Container | null = null;
  try {
    // S'assure que l'image est disponible localement
    await pullImageIfNotExists(imageName);

    // Crée le conteneur
    container = await docker.createContainer({
      Image: imageName,
      Cmd: command,
      Tty: false,
      HostConfig: {
        // Limite les ressources pour éviter les abus
        Memory: 256 * 1024 * 1024, // 256MB
        CpuShares: 512, // Priorité CPU relative
        NetworkMode: 'none', // Isole le conteneur du réseau par défaut
      },
    });

    // Démarre le conteneur
    await container.start();

    // Attend la fin de l'exécution, avec un timeout
    const waitPromise = container.wait();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Execution timed out')), config.CODE_EXECUTION_TIMEOUT_MS)
    );

    const result: { StatusCode: number } = (await Promise.race([
      waitPromise,
      timeoutPromise,
    ])) as any;

    // Récupère les logs (stdout/stderr)
    const logStream = await container.logs({ follow: false, stdout: true, stderr: true });

    // Docker multiplexe stdout et stderr dans un seul flux, il faut le démultiplexer.
    const { stdout, stderr } = demuxStream(logStream as Buffer);

    log.info({ exitCode: result.StatusCode, stdout, stderr }, 'Sandboxed execution finished');

    return {
      stdout: stdout,
      stderr: stderr,
      exitCode: result.StatusCode,
    };
  } catch (error) {
    log.error({ err: error }, 'Error during sandboxed execution');
    throw error;
  } finally {
    // Nettoie le conteneur après l'exécution
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
  } catch (error: any) {
    if (error.statusCode === 404) {
      logger.info(`Image ${imageName} not found locally, pulling...`);
      const stream = await docker.pull(imageName);
      await new Promise((resolve, reject) => {
        docker.modem.followProgress(stream, (err, res) => (err ? reject(err) : resolve(res)));
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
      // stdout
      stdout += payload;
    } else if (type === 2) {
      // stderr
      stderr += payload;
    }
    offset += length;
  }
  return { stdout, stderr };
}
