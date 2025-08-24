import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  getErrDetails,
  toolRegistry
} from "./chunk-SJT2WBJG.js";
import {
  getLogger
} from "./chunk-5JE7E5SU.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/utils/toolLoader.ts
init_esm_shims();
import * as chokidar from "chokidar";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
var toolSchema = z.object({
  description: z.string(),
  execute: z.unknown(),
  name: z.string(),
  parameters: z.unknown()
  // We expect a ZodObject, but z.any() is used here to avoid circular dependencies with ZodObject type
});
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var loadedToolFiles = /* @__PURE__ */ new Set();
var fileToToolNameMap = /* @__PURE__ */ new Map();
var watcher = null;
var runningInDist = process.env.NODE_ENV === "production" || __dirname.includes("dist");
var fileExtension = runningInDist ? ".tool.js" : ".tool.ts";
async function _internalLoadTools() {
  console.log(`[_internalLoadTools] Starting to load tools dynamically.`);
  getLogger().info(`[_internalLoadTools] Starting to load tools dynamically.`);
  const toolsDir = getToolsDir();
  let toolFiles = [];
  try {
    toolFiles = await findToolFiles(toolsDir, fileExtension);
    console.log(
      `[_internalLoadTools] Found tool files: ${toolFiles.join(", ")}`
    );
    getLogger().info(
      `[_internalLoadTools] Found tool files: ${toolFiles.join(", ")}`
    );
    for (const file of toolFiles) {
      if (loadedToolFiles.has(file)) {
        console.log(`[_internalLoadTools] File already loaded, skipping: ${file}`);
        getLogger().debug({ file }, `[_internalLoadTools] File already loaded, skipping.`);
        continue;
      }
      console.log(`[GEMINI-DEBUG] Loading tool file: ${file}`);
      await loadToolFile(file);
      console.log(
        `[_internalLoadTools] Successfully loaded tool file: ${file}`
      );
      getLogger().info(
        `[_internalLoadTools] Successfully loaded tool file: ${file}`
      );
    }
  } catch (error) {
    console.error({
      ...getErrDetails(error),
      logContext: "[_internalLoadTools] Error during tool file discovery or loading."
    });
    getLogger().error({
      ...getErrDetails(error),
      logContext: "[_internalLoadTools] Error during tool file discovery or loading."
    });
    throw error;
  }
  console.log(
    `${toolRegistry.getAll().length} tools have been loaded dynamically.`
  );
  getLogger().info(
    `${toolRegistry.getAll().length} tools have been loaded dynamically.`
  );
}
function _resetTools() {
  loadedToolFiles.clear();
  fileToToolNameMap.clear();
  if (watcher) {
    watcher.close();
    watcher = null;
  }
}
async function getTools() {
  if (loadedToolFiles.size === 0) {
    await _internalLoadTools();
    if (!watcher) {
      watchTools();
    }
  }
  return toolRegistry.getAll();
}
function getToolsDir() {
  if (process.env.TOOLS_PATH) {
    console.log(`[getToolsDir] Using TOOLS_PATH: ${process.env.TOOLS_PATH}`);
    return process.env.TOOLS_PATH;
  }
  getLogger().debug(`[getToolsDir] Running in dist: ${runningInDist}`);
  getLogger().debug(`[getToolsDir] __dirname: ${__dirname}`);
  getLogger().debug(`[getToolsDir] process.cwd(): ${process.cwd()}`);
  getLogger().debug(
    `[getToolsDir] process.env.NODE_ENV: ${process.env.NODE_ENV}`
  );
  let toolsPath;
  if (runningInDist) {
    if (process.cwd().endsWith("packages/core")) {
      toolsPath = path.resolve(process.cwd(), "dist/modules/tools/definitions");
    } else {
      toolsPath = path.resolve(
        process.cwd(),
        "packages/core/dist/modules/tools/definitions"
      );
    }
  } else {
    if (process.cwd().endsWith("packages/core")) {
      toolsPath = path.resolve(process.cwd(), "src/modules/tools/definitions");
    } else {
      toolsPath = path.resolve(
        process.cwd(),
        "packages/core/src/modules/tools/definitions"
      );
    }
  }
  console.log(`[getToolsDir] Constructed tools path: ${toolsPath}`);
  getLogger().debug(`[getToolsDir] Constructed tools path: ${toolsPath}`);
  return toolsPath;
}
async function findToolFiles(dir, extension) {
  let files = [];
  getLogger().info(`[findToolFiles] Scanning directory: ${dir}`);
  console.log(`[findToolFiles] Scanning directory: ${dir}`);
  console.log(`[findToolFiles] Looking for files with extension: ${extension}`);
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    console.log(`[findToolFiles] Found ${entries.length} entries in directory`);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      console.log(
        `[findToolFiles] Processing entry: ${entry.name}, isDirectory: ${entry.isDirectory()}, isFile: ${entry.isFile()}`
      );
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
      logContext: "Erreur lors du parcours du r\xE9pertoire d'outils."
    });
    console.log(`[findToolFiles] Error scanning directory: ${dir}`, error);
    throw error;
  }
  console.log(`[findToolFiles] Returning files: ${files.join(", ")}`);
  return files;
}
async function loadToolFile(file) {
  const logger = getLogger();
  logger.debug({ file }, `[loadToolFile] Attempting to load tool file.`);
  try {
    const module = await import(`${path.resolve(file)}?v=${Date.now()}`);
    logger.debug(
      { file, moduleExports: Object.keys(module) },
      `[loadToolFile] Successfully imported module.`
    );
    for (const exportName in module) {
      const exportedItem = module[exportName];
      if (typeof exportedItem === "object" && exportedItem !== null && "name" in exportedItem) {
        logger.debug(
          { exportName, file },
          `[loadToolFile] Found potential tool export.`
        );
        const parsedTool = toolSchema.safeParse(exportedItem);
        if (parsedTool.success) {
          const tool = parsedTool.data;
          if (toolRegistry.get(tool.name)) {
            logger.warn(
              { file, toolName: tool.name },
              `[loadToolFile] Tool with name ${tool.name} already registered, skipping.`
            );
            continue;
          }
          toolRegistry.register(tool);
          loadedToolFiles.add(file);
          fileToToolNameMap.set(file, tool.name);
          logger.info(
            { file, toolName: tool.name },
            `[loadToolFile] Successfully registered tool.`
          );
        } else {
          logger.warn(
            {
              errors: parsedTool.error.issues.map((issue) => ({
                message: issue.message,
                path: issue.path.join(".")
              })),
              exportName,
              file
            },
            `[loadToolFile] Skipping invalid tool export due to Zod schema mismatch.`
          );
        }
      } else {
        logger.debug(
          { exportName, file },
          `[loadToolFile] Skipping non-tool export.`
        );
      }
    }
  } catch (error) {
    if (file.includes("browser.tool")) {
      logger.warn({
        ...getErrDetails(error),
        file,
        logContext: `[loadToolFile] Failed to load browser tool (likely due to Playwright issues). This tool will be skipped.`
      });
      return;
    }
    logger.error({
      ...getErrDetails(error),
      file,
      logContext: `[loadToolFile] Failed to dynamically load or process tool file.`
    });
  }
}
function watchTools() {
  const toolsDir = getToolsDir();
  const generatedToolsDir = path.join(
    process.cwd(),
    runningInDist ? "packages/core/dist/tools/generated" : "packages/core/src/tools/generated"
  );
  getLogger().info(`[watchTools] Watching for tool changes in: ${toolsDir}`);
  getLogger().info(
    `[watchTools] Also watching generated tools in: ${generatedToolsDir}`
  );
  watcher = chokidar.watch(
    [
      `${toolsDir}/**/*.tool.${runningInDist ? "js" : "ts"}`,
      `${generatedToolsDir}/**/*.tool.${runningInDist ? "js" : "ts"}`
    ],
    {
      ignored: /(^|\/|\\)\./,
      // ignore dotfiles
      ignoreInitial: true,
      // Don't trigger add events on startup
      persistent: true
    }
  );
  watcher.on("add", async (filePath) => {
    getLogger().info(`[watchTools] New tool file added: ${filePath}`);
    await loadToolFile(filePath);
  });
  watcher.on("change", async (filePath) => {
    getLogger().info(`[watchTools] Tool file changed: ${filePath}`);
    await loadToolFile(filePath);
  });
  watcher.on("unlink", (filePath) => {
    getLogger().info(`[watchTools] Tool file removed: ${filePath}`);
    const toolName = fileToToolNameMap.get(filePath);
    if (toolName) {
      toolRegistry.unregister(toolName);
      loadedToolFiles.delete(filePath);
      fileToToolNameMap.delete(filePath);
      getLogger().info(`[watchTools] Unregistered tool: ${toolName}`);
    }
  });
  watcher.on("error", (error) => {
    getLogger().error({ error }, "[watchTools] Watcher error");
  });
  watcher.on("ready", () => {
    getLogger().info("[watchTools] Initial scan complete. Ready for changes.");
  });
}

export {
  fileExtension,
  _internalLoadTools,
  _resetTools,
  getTools,
  getToolsDir
};
