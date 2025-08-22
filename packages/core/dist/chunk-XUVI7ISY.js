import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  config
} from "./chunk-6NLBXREQ.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/modules/tools/definitions/fs/listDirectory.tool.ts
init_esm_shims();
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";
var WORKSPACE_DIR = config.WORKER_WORKSPACE_PATH || config.HOST_PROJECT_PATH;
var listFilesParams = z.object({
  path: z.string().optional().describe(
    "The subdirectory to list within the project. Defaults to the root."
  )
});
var listFilesOutput = z.union([
  z.string(),
  z.object({
    erreur: z.string()
  })
]);
var listFilesTool = {
  description: "Lists files and directories within a specified path in the project.",
  execute: async (args, ctx) => {
    const listPath = args.path || ".";
    const targetDir = path.resolve(WORKSPACE_DIR, listPath);
    if (!targetDir.startsWith(WORKSPACE_DIR)) {
      return { erreur: "Path is outside the allowed project directory." };
    }
    try {
      const entries = await fs.readdir(targetDir, { withFileTypes: true });
      const fileList = entries.map(
        (entry) => entry.isDirectory() ? `${entry.name}/` : entry.name
      );
      const result = `Directory listing for '${listPath}':
- ${fileList.join("\n- ")}`;
      ctx.log.info(`Listed files in directory: ${targetDir}`);
      return fileList.length > 0 ? result : `Directory '${listPath}' is empty.`;
    } catch (error) {
      if (error.code === "ENOENT") {
        return {
          erreur: `Directory not found at path: ${listPath}`
        };
      }
      ctx.log.error(
        `Failed to list files in: ${targetDir}. Error: ${error.message}`
      );
      return {
        erreur: `Could not list files: ${error.message || error}`
      };
    }
  },
  name: "listFiles",
  parameters: listFilesParams
};

export {
  listFilesParams,
  listFilesOutput,
  listFilesTool
};
