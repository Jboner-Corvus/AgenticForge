import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  AppError,
  UserError
} from "./chunk-LCH7Z4UB.js";
import {
  getLoggerInstance
} from "./chunk-E5QXXMSG.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/modules/tools/toolRegistry.ts
init_esm_shims();
import { z } from "zod";
var ToolRegistry = class _ToolRegistry {
  static instance;
  tools = /* @__PURE__ */ new Map();
  constructor() {
  }
  static getInstance() {
    if (!_ToolRegistry.instance) {
      _ToolRegistry.instance = new _ToolRegistry();
    }
    return _ToolRegistry.instance;
  }
  clear() {
    this.tools.clear();
  }
  async execute(name, params, ctx) {
    const tool = this.get(name);
    if (!tool) {
      throw new UserError(`Tool not found: ${name}`);
    }
    let parsedParams;
    try {
      parsedParams = tool.parameters.parse(params);
    } catch (error) {
      let errorMessage = `Invalid tool parameters for tool '${name}': `;
      if (error instanceof z.ZodError) {
        errorMessage += JSON.stringify(error.issues);
      } else if (error instanceof Error) {
        errorMessage += error.message;
      } else if (typeof error === "object" && error !== null && "message" in error) {
        errorMessage += String(error.message);
      } else {
        errorMessage += String(error);
      }
      throw new AppError(errorMessage, {
        statusCode: 400
      });
    }
    ctx.log.info(
      `Executing tool: ${name} with params: ${JSON.stringify(parsedParams)}`
    );
    return tool.execute(parsedParams, ctx);
  }
  get(name) {
    return this.tools.get(name);
  }
  getAll() {
    return Array.from(this.tools.values());
  }
  register(tool) {
    if (this.tools.has(tool.name)) {
      throw new UserError(`Tool with name ${tool.name} already registered.`);
    }
    this.tools.set(tool.name, tool);
    console.log(`Tool registered: ${tool.name}`);
    getLoggerInstance().debug(
      { toolName: tool.name },
      `Tool registered: ${tool.name}`
    );
  }
  unregister(name) {
    if (this.tools.delete(name)) {
      getLoggerInstance().info(`Outil d\xE9senregistr\xE9 : "${name}"`);
    } else {
      getLoggerInstance().warn(
        `Tentative de d\xE9senregistrer un outil inconnu : "${name}"`
      );
    }
  }
};
var toolRegistry = ToolRegistry.getInstance();

export {
  toolRegistry
};
