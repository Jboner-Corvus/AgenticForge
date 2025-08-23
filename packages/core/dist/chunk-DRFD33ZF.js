import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  config
} from "./chunk-DVHMHG4X.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/modules/tools/definitions/fs/readFile.tool.ts
init_esm_shims();
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";
var readFileParams = z.object({
  end_line: z.number().int().positive().max(1e5, "Ligne de fin trop \xE9lev\xE9e (max 100000)").optional().describe("The line number to stop reading at (inclusive)."),
  path: z.string().min(1, "Le chemin ne peut pas \xEAtre vide").max(500, "Le chemin ne peut pas d\xE9passer 500 caract\xE8res").refine(
    (path2) => !path2.includes(".."),
    'Le chemin ne peut pas contenir ".." pour des raisons de s\xE9curit\xE9'
  ).refine(
    (path2) => !/[<>:"|?*\x00-\x1f]/.test(path2),
    "Le chemin contient des caract\xE8res invalides"
  ).describe(
    "The path to the file inside the workspace or AgenticForge directory."
  ),
  start_line: z.number().int().positive().max(1e5, "Ligne de d\xE9but trop \xE9lev\xE9e (max 100000)").optional().describe("The line number to start reading from (1-indexed).")
});
var readFileOutput = z.union([
  z.string(),
  z.object({
    erreur: z.string()
  })
]);
var readFileTool = {
  description: 'Reads the content of a file from the workspace or AgenticForge directory. Use this to "open", "view", or "check" a file.',
  execute: async (args, ctx) => {
    if (args.start_line && args.end_line && args.start_line > args.end_line) {
      return {
        erreur: "La ligne de d\xE9but ne peut pas \xEAtre sup\xE9rieure \xE0 la ligne de fin"
      };
    }
    let resolvedPath = path.resolve(
      path.join(config.WORKSPACE_PATH, args.path)
    );
    let pathFound = false;
    try {
      await fs.access(resolvedPath);
      pathFound = true;
    } catch {
      const agenticForgePath = path.resolve(
        path.join(config.HOST_PROJECT_PATH, args.path)
      );
      try {
        await fs.access(agenticForgePath);
        resolvedPath = agenticForgePath;
        pathFound = true;
      } catch {
      }
    }
    const workspaceResolved = path.resolve(config.WORKSPACE_PATH);
    const hostProjectResolved = path.resolve(config.HOST_PROJECT_PATH);
    const isAllowedPath = resolvedPath.startsWith(workspaceResolved) || resolvedPath.startsWith(hostProjectResolved);
    if (!isAllowedPath) {
      return {
        erreur: "Chemin de fichier en dehors des r\xE9pertoires autoris\xE9s (workspace ou AgenticForge)."
      };
    }
    try {
      const stats = await fs.stat(resolvedPath);
      const maxFileSize = 100 * 1024 * 1024;
      if (stats.size > maxFileSize) {
        return {
          erreur: `Fichier trop volumineux (${Math.round(stats.size / 1024 / 1024)}MB). Taille maximale: ${Math.round(maxFileSize / 1024 / 1024)}MB`
        };
      }
      const content = await fs.readFile(resolvedPath, "utf-8");
      ctx.log.info(
        `Successfully read file: ${args.path} (${stats.size} bytes)`
      );
      if (args.start_line !== void 0) {
        const lines = content.split("\n");
        const totalLines = lines.length;
        if (args.start_line > totalLines) {
          return {
            erreur: `Ligne de d\xE9but (${args.start_line}) sup\xE9rieure au nombre total de lignes (${totalLines})`
          };
        }
        const start = Math.max(0, args.start_line - 1);
        const end = Math.min(totalLines, args.end_line ?? start + 1);
        const snippet = lines.slice(start, end).join("\n");
        ctx.log.info(
          `Extracted lines ${args.start_line} to ${end} from ${args.path}`
        );
        return snippet;
      }
      if (content.length > 5 * 1024 * 1024) {
        const preview = content.substring(0, 5 * 1024 * 1024);
        ctx.log.warn(
          `File too large for full display, showing first 5MB of ${args.path}`
        );
        return preview + "\n\n[... Fichier tronqu\xE9 - trop volumineux pour affichage complet ...]";
      }
      return content;
    } catch (error) {
      const nodeError = error;
      let errorMessage = "Erreur inconnue lors de la lecture du fichier";
      if (nodeError.code === "ENOENT") {
        errorMessage = `Fichier non trouv\xE9: ${args.path}`;
      } else if (nodeError.code === "EACCES") {
        errorMessage = "Permission refus\xE9e pour lire le fichier";
      } else if (nodeError.code === "EISDIR") {
        errorMessage = "Le chemin sp\xE9cifi\xE9 est un r\xE9pertoire, pas un fichier";
      } else if (nodeError.code === "EMFILE" || nodeError.code === "ENFILE") {
        errorMessage = "Trop de fichiers ouverts simultan\xE9ment";
      } else if (nodeError.message) {
        errorMessage = `Erreur de lecture: ${nodeError.message}`;
      }
      ctx.log.error({ err: error }, `Failed to read file: ${args.path}`);
      return { erreur: errorMessage };
    }
  },
  name: "readFile",
  parameters: readFileParams
};

export {
  readFileParams,
  readFileOutput,
  readFileTool
};
