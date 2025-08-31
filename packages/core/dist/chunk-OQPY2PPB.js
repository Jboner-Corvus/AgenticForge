import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  finishTool
} from "./chunk-CZQPSXPM.js";
import {
  clientConsoleTool
} from "./chunk-2XD4DXR2.js";
import {
  getTools
} from "./chunk-O4UTPZIK.js";
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
