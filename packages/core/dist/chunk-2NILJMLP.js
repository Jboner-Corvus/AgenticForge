import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/modules/tools/definitions/system/agentResponse.tool.ts
init_esm_shims();
import { z } from "zod";
var agentResponseParams = z.object({
  response: z.string().describe("The response to send to the user.")
});
var agentResponseTool = {
  description: "Responds to the user.",
  execute: async (args, ctx) => {
    ctx.log.info("Responding to user", { args });
    return args.response;
  },
  name: "agentResponse",
  parameters: agentResponseParams
};

export {
  agentResponseTool
};
