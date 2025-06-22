// src/utils/toolLoader.ts
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'; // <--- AJOUT IMPORTANT
import type { Tool } from '../types.js';
import logger from '../logger.js';
import { getErrDetails } from './errorUtils.js';

// --- AJOUTS IMPORTANTS POUR LA COMPATIBILITÉ ES MODULES ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// ---------------------------------------------------------

const TOOLS_DIR = path.resolve(process.cwd(), 'src/tools');

/**
 * Trouve récursivement tous les fichiers d'outils (finissant par .tool.ts) dans un répertoire.
 * @param dir Le répertoire de départ.
 * @returns Une promesse qui se résout avec une liste de chemins de fichiers.
 */
async function findToolFiles(dir: string): Promise<string[]> {
  let files: string[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(await findToolFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.tool.ts')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // CORRECTION: Le message est maintenant fourni par getErrDetails.
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
  // --- CORRECTION DE LA LOGIQUE D'ORIGINE ---
  // La logique `runningInDist` est maintenant fiable grâce à la définition de `__dirname`
  const runningInDist = __dirname.includes('dist');
  const toolsDirRelative = runningInDist
    ? path.join(__dirname, '..', 'tools')
    : TOOLS_DIR;

  const toolFiles = await findToolFiles(toolsDirRelative);
  const allTools: Tool[] = [];

  logger.info(
    `Début du chargement dynamique des outils depuis: ${toolsDirRelative}`,
  );

  for (const file of toolFiles) {
    try {
      const module = await import(file);
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
      // CORRECTION: Le message est maintenant fourni par getErrDetails.
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