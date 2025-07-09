import * as chokidar from 'chokidar';
// src/utils/toolLoader.ts
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import logger from '../logger.js';
import { getErrDetails } from './errorUtils.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Cache pour stocker les outils une fois chargés
const loadedTools = new Map();
let toolsArray = [];
let watcher = null;
const runningInDist = __dirname.includes('dist');
const fileExtension = runningInDist ? '.tool.js' : '.tool.ts';
const toolsDir =
  process.env.TOOLS_PATH ||
  (runningInDist
    ? path.join(__dirname, 'tools')
    : path.resolve(process.cwd(), 'packages/core/src/tools'));
const generatedToolsDir = path.join(toolsDir, 'generated');
/**
 * Récupère la liste de tous les outils, en les chargeant s'ils ne le sont pas déjà.
 * C'est la fonction à utiliser dans toute l'application pour garantir une seule source de vérité.
 */
export async function getTools() {
  if (loadedTools.size === 0 && toolsArray.length === 0) {
    await _internalLoadTools();
    if (!watcher) {
      watchTools();
    }
  }
  return toolsArray;
}
/**
 * Charge dynamiquement tous les outils disponibles. (Fonction interne)
 * @returns Une promesse qui se résout avec un tableau de tous les outils chargés.
 */
async function _internalLoadTools() {
  loadedTools.clear();
  toolsArray = [];
  const toolFiles = await findToolFiles(toolsDir, fileExtension);
  logger.info(
    `Début du chargement dynamique des outils depuis: ${toolsDir} (recherche de *${fileExtension})`,
  );
  for (const file of toolFiles) {
    await loadToolFile(file);
  }
  logger.info(`${loadedTools.size} outils ont été chargés dynamiquement.`);
  toolsArray = Array.from(loadedTools.values());
}
/**
 * Trouve récursivement les fichiers d'outils. (Fonction interne)
 */
async function findToolFiles(dir, extension) {
  let files = [];
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
async function loadToolFile(file) {
  try {
    // Invalidate module cache for dynamic loading
    if (process.env.NODE_ENV === 'development') {
      const resolvedPath = path.resolve(file);

      delete global._moduleCache?.[resolvedPath];
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
        loadedTools.set(file, exportedItem);
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
function unloadToolFile(file) {
  if (loadedTools.has(file)) {
    const tool = loadedTools.get(file);
    loadedTools.delete(file);
    toolsArray = Array.from(loadedTools.values());
    logger.info(
      `Outil déchargé : '${tool?.name}' depuis ${path.basename(file)}`,
    );
  }
}
function watchTools() {
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
    toolsArray = Array.from(loadedTools.values());
  });
  watcher.on('change', async (filePath) => {
    logger.info(`Fichier d'outil modifié détecté: ${filePath}`);
    unloadToolFile(filePath);
    await loadToolFile(filePath);
    toolsArray = Array.from(loadedTools.values());
  });
  watcher.on('unlink', (filePath) => {
    logger.info(`Fichier d'outil supprimé détecté: ${filePath}`);
    unloadToolFile(filePath);
  });
  watcher.on('error', (error) => {
    logger.error({
      ...getErrDetails(error),
      logContext: "Erreur de l'observateur de fichiers d'outils.",
    });
  });
}
//# sourceMappingURL=toolLoader.js.map
