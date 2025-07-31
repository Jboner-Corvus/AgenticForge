import * as chokidar from 'chokidar';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

import { getLogger } from '../logger.js';
import { toolRegistry } from '../modules/tools/toolRegistry.js';
import { Tool } from '../types.js';
import { getErrDetails } from './errorUtils.js';

// Schéma Zod pour valider la structure d'un outil
const toolSchema = z.object({
  description: z.string(),
  execute: z.unknown(),
  name: z.string(),
  parameters: z.unknown(), // We expect a ZodObject, but z.any() is used here to avoid circular dependencies with ZodObject type
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache pour stocker les chemins des fichiers d'outils chargés pour éviter les doublons
const loadedToolFiles = new Set<string>();
const fileToToolNameMap = new Map<string, string>();
let watcher: chokidar.FSWatcher | null = null;

const runningInDist = process.env.NODE_ENV === 'production';
export const fileExtension = runningInDist ? '.tool.js' : '.tool.ts';

/**
 * Charge dynamiquement tous les outils disponibles. (Fonction interne)
 * @returns Une promesse qui se résout avec un tableau de tous les outils chargés.
 */
export async function _internalLoadTools(): Promise<void> {
  getLogger().info(`[_internalLoadTools] Starting to load tools dynamically.`);
  const toolsDir = getToolsDir();

  let toolFiles: string[] = []; // Declare toolFiles here
  try {
    toolFiles = await findToolFiles(toolsDir, fileExtension);

    getLogger().info(
      `[_internalLoadTools] Found tool files: ${toolFiles.join(', ')}`,
    );
    for (const file of toolFiles) {
      getLogger().info(
        `[_internalLoadTools] Attempting to load tool file: ${file}`,
      );
      await loadToolFile(file);
      getLogger().info(
        `[_internalLoadTools] Successfully loaded tool file: ${file}`,
      );
    }
  } catch (error) {
    getLogger().error({
      ...getErrDetails(error),
      logContext:
        '[_internalLoadTools] Error during tool file discovery or loading.',
    });
    throw error; // Re-throw to ensure the error is propagated
  }
  getLogger().info(
    `${toolRegistry.getAll().length} tools have been loaded dynamically.`,
  );
}

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

// Fonction pour obtenir dynamiquement le répertoire des outils
export function getToolsDir(): string {
  getLogger().debug(`[getToolsDir] Running in dist: ${runningInDist}`);
  getLogger().debug(`[getToolsDir] __dirname: ${__dirname}`);
  const toolsPath =
    process.env.TOOLS_PATH ||
    (runningInDist
      ? path.join(__dirname, '..', 'modules', 'tools', 'definitions')
      : path.resolve(__dirname, '..', 'modules', 'tools', 'definitions'));
  getLogger().debug(`[getToolsDir] Constructed tools path: ${toolsPath}`);
  return toolsPath;
}

/**
 * Trouve récursivement les fichiers d'outils. (Fonction interne)
 */
async function findToolFiles(
  dir: string,
  extension: string,
): Promise<string[]> {
  let files: string[] = [];

  getLogger().info(`[findToolFiles] Scanning directory: ${dir}`);
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
    const errDetails = getErrDetails(error);
    getLogger().error({
      ...errDetails,
      directory: dir,
      logContext: "Erreur lors du parcours du répertoire d'outils.",
    });

    // Re-throw ENOENT errors as they indicate a missing tools directory,
    // which should be a fatal error for the application.
    throw new Error(
      `Impossible de lire le répertoire des outils '${dir}'. Détails: ${errDetails.message}`,
    );
  }

  return files;
}

async function loadToolFile(file: string): Promise<void> {
  try {
    // NOTE: The cache-busting query parameter is a simple solution for development
    // to ensure that the latest version of the tool is loaded on each restart.
    // For production, a more robust strategy like restarting the worker process
    // would be more reliable.
    const module = await import(`${path.resolve(file)}?update=${Date.now()}`);
    getLogger().info(
      { file, moduleExports: Object.keys(module) },
      `[loadToolFile] Loaded module`,
    );

    for (const exportName in module) {
      const exportedItem = module[exportName];

      // Only attempt to parse if it looks like a tool (has name and description properties)
      if (
        typeof exportedItem === 'object' &&
        exportedItem !== null &&
        'name' in exportedItem &&
        'description' in exportedItem
      ) {
        const parsedTool = toolSchema.safeParse(exportedItem);
        if (parsedTool.success) {
          const tool = parsedTool.data;
          getLogger().info(
            { file, toolName: exportedItem.name },
            `[loadToolFile] Registering tool`,
          );
          toolRegistry.register(tool as Tool);
          loadedToolFiles.add(file);
          fileToToolNameMap.set(file, tool.name);
        } else {
          getLogger().warn(
            { errors: parsedTool.error.issues, exportName, file },
            `[loadToolFile] Skipping invalid tool export due to schema mismatch.`,
          );
        }
      } else {
        getLogger().debug(
          { exportName, file },
          `[loadToolFile] Skipping non-tool export.`,
        );
      }
    }
  } catch (error) {
    getLogger().error({
      ...getErrDetails(error),
      file,
      logContext: `[loadToolFile] Failed to dynamically load tool file.`,
    });
  }
}

function watchTools() {
  const toolsDir = getToolsDir();
  getLogger().info(`[watchTools] Watching for tool changes in: ${toolsDir}`);

  watcher = chokidar.watch(
    `${toolsDir}/**/*.tool.${runningInDist ? 'js' : 'ts'}`,
    {
      ignored: /(^|[/\\])\../, // ignore dotfiles
      ignoreInitial: true, // Don't trigger add events on startup
      persistent: true,
    },
  );

  watcher.on('add', async (filePath) => {
    getLogger().info(`[watchTools] New tool file added: ${filePath}`);
    await loadToolFile(filePath);
  });

  watcher.on('change', async (filePath) => {
    getLogger().info(`[watchTools] Tool file changed: ${filePath}`);
    // Invalidate module cache for hot reloading
    // This is a simplified approach and might not work for all scenarios
    // For a robust solution, consider a custom module loader or process restart
    delete require.cache[require.resolve(filePath)];
    await loadToolFile(filePath);
  });

  watcher.on('unlink', (filePath) => {
    getLogger().info(`[watchTools] Tool file removed: ${filePath}`);
    const toolName = fileToToolNameMap.get(filePath);
    if (toolName) {
      toolRegistry.unregister(toolName);
      loadedToolFiles.delete(filePath);
      fileToToolNameMap.delete(filePath);
      getLogger().info(`[watchTools] Unregistered tool: ${toolName}`);
    }
  });

  watcher.on('error', (error) => {
    getLogger().error({ error }, '[watchTools] Watcher error');
  });

  watcher.on('ready', () => {
    getLogger().info('[watchTools] Initial scan complete. Ready for changes.');
  });
}
