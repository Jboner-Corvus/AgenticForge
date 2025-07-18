console.log('<<<<< LOADING toolLoader.ts >>>>>');
import * as chokidar from 'chokidar';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

import type { Tool } from '../types.js';

import logger from '../logger.js';
import { toolRegistry } from '../toolRegistry.js';
import { getErrDetails } from './errorUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache pour stocker les chemins des fichiers d'outils chargés pour éviter les doublons
const loadedToolFiles = new Set<string>();
const fileToToolNameMap = new Map<string, string>();
let watcher: chokidar.FSWatcher | null = null;

const runningInDist = process.env.NODE_ENV === 'production';
const fileExtension = runningInDist ? '.tool.js' : '.tool.ts';

// Fonction de réinitialisation pour les tests
export function _resetTools(): void {
  loadedToolFiles.clear();
  fileToToolNameMap.clear();
  if (watcher) {
    watcher.close();
    watcher = null;
  }
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
    if (!watcher) {
      watchTools();
    }
  }
  return toolRegistry.getAll();
}

/**
 * Charge dynamiquement tous les outils disponibles. (Fonction interne)
 * @returns Une promesse qui se résout avec un tableau de tous les outils chargés.
 */
async function _internalLoadTools(): Promise<void> {
  logger.info('[_internalLoadTools] Starting to load tools dynamically.');
  const toolsDir = getToolsDir();
  logger.info(`[_internalLoadTools] Tools directory: ${toolsDir}`);
  const toolFiles = await findToolFiles(toolsDir, fileExtension);
  logger.info(`[_internalLoadTools] Found tool files: ${toolFiles.join(', ')}`);

  for (const file of toolFiles) {
    await loadToolFile(file);
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
  logger.info(`[findToolFiles] Scanning directory: ${dir}`);
  try {
    logger.info(`[findToolFiles] About to read directory: ${dir}`);
    const entries = await fs.readdir(dir, { withFileTypes: true });
    logger.info(
      `[findToolFiles] Found entries: ${entries.map((e) => e.name).join(', ')}`,
    );
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        logger.info(`[findToolFiles] Found directory: ${fullPath}`);
        files = files.concat(await findToolFiles(fullPath, extension));
      } else if (entry.isFile() && entry.name.endsWith(extension)) {
        logger.info(`[findToolFiles] Found tool file: ${fullPath}`);
        files.push(fullPath);
      }
    }
  } catch (error) {
    const errDetails = getErrDetails(error);
    logger.error({
      ...errDetails,
      directory: dir,
      logContext: "Erreur lors du parcours du répertoire d'outils.",
    });
    // Ne pas lancer d'erreur si le répertoire n'existe pas (cas des tests)
    if (!errDetails.message.includes('ENOENT')) {
      throw new Error(
        `Impossible de lire le répertoire des outils '${dir}'. Détails: ${errDetails.message}`,
      );
    }
  }
  return files;
}

// Fonction pour obtenir dynamiquement le répertoire des outils
function getToolsDir(): string {
  console.log('Running in dist:', runningInDist);
  console.log('__dirname:', __dirname);
  const toolsPath =
    process.env.TOOLS_PATH ||
    (runningInDist
      ? path.join(__dirname, 'tools')
      : path.resolve(__dirname, '..', 'tools'));
  console.log('Constructed tools path:', toolsPath);
  return toolsPath;
}

async function loadToolFile(file: string): Promise<void> {
  try {
    // Invalidate module cache for dynamic loading
    if (process.env.NODE_ENV === 'development') {
      const resolvedPath = path.resolve(file);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global as any)._moduleCache?.[resolvedPath];
    }

    const module = await import(`${path.resolve(file)}?update=${Date.now()}`);
    console.log(`Module loaded for ${file}:`, module); // Added log

    for (const exportName in module) {
      console.log(`Checking export: ${exportName}`); // Added log
      const exportedItem = module[exportName];
      if (
        exportedItem &&
        typeof exportedItem === 'object' &&
        'name' in exportedItem &&
        'execute' in exportedItem
      ) {
        console.log(`Registering tool: ${exportedItem.name}`); // Added log
        toolRegistry.register(exportedItem as Tool);
        loadedToolFiles.add(file);
        fileToToolNameMap.set(file, exportedItem.name);
        logger.info(
          `Outil chargé : '${exportedItem.name}' depuis ${path.basename(file)}`,
        );
      } else {
        console.log(`Skipping export: ${exportName}`); // Added log
      }
    }
  } catch (error) {
    logger.error({
      ...getErrDetails(error),
      file,
      logContext: `Échec du chargement dynamique du fichier d'outil.`,
    });
  }
}

function unloadToolFile(file: string): void {
  const toolName = fileToToolNameMap.get(file);
  if (toolName) {
    toolRegistry.unregister(toolName);
    fileToToolNameMap.delete(file);
  }
  loadedToolFiles.delete(file);
  logger.info(`Fichier d'outil déchargé (chemin) : ${path.basename(file)}`);
}

function watchTools(): void {
  const toolsDir = getToolsDir();
  logger.info(
    `Démarrage de l'observateur de fichiers pour les outils dans: ${toolsDir}`,
  );
  watcher = chokidar.watch(toolsDir, {
    ignored: /(^|\/)\..*|\.d\.ts$/,
    ignoreInitial: true,
    persistent: true,
  });

  watcher.on('add', async (filePath) => {
    logger.info(`Nouveau fichier d'outil détecté: ${filePath}`);
    await loadToolFile(filePath);
  });

  watcher.on('change', async (filePath) => {
    logger.info(`Fichier d'outil modifié détecté: ${filePath}`);
    unloadToolFile(filePath);
    await loadToolFile(filePath);
  });

  watcher.on('unlink', (filePath: string) => {
    logger.info(`Fichier d'outil supprimé détecté: ${filePath}`);
    unloadToolFile(filePath);
  });

  watcher.on('error', (error: unknown) => {
    logger.error({
      ...getErrDetails(error),
      logContext: "Erreur de l'observateur de fichiers d'outils.",
    });
  });
}
