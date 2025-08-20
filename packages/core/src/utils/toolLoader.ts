import * as chokidar from 'chokidar';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

import { getLogger } from '../logger.ts';
import { toolRegistry } from '../modules/tools/toolRegistry.ts';
import { Tool } from '../types.ts';
import { getErrDetails } from './errorUtils.ts';

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

const runningInDist = process.env.NODE_ENV === 'production' || __dirname.includes('dist');
export const fileExtension = runningInDist ? '.tool.js' : '.tool.ts';

/**
 * Charge dynamiquement tous les outils disponibles. (Fonction interne)
 * @returns Une promesse qui se résout avec un tableau de tous les outils chargés.
 */
export async function _internalLoadTools(): Promise<void> {
  console.log(`[_internalLoadTools] Starting to load tools dynamically.`);
  getLogger().info(`[_internalLoadTools] Starting to load tools dynamically.`);
  const toolsDir = getToolsDir();

  let toolFiles: string[] = []; // Declare toolFiles here
  try {
    toolFiles = await findToolFiles(toolsDir, fileExtension);

    console.log(
      `[_internalLoadTools] Found tool files: ${toolFiles.join(', ')}`
    );
    getLogger().info(
      `[_internalLoadTools] Found tool files: ${toolFiles.join(', ')}`,
    );
    for (const file of toolFiles) {
      console.log(`[GEMINI-DEBUG] Loading tool file: ${file}`);
      await loadToolFile(file);
      console.log(
        `[_internalLoadTools] Successfully loaded tool file: ${file}`
      );
      getLogger().info(
        `[_internalLoadTools] Successfully loaded tool file: ${file}`,
      );
    }
  } catch (error) {
    console.error({
      ...getErrDetails(error),
      logContext:
        '[_internalLoadTools] Error during tool file discovery or loading.',
    });
    getLogger().error({
      ...getErrDetails(error),
      logContext:
        '[_internalLoadTools] Error during tool file discovery or loading.',
    });
    throw error; // Re-throw to ensure the error is propagated
  }
  console.log(
    `${toolRegistry.getAll().length} tools have been loaded dynamically.`
  );
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
  // Check if TOOLS_PATH environment variable is set (used in tests)
  if (process.env.TOOLS_PATH) {
    console.log(`[getToolsDir] Using TOOLS_PATH: ${process.env.TOOLS_PATH}`);
    return process.env.TOOLS_PATH;
  }

  getLogger().debug(`[getToolsDir] Running in dist: ${runningInDist}`);
  getLogger().debug(`[getToolsDir] __dirname: ${__dirname}`);
  getLogger().debug(`[getToolsDir] process.cwd(): ${process.cwd()}`);
  getLogger().debug(
    `[getToolsDir] process.env.NODE_ENV: ${process.env.NODE_ENV}`,
  );

  // In production (dist), tools are in packages/core/dist/modules/tools/definitions
  // In development, they're in packages/core/src/modules/tools/definitions
  let toolsPath: string;
  
  if (runningInDist) {
    // When running in Docker or as a worker, we need to construct the path correctly
    // The worker runs from /home/demon/agentforge/AgenticForge2/AgenticForge
    // The tools are in /home/demon/agentforge/AgenticForge2/AgenticForge/packages/core/dist/modules/tools/definitions
    // Check if we're already in the packages/core directory
    if (process.cwd().endsWith('packages/core')) {
      toolsPath = path.resolve(process.cwd(), 'dist/modules/tools/definitions');
    } else {
      toolsPath = path.resolve(process.cwd(), 'packages/core/dist/modules/tools/definitions');
    }
  } else {
    // Check if we're already in the packages/core directory
    if (process.cwd().endsWith('packages/core')) {
      toolsPath = path.resolve(process.cwd(), 'src/modules/tools/definitions');
    } else {
      toolsPath = path.resolve(process.cwd(), 'packages/core/src/modules/tools/definitions');
    }
  }

  console.log(`[getToolsDir] Constructed tools path: ${toolsPath}`);
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
  console.log(`[findToolFiles] Scanning directory: ${dir}`);
  console.log(`[findToolFiles] Looking for files with extension: ${extension}`);
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    console.log(`[findToolFiles] Found ${entries.length} entries in directory`);

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      console.log(`[findToolFiles] Processing entry: ${entry.name}, isDirectory: ${entry.isDirectory()}, isFile: ${entry.isFile()}`);

      if (entry.isDirectory()) {
        files = files.concat(await findToolFiles(fullPath, extension));
      } else if (entry.isFile() && entry.name.endsWith(extension)) {
        console.log(`[findToolFiles] Found matching file: ${fullPath}`);
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
    console.log(`[findToolFiles] Error scanning directory: ${dir}`, error);

    throw error; // Re-throw to ensure the error is propagated
  }

  console.log(`[findToolFiles] Returning files: ${files.join(', ')}`);
  return files;
}

