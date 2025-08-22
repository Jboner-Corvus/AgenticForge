import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/modules/tools/definitions/system/finish.tool.ts
init_esm_shims();
import { z } from "zod";
var parameters = z.object({
  response: z.string().describe("The final, complete answer to the user.")
});
var finishOutput = z.string();
var FinishToolSignal = class extends Error {
  response;
  constructor(response) {
    super(response);
    this.name = "FinishToolSignal";
    this.response = response;
  }
};
var finishTool = {
  description: "Call this tool when the user's goal is accomplished.",
  execute: async (args, ctx) => {
    if (!args) {
      const message = "Invalid arguments provided to finishTool. A final answer is required.";
      ctx.log.error({ args }, `Error in finishTool: ${message}`);
      throw new Error(message);
    }
    const finalResponse = typeof args === "string" ? args : args.response;
    ctx.log.info(`Goal accomplished: ${finalResponse}`);
    throw new FinishToolSignal(finalResponse);
  },
  name: "finish",
  parameters
};

export {
  parameters,
  finishOutput,
  FinishToolSignal,
  finishTool
};
