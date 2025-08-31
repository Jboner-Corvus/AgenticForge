import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  finishTool
} from "./chunk-CZQPSXPM.js";
import {
  canvasConsoleFeedbackTool
} from "./chunk-7HL7RC6F.js";
import {
  clientConsoleTool
} from "./chunk-2BYQ2EEQ.js";
import {
  getTools
} from "./chunk-UKA2UHVC.js";
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
  tools.push(
    canvasConsoleFeedbackTool
  );
  return tools;
};

export {
  getAllTools
};