async function loadToolFile(file: string): Promise<void> {
  const logger = getLogger();
  logger.debug({ file }, `[loadToolFile] Attempting to load tool file.`);
  
  try {
    const module = await import(`${path.resolve(file)}?v=${Date.now()}`); // Cache-busting
    logger.debug(
      { file, moduleExports: Object.keys(module) },
      `[loadToolFile] Successfully imported module.`,
    );

    for (const exportName in module) {
      const exportedItem = module[exportName];

      if (
        typeof exportedItem === 'object' &&
        exportedItem !== null &&
        'name' in exportedItem
      ) {
        logger.debug(
          { exportName, file },
          `[loadToolFile] Found potential tool export.`,
        );
        
        // Valider l'objet avec Zod mais ne pas afficher les détails verbeux
        const parsedTool = toolSchema.safeParse(exportedItem);

        if (parsedTool.success) {
          const tool = parsedTool.data as Tool;
          toolRegistry.register(tool);
          loadedToolFiles.add(file);
          fileToToolNameMap.set(file, tool.name);
          logger.info(
            { file, toolName: tool.name },
            `[loadToolFile] Successfully registered tool.`,
          );
        } else {
          logger.warn(
            { 
              errors: parsedTool.error.issues.map(issue => ({
                message: issue.message,
                path: issue.path.join('.')
              })), 
              exportName, 
              file 
            },
            `[loadToolFile] Skipping invalid tool export due to Zod schema mismatch.`,
          );
        }
      } else {
        logger.debug(
          { exportName, file },
          `[loadToolFile] Skipping non-tool export.`,
        );
      }
    }
  } catch (error) {
    // Special handling for browser tool which might have Playwright issues
    if (file.includes('browser.tool')) {
      logger.warn({
        ...getErrDetails(error),
        file,
        logContext: `[loadToolFile] Failed to load browser tool (likely due to Playwright issues). This tool will be skipped.`,
      });
      return; // Skip this tool but continue loading others
    }
    
    logger.error({
      ...getErrDetails(error),
      file,
      logContext: `[loadToolFile] Failed to dynamically load or process tool file.`,
    });
  }
}

function watchTools() {
  const toolsDir = getToolsDir();
  const generatedToolsDir = path.join(
    process.cwd(),
    runningInDist ? 'dist/tools/generated' : 'packages/core/src/tools/generated'
  );
  
  getLogger().info(`[watchTools] Watching for tool changes in: ${toolsDir}`);
  getLogger().info(`[watchTools] Also watching generated tools in: ${generatedToolsDir}`);

  // Watch both the main tools directory and the generated tools directory
  watcher = chokidar.watch(
    [
      `${toolsDir}/**/*.tool.${runningInDist ? 'js' : 'ts'}`,
      `${generatedToolsDir}/**/*.tool.${runningInDist ? 'js' : 'ts'}`
    ],
    {
      ignored: /(^|\/|\\)\./, // ignore dotfiles
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
