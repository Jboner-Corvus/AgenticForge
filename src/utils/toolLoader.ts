// src/utils/toolLoader.ts
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Tool } from '../types.js';
import logger from '../logger.js';
import { getErrDetails } from './errorUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Trouve récursivement tous les fichiers d'outils (finissant par .tool.js ou .tool.ts) dans un répertoire.
 * @param dir Le répertoire de départ.
 * @param extension L'extension de fichier à rechercher.
 * @returns Une promesse qui se résout avec une liste de chemins de fichiers.
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
 * Charge dynamiquement tous les outils disponibles.
 * @returns Une promesse qui se résout avec un tableau de tous les outils chargés.
 */
export async function loadTools(): Promise<Tool[]> {
  const runningInDist = __dirname.includes('dist');
  // Cherche les .js si on est dans /dist, sinon les .ts
  const fileExtension = runningInDist ? '.tool.js' : '.tool.ts';

  // CORRIGÉ : Le chemin vers le répertoire des outils en production est maintenant correct.
  const toolsDir = runningInDist
    ? path.join(__dirname, '..', 'tools') // On remonte d'un niveau pour sortir de 'utils'
    : path.resolve(process.cwd(), 'src/tools');

  const toolFiles = await findToolFiles(toolsDir, fileExtension);
  const allTools: Tool[] = [];

  logger.info(
    `Début du chargement dynamique des outils depuis: ${toolsDir} (recherche de *${fileExtension})`,
  );

  for (const file of toolFiles) {
    try {
      // Pour ESM, l'import path doit être un chemin de fichier valide
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
