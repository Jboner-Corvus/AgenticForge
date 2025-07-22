console.log('<<<<< LOADING toolLoader.ts >>>>>');
// import * as chokidar from 'chokidar';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

import type { Tool } from '@/types.js';

import logger from '../logger.js';
import { toolRegistry } from '../modules/tools/toolRegistry.js';
import { getErrDetails } from './errorUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache pour stocker les chemins des fichiers d'outils chargés pour éviter les doublons
const loadedToolFiles = new Set<string>();
const fileToToolNameMap = new Map<string, string>();
// let watcher: chokidar.FSWatcher | null = null;

const runningInDist = process.env.NODE_ENV === 'production';
const fileExtension = runningInDist ? '.tool.js' : '.tool.ts';

// Fonction de réinitialisation pour les tests
export function _resetTools(): void {
  loadedToolFiles.clear();
  fileToToolNameMap.clear();
  // if (watcher) {
  //   watcher.close();
  //   watcher = null;
  // }
  // Note: Le toolRegistry n'est pas réinitialisé ici car il est un singleton global.
  // Les tests doivent gérer la réinitialisation du toolRegistry si nécessaire.
}

/**
 * Récupère la liste de tous les outils, en les chargeant s'ils ne le sont pas déjà.
 * C'est la fonction à utiliser dans toute l'application pour garantir une seule source de vérité.
 */
export async function getTools(): Promise<Tool[]> {
  if (loadedToolFiles.size === 0) {
    await _internalLoadTools();
    // if (!watcher) {
    //   watchTools();
    // }
  }
  return toolRegistry.getAll();
}

/**
 * Charge dynamiquement tous les outils disponibles. (Fonction interne)
 * @returns Une promesse qui se résout avec un tableau de tous les outils chargés.
 */
async function _internalLoadTools(): Promise<void> {
  logger.info(`[_internalLoadTools] Starting to load tools dynamically.`);
  const toolsDir = getToolsDir();
  console.log(`[toolLoader] Resolved toolsDir: ${toolsDir}`);
  let toolFiles: string[] = []; // Declare toolFiles here
  try {
    toolFiles = await findToolFiles(toolsDir, fileExtension);
    console.log(`[toolLoader] Found tool files: ${toolFiles.join(', ')}`);
    logger.info(
      `[_internalLoadTools] Found tool files: ${toolFiles.join(', ')}`,
    );
    for (const file of toolFiles) {
      logger.info(`[_internalLoadTools] Attempting to load tool file: ${file}`);
      await loadToolFile(file);
      logger.info(
        `[_internalLoadTools] Successfully loaded tool file: ${file}`,
      );
    }
  } catch (error) {
    logger.error({
      ...getErrDetails(error),
      logContext:
        '[_internalLoadTools] Error during tool file discovery or loading.',
    });
    throw error; // Re-throw to ensure the error is propagated
  }
  logger.info(
    `${toolRegistry.getAll().length} tools have been loaded dynamically.`,
  );
}

/**
 * Trouve récursivement les fichiers d'outils. (Fonction interne)
 */
async function findToolFiles(
  dir: string,
  extension: string,
): Promise<string[]> {
  let files: string[] = [];
  console.log(`[findToolFiles] Scanning directory: ${dir}`);
  logger.info(`[findToolFiles] Scanning directory: ${dir}`);
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    console.log(`[findToolFiles] Found ${entries.length} entries in ${dir}`);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      console.log(`[findToolFiles] Processing entry: ${fullPath}`);
      if (entry.isDirectory()) {
        files = files.concat(await findToolFiles(fullPath, extension));
      } else if (entry.isFile() && entry.name.endsWith(extension)) {
        files.push(fullPath);
        console.log(`[findToolFiles] Added tool file: ${fullPath}`);
      }
    }
  } catch (error) {
    const errDetails = getErrDetails(error);
    logger.error({
      ...errDetails,
      directory: dir,
      logContext: "Erreur lors du parcours du répertoire d'outils.",
    });
    console.error(
      `[findToolFiles] Error: ${errDetails.message} in directory: ${dir}`,
    );
    // Re-throw ENOENT errors as they indicate a missing tools directory,
    // which should be a fatal error for the application.
    throw new Error(
      `Impossible de lire le répertoire des outils '${dir}'. Détails: ${errDetails.message}`,
    );
  }
  console.log(`[findToolFiles] Returning ${files.length} files from ${dir}`);
  return files;
}

// Fonction pour obtenir dynamiquement le répertoire des outils
function getToolsDir(): string {
  logger.debug(`[getToolsDir] Running in dist: ${runningInDist}`);
  logger.debug(`[getToolsDir] __dirname: ${__dirname}`);
  const toolsPath =
    process.env.TOOLS_PATH ||
    (runningInDist
      ? path.join(__dirname, '..', 'tools') // Correction: remonter d'un niveau
      : path.resolve(__dirname, '..', 'modules', 'tools'));
  logger.debug(`[getToolsDir] Constructed tools path: ${toolsPath}`);
  return toolsPath;
}

async function loadToolFile(file: string): Promise<void> {
  try {
    // Invalidate module cache for dynamic loading
    if (process.env.NODE_ENV === 'development') {
      const resolvedPath = path.resolve(file);

      delete (global as any)._moduleCache?.[resolvedPath];
    }

    const module = await import(`${path.resolve(file)}?update=${Date.now()}`);
    logger.info(
      { file, moduleExports: Object.keys(module) },
      `[loadToolFile] Loaded module`,
    );

    for (const exportName in module) {
      const exportedItem = module[exportName];
      if (
        exportedItem &&
        typeof exportedItem === 'object' &&
        'name' in exportedItem &&
        'execute' in exportedItem
      ) {
        logger.info(
          { file, toolName: exportedItem.name },
          `[loadToolFile] Registering tool`,
        );
        toolRegistry.register(exportedItem as Tool);
        loadedToolFiles.add(file);
        fileToToolNameMap.set(file, exportedItem.name);
      } else {
        logger.warn(
          { exportName, file },
          `[loadToolFile] Skipping non-tool export`,
        );
      }
    }
  } catch (error) {
    logger.error({
      ...getErrDetails(error),
      file,
      logContext: `[loadToolFile] Failed to dynamically load tool file.`,
    });
  }
}
