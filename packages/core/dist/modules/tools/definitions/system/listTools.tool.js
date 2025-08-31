import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  getTools
} from "../../../../chunk-UKA2UHVC.js";
import "../../../../chunk-BWJHSBST.js";
import "../../../../chunk-IYTI6RLF.js";
import "../../../../chunk-RAPMUUPI.js";
import {
  init_esm_shims
} from "../../../../chunk-SB7UONON.js";

// src/modules/tools/definitions/system/listTools.tool.ts
init_esm_shims();
import { z } from "zod";
var parameters = z.object({});
var listToolsOutput = z.union([
  z.object({
    tools: z.array(z.string())
  }),
  z.object({
    erreur: z.string()
  })
]);
var listToolsTool = {
  description: "Lists all available tools.",
  execute: async (_args, _ctx) => {
    try {
      const allTools = await getTools();
      const toolNames = allTools.map((tool) => tool.name);
      return {
        tools: toolNames
      };
    } catch (error) {
      _ctx.log.error({ err: error }, `Error in listToolsTool`);
      return {
        erreur: `An unexpected error occurred: ${error.message || error}`
      };
    }
  },
  name: "listTools",
  output: listToolsOutput,
  parameters
};
export {
  listToolsOutput,
  listToolsTool,
  parameters
};
