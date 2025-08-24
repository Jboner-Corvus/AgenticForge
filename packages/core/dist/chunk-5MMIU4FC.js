import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  finishTool
} from "./chunk-CZQPSXPM.js";
import {
  getTools
} from "./chunk-IWE6TWGQ.js";
import {
  clientConsoleTool
} from "./chunk-AKPOKJ5Q.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/modules/tools/definitions/index.ts
init_esm_shims();
var getAllTools = async () => {
  console.log("[getAllTools] function called");
  const tools = await getTools();
  tools.push(finishTool);
  tools.push(
    clientConsoleTool
  );
  return tools;
};

export {
  getAllTools
};
