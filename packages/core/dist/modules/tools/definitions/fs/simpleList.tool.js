import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  init_esm_shims
} from "../../../../chunk-SB7UONON.js";

// src/modules/tools/definitions/fs/simpleList.tool.ts
init_esm_shims();
import { exec } from "child_process";
import { z } from "zod";
var simpleListParams = z.object({
  detailed: z.boolean().optional()
});
var simpleListOutput = z.string();
var simpleListTool = {
  description: "Provides a simple, non-detailed list of files and directories.",
  execute: async (params) => {
    return new Promise((resolve) => {
      const command = params.detailed ? "ls -la" : "ls -F";
      exec(command, (error, stdout, stderr) => {
        if (error) {
          resolve(`error: ${error.message}`);
          return;
        }
        if (stderr) {
          resolve(`stderr: ${stderr}`);
          return;
        }
        resolve(stdout);
      });
    });
  },
  name: "simpleList",
  parameters: simpleListParams
};
export {
  simpleListOutput,
  simpleListParams,
  simpleListTool
};
