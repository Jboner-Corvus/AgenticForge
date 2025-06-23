// src/utils/toolLoader.ts
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Tool } from '../types.js';
import logger from '../logger.js';
import { getErrDetails } from './errorUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache pour stocker les outils une fois chargés
let loadedTools: Tool[] | null = null;

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
      logContext: "Erreur lors du parcours du répertoire d'outils.",
      directory: dir,
    });
  }
  return files;
}

/**
 * Charge dynamiquement tous les outils disponibles. (Fonction interne)
 * @returns Une promesse qui se résout avec un tableau de tous les outils chargés.
 */
async function _internalLoadTools(): Promise<Tool[]> {
  const runningInDist = __dirname.includes('dist');
  const fileExtension = runningInDist ? '.tool.js' : '.tool.ts';
  const toolsDir = runningInDist
    ? path.join(__dirname, '..', 'tools')
    : path.resolve(process.cwd(), 'src/tools');

  const toolFiles = await findToolFiles(toolsDir, fileExtension);
  const allTools: Tool[] = [];

  logger.info(
    `Début du chargement dynamique des outils depuis: ${toolsDir} (recherche de *${fileExtension})`,
  );

  for (const file of toolFiles) {
    try {
      const module = await import(path.resolve(file));
      for (const exportName in module) {
        const exportedItem = module[exportName];
        if (
          exportedItem &&
          typeof exportedItem === 'object' &&
          'name' in exportedItem &&
          'execute' in exportedItem
        ) {
          allTools.push(exportedItem as Tool);
          logger.info(
            `Outil chargé : '${exportedItem.name}' depuis ${path.basename(file)}`,
          );
        }
      }
    } catch (error) {
      logger.error({
        ...getErrDetails(error),
        logContext: `Échec du chargement dynamique du fichier d'outil.`,
        file,
      });
    }
  }
  logger.info(`${allTools.length} outils ont été chargés dynamiquement.`);
  return allTools;
}

/**
 * Récupère la liste de tous les outils, en les chargeant s'ils ne le sont pas déjà.
 * C'est la fonction à utiliser dans toute l'application pour garantir une seule source de vérité.
 */
export async function getTools(): Promise<Tool[]> {
  if (loadedTools === null) {
    loadedTools = await _internalLoadTools();
  }
  return loadedTools;
}
