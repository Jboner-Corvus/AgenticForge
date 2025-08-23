import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  config
} from "./chunk-DVHMHG4X.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/modules/tools/definitions/fs/editFile.tool.ts
init_esm_shims();
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";
var editFileParams = z.object({
  content_to_replace: z.string().describe("The exact content or regex pattern to find and replace."),
  is_regex: z.boolean().optional().describe("Set to true if content_to_replace is a regex."),
  new_content: z.string().describe("The new content that will replace the old content."),
  path: z.string().describe("The path to the file to edit inside the workspace.")
});
var editFileOutput = z.union([
  z.object({
    message: z.string(),
    modified_content: z.string().optional(),
    original_content: z.string().optional(),
    success: z.boolean()
  }),
  z.object({
    erreur: z.string()
  })
]);
var editFileTool = {
  description: "Replaces specific content within an existing file in the workspace. Ideal for targeted changes.",
  execute: async (args, ctx) => {
    const absolutePath = path.resolve(config.WORKSPACE_PATH, args.path);
    if (!absolutePath.startsWith(config.WORKSPACE_PATH)) {
      return {
        erreur: "File path is outside the allowed workspace directory."
      };
    }
    try {
      const originalContent = await fs.readFile(absolutePath, "utf-8");
      let modifiedContent;
      const useRegex = args.is_regex ?? false;
      if (useRegex) {
        const regex = new RegExp(args.content_to_replace, "g");
        modifiedContent = originalContent.replace(regex, args.new_content);
      } else {
        modifiedContent = originalContent.split(args.content_to_replace).join(args.new_content);
      }
      if (originalContent === modifiedContent) {
        return {
          message: `No changes were needed in ${args.path}. The content was already correct.`,
          success: true
        };
      }
      await fs.writeFile(absolutePath, modifiedContent, "utf-8");
      const successMessage = `Successfully edited content in ${args.path}.`;
      ctx.log.info(successMessage);
      return {
        message: successMessage,
        modified_content: modifiedContent,
        original_content: originalContent,
        success: true
      };
    } catch (error) {
      if (error.code === "ENOENT") {
        return { erreur: `File not found at path: ${args.path}` };
      }
      ctx.log.error(
        `Failed to edit file: ${args.path}. Error: ${error.message}`
      );
      return {
        erreur: `Could not edit file: ${error.message || error}`
      };
    }
  },
  name: "editFile",
  parameters: editFileParams
};

export {
  editFileParams,
  editFileOutput,
  editFileTool
};
