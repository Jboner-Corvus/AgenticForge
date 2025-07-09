/**
 * src/utils/dockerManager.ts
 *
 * Fournit des fonctions pour exécuter du code dans des conteneurs Docker sécurisés (sandbox).
 */
import Docker from 'dockerode';

import { config } from '../config.js';
import logger from '../logger.js';
import { UserError } from './errorUtils.js';
const docker = new Docker(); // Se connecte au socket Docker local par défaut
/**
 * Exécute une commande dans un conteneur Docker jetable.
 * @param imageName - L'image Docker à utiliser.
 * @param command - La commande à exécuter.
 * @param options - Options supplémentaires pour le sandbox (workingDir, mounts).
 * @returns Une promesse qui se résout avec le résultat de l'exécution.
 */
export async function runInSandbox(imageName, command, options = {}) {
  const log = logger.child({ imageName, module: 'DockerManager' });
  log.info({ command, options }, 'Starting sandboxed execution');
  let container = null;
  try {
    await pullImageIfNotExists(imageName);
    container = await docker.createContainer({
      Cmd: command,
      HostConfig: {
        CpuShares: 512,
        Memory: parseMemoryString(config.CONTAINER_MEMORY_LIMIT),
        Mounts: options.mounts,
        NetworkMode: 'bridge',
      },
      Image: imageName,
      Tty: false,
      WorkingDir: options.workingDir,
    });
    await container.start();
    const waitPromise = container.wait();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new UserError('Execution timed out')),
        config.CODE_EXECUTION_TIMEOUT_MS,
      ),
    );
    const result = await Promise.race([waitPromise, timeoutPromise]);
    const logStream = await container.logs({
      follow: false,
      stderr: true,
      stdout: true,
    });
    const { stderr, stdout } = demuxStream(logStream);
    log.info(
      { exitCode: result.StatusCode, stderr, stdout },
      'Sandboxed execution finished',
    );
    return {
      exitCode: result.StatusCode,
      stderr: stderr,
      stdout: stdout,
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
 * Démultiplexe le flux de logs de Docker en stdout et stderr.
 */
function demuxStream(stream) {
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
  return { stderr, stdout };
}
/**
 * Analyse une chaîne de caractères représentant une taille de mémoire (ex: "2g", "512m")
 * et la convertit en octets.
 * @param memoryString - La chaîne de caractères à analyser.
 * @returns Le nombre d'octets.
 */
function parseMemoryString(memoryString) {
  const unit = memoryString.slice(-1).toLowerCase();
  const value = parseInt(memoryString.slice(0, -1), 10);
  if (isNaN(value)) {
    throw new Error(`Invalid memory string: ${memoryString}`);
  }
  switch (unit) {
    case 'g':
      return value * 1024 * 1024 * 1024;
    case 'k':
      return value * 1024;
    case 'm':
      return value * 1024 * 1024;
    default:
      return parseInt(memoryString, 10);
  }
}
/**
 * Tire une image Docker si elle n'est pas déjà présente localement.
 */
async function pullImageIfNotExists(imageName) {
  try {
    await docker.getImage(imageName).inspect();
  } catch (error) {
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
//# sourceMappingURL=dockerManager.js.map
