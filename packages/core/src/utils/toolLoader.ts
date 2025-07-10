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
let watcher: chokidar.FSWatcher | null = null;

const runningInDist = __dirname.includes('dist');
const fileExtension = runningInDist ? '.tool.js' : '.tool.ts';
const toolsDir =
  process.env.TOOLS_PATH ||
  (runningInDist
    ? path.join(__dirname, '..', 'tools')
    : path.resolve(__dirname, '..', '..', 'src', 'tools'));
const generatedToolsDir = path.join(toolsDir, 'generated');

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
  const toolFiles = await findToolFiles(toolsDir, fileExtension);

  logger.info(`Calculated toolsDir: ${toolsDir}`);
  logger.info(`Current working directory: ${process.cwd()}`);
  logger.info(`Calculated fileExtension: ${fileExtension}`);
  logger.info(
    `Début du chargement dynamique des outils depuis: ${toolsDir} (recherche de *${fileExtension})`,
  );

  for (const file of toolFiles) {
    await loadToolFile(file);
  }
  logger.info(
    `${toolRegistry.getAll().length} outils ont été chargés dynamiquement.`,
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
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(await findToolFiles(fullPath, extension));
      } else if (entry.isFile() && entry.name.endsWith(extension)) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    logger.error({
      ...getErrDetails(error),
      directory: dir,
      logContext: "Erreur lors du parcours du répertoire d'outils.",
    });
  }
  return files;
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
    for (const exportName in module) {
      const exportedItem = module[exportName];
      if (
        exportedItem &&
        typeof exportedItem === 'object' &&
        'name' in exportedItem &&
        'execute' in exportedItem
      ) {
        toolRegistry.register(exportedItem as Tool);
        loadedToolFiles.add(file);
        logger.info(
          `Outil chargé : '${exportedItem.name}' depuis ${path.basename(file)}`,
        );
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
  // Cette fonction est plus complexe avec un registre.
  // Pour l'instant, nous nous contentons de supprimer le fichier du cache.
  // Une implémentation plus robuste nécessiterait de mapper les fichiers aux outils.
  loadedToolFiles.delete(file);
  logger.info(`Fichier d'outil déchargé (chemin) : ${path.basename(file)}`);
  // Note: L'outil lui-même n'est pas retiré du registre pour le moment pour la simplicité.
}

function watchTools(): void {
  logger.info(
    `Démarrage de l'observateur de fichiers pour les outils générés dans: ${generatedToolsDir}`,
  );
  watcher = chokidar.watch(generatedToolsDir, {
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

  watcher.on('error', (error: Error) => {
    logger.error({
      ...getErrDetails(error),
      logContext: "Erreur de l'observateur de fichiers d'outils.",
    });
  });
}
