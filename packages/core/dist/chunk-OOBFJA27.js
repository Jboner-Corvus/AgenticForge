import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  canvasConsoleFeedbackTool
} from "./chunk-DU33BEDB.js";
import {
  finishTool
} from "./chunk-CZQPSXPM.js";
import {
  getTools
} from "./chunk-Y2RPXT4B.js";
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
    canvasConsoleFeedbackTool
  );
  return tools;
};

export {
  getAllTools
};
