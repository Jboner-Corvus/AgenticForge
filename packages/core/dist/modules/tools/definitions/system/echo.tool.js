import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  init_esm_shims
} from "../../../../chunk-SB7UONON.js";

// src/modules/tools/definitions/system/echo.tool.ts
init_esm_shims();
import { z } from "zod";
var echoToolParams = z.object({
  message: z.string().describe("The message to echo back")
});
var echoTool = {
  description: "Echoes back the provided message",
  execute: async (args) => {
    return `Echo: ${args.message}`;
  },
  name: "echo",
  parameters: echoToolParams
};
export {
  echoTool,
  echoToolParams
};
