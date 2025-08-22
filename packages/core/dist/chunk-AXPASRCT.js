import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  config
} from "./chunk-6NLBXREQ.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/modules/tools/definitions/fs/writeFile.tool.ts
init_esm_shims();
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";
var writeFileParams = z.object({
  content: z.string().max(50 * 1024 * 1024, "Le contenu ne peut pas d\xE9passer 50MB").describe("The full content to write to the file."),
  path: z.string().min(1, "Le chemin ne peut pas \xEAtre vide").max(255, "Le chemin ne peut pas d\xE9passer 255 caract\xE8res").refine(
    (path2) => !path2.includes(".."),
    'Le chemin ne peut pas contenir ".." pour des raisons de s\xE9curit\xE9'
  ).refine(
    (path2) => !/^\//.test(path2),
    'Le chemin doit \xEAtre relatif (ne pas commencer par "/")'
  ).refine(
    (path2) => !/[<>:"|?*\x00-\x1f]/.test(path2),
    "Le chemin contient des caract\xE8res invalides"
  ).describe(
    "The path to the file inside the workspace. Will be created if it does not exist."
  )
});
var WriteFileSuccessOutput = z.object({
  message: z.string()
});
var WriteFileErrorOutput = z.object({
  erreur: z.string()
});
var writeFileOutput = z.union([
  WriteFileSuccessOutput,
  WriteFileErrorOutput
]);
var writeFile = {
  description: "Writes content to a file, overwriting it. Creates the file and directories if they do not exist.",
  execute: async (args, ctx) => {
    try {
      if (!config.WORKSPACE_PATH) {
        throw new Error("WORKSPACE_PATH non configur\xE9 dans la configuration");
      }
      const absolutePath = path.resolve(path.join(config.WORKSPACE_PATH, args.path));
      if (!absolutePath.startsWith(path.resolve(config.WORKSPACE_PATH))) {
        return {
          erreur: "Chemin de fichier en dehors du r\xE9pertoire de travail autoris\xE9."
        };
      }
      const parentDir = path.dirname(absolutePath);
      if (!parentDir.startsWith(path.resolve(config.WORKSPACE_PATH))) {
        return {
          erreur: "R\xE9pertoire parent en dehors de l'espace de travail autoris\xE9."
        };
      }
      if (args.content.length < 1024 * 1024) {
        if (await fs.stat(absolutePath).then(() => true).catch(() => false)) {
          const currentContent = await fs.readFile(absolutePath, "utf-8");
          if (currentContent === args.content) {
            const message = `File ${args.path} already contains the desired content. No changes made.`;
            ctx.log.info(message);
            return { message };
          }
        }
      }
      await fs.mkdir(path.dirname(absolutePath), { recursive: true }).catch(console.error);
      await fs.writeFile(absolutePath, args.content, "utf-8");
      const successMessage = `Successfully wrote content to ${args.path}.`;
      ctx.log.info(successMessage);
      return { message: successMessage };
    } catch (error) {
      ctx.log.error({ err: error }, `Failed to write file: ${args.path}`);
      let errorMessage = "Erreur inconnue lors de l'\xE9criture du fichier";
      if (error instanceof Error) {
        const nodeError = error;
        if (nodeError.code === "EACCES") {
          errorMessage = "Permission refus\xE9e pour \xE9crire le fichier";
        } else if (nodeError.code === "ENOSPC") {
          errorMessage = "Espace disque insuffisant";
        } else if (nodeError.code === "EMFILE" || nodeError.code === "ENFILE") {
          errorMessage = "Trop de fichiers ouverts simultan\xE9ment";
        } else if (nodeError.code === "ENOTDIR") {
          errorMessage = "Un \xE9l\xE9ment du chemin n'est pas un r\xE9pertoire";
        } else {
          errorMessage = `Erreur d'\xE9criture: ${nodeError.message}`;
        }
      }
      return {
        erreur: errorMessage
      };
    }
  },
  name: "writeFile",
  parameters: writeFileParams
};

export {
  writeFileParams,
  WriteFileSuccessOutput,
  WriteFileErrorOutput,
  writeFileOutput,
  writeFile
};
