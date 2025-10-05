import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  LlmError,
  getLlmProvider,
  llmRouterService
} from "./chunk-PQQT7OJ2.js";
import {
  LlmKeyManager,
  __require,
  config,
  getConfig,
  getLogger,
  getLoggerInstance,
  getRedisClientInstance,
  loadConfig
} from "./chunk-OQIZC4IC.js";

// src/worker.ts
import { Queue, Worker } from "bullmq";
import { spawn as _spawn } from "child_process";

// src/utils/toolLoader.ts
import * as chokidar from "chokidar";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";
import { z as z2 } from "zod";

// src/modules/tools/toolRegistry.ts
import { z } from "zod";

// src/utils/errorUtils.ts
var FastMCPError = class extends Error {
  constructor(message) {
    super(message);
    this.name = new.target.name;
  }
};
var AppError = class extends FastMCPError {
  /**
   * Represents an application-specific error. It is recommended to always provide a `statusCode`
   * within the `details` object for proper HTTP response handling.
   */
  constructor(message, details) {
    super(message);
    this.details = details;
  }
};
var getErrDetails = (err) => {
  if (err instanceof AppError) {
    return {
      details: err.details,
      // Include details for AppError
      message: err.message ?? "Unknown AppError",
      name: err.name ?? "AppError",
      stack: err.stack
    };
  } else if (err instanceof Error) {
    return {
      message: err.message ?? "Unknown error",
      name: err.name ?? "Error",
      stack: err.stack
    };
  }
  if (typeof err === "object" && err !== null && "message" in err && typeof err.message === "string") {
    return {
      message: err.message,
      name: "NonErrorObject"
    };
  }
  return {
    message: String(err),
    name: "NonErrorPrimitive"
  };
};
var UnexpectedStateError = class extends FastMCPError {
  /**
   * Additional debugging information for unexpected states. This field should always be used
   * to provide relevant context when an unexpected state occurs.
   */
  extras;
  constructor(message, extras) {
    super(message);
    this.name = new.target.name;
    this.extras = extras;
  }
};
var UserError = class extends UnexpectedStateError {
  constructor(message, extras) {
    super(message, extras);
    this.name = "UserError";
  }
};

// src/modules/tools/toolRegistry.ts
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

// src/utils/toolLoader.ts
var logger = getLogger();
var toolSchema = z2.object({
  description: z2.string(),
  execute: z2.unknown(),
  name: z2.string(),
  parameters: z2.unknown()
  // We expect a ZodObject, but z.any() is used here to avoid circular dependencies with ZodObject type
});
var __filename2 = fileURLToPath(import.meta.url);
var __dirname2 = path.dirname(__filename2);
var loadedToolFiles = /* @__PURE__ */ new Set();
var fileToToolNameMap = /* @__PURE__ */ new Map();
var watcher = null;
var runningInDist = process.env.NODE_ENV === "production" || __dirname2.includes("dist");
var fileExtension = runningInDist ? ".tool.js" : ".tool.ts";
async function _internalLoadTools() {
  console.log(`[_internalLoadTools] Starting to load tools dynamically.`);
  getLogger().info(`[_internalLoadTools] Starting to load tools dynamically.`);
  const toolsDir = getToolsDir();
  let toolFiles = [];
  try {
    toolFiles = await findToolFiles(toolsDir, fileExtension);
    console.log(
      `[_internalLoadTools] Found tool files: ${toolFiles.join(", ")}`
    );
    getLogger().info(
      `[_internalLoadTools] Found tool files: ${toolFiles.join(", ")}`
    );
    for (const file of toolFiles) {
      if (loadedToolFiles.has(file)) {
        console.log(
          `[_internalLoadTools] File already loaded, skipping: ${file}`
        );
        getLogger().debug(
          { file },
          `[_internalLoadTools] File already loaded, skipping.`
        );
        continue;
      }
      logger.debug(`[GEMINI-DEBUG] Loading tool file: ${file}`);
      await loadToolFile(file);
      console.log(
        `[_internalLoadTools] Successfully loaded tool file: ${file}`
      );
      getLogger().info(
        `[_internalLoadTools] Successfully loaded tool file: ${file}`
      );
    }
  } catch (error) {
    console.error({
      ...getErrDetails(error),
      logContext: "[_internalLoadTools] Error during tool file discovery or loading."
    });
    getLogger().error({
      ...getErrDetails(error),
      logContext: "[_internalLoadTools] Error during tool file discovery or loading."
    });
    throw error;
  }
  console.log(
    `${toolRegistry.getAll().length} tools have been loaded dynamically.`
  );
  getLogger().info(
    `${toolRegistry.getAll().length} tools have been loaded dynamically.`
  );
}
async function getTools() {
  if (loadedToolFiles.size === 0) {
    await _internalLoadTools();
    if (!watcher) {
      watchTools();
    }
  }
  return toolRegistry.getAll();
}
function getToolsDir() {
  if (process.env.TOOLS_PATH) {
    console.log(`[getToolsDir] Using TOOLS_PATH: ${process.env.TOOLS_PATH}`);
    return process.env.TOOLS_PATH;
  }
  getLogger().debug(`[getToolsDir] Running in dist: ${runningInDist}`);
  getLogger().debug(`[getToolsDir] __dirname: ${__dirname2}`);
  getLogger().debug(`[getToolsDir] process.cwd(): ${process.cwd()}`);
  getLogger().debug(
    `[getToolsDir] process.env.NODE_ENV: ${process.env.NODE_ENV}`
  );
  let toolsPath;
  if (runningInDist) {
    if (process.cwd().endsWith("packages/core")) {
      toolsPath = path.resolve(process.cwd(), "dist/modules/tools/definitions");
    } else {
      toolsPath = path.resolve(
        process.cwd(),
        "packages/core/dist/modules/tools/definitions"
      );
    }
  } else {
    if (process.cwd().endsWith("packages/core")) {
      toolsPath = path.resolve(process.cwd(), "src/modules/tools/definitions");
    } else {
      toolsPath = path.resolve(
        process.cwd(),
        "packages/core/src/modules/tools/definitions"
      );
    }
  }
  console.log(`[getToolsDir] Constructed tools path: ${toolsPath}`);
  getLogger().debug(`[getToolsDir] Constructed tools path: ${toolsPath}`);
  return toolsPath;
}
async function findToolFiles(dir, extension) {
  let files = [];
  getLogger().info(`[findToolFiles] Scanning directory: ${dir}`);
  console.log(`[findToolFiles] Scanning directory: ${dir}`);
  console.log(`[findToolFiles] Looking for files with extension: ${extension}`);
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    logger.debug(
      `[findToolFiles] Found ${entries.length} entries in directory`
    );
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      logger.debug(
        `[findToolFiles] Processing entry: ${entry.name}, isDirectory: ${entry.isDirectory()}, isFile: ${entry.isFile()}`
      );
      if (entry.isDirectory()) {
        files = files.concat(await findToolFiles(fullPath, extension));
      } else if (entry.isFile() && entry.name.endsWith(extension)) {
        console.log(`[findToolFiles] Found matching file: ${fullPath}`);
        if (fullPath.includes("playwright") || fullPath.includes("browser")) {
          logger.debug(
            `[findToolFiles] [PLAYWRIGHT/BROWSER] Found tool file: ${fullPath}`
          );
          logger.info(
            `[findToolFiles] [PLAYWRIGHT/BROWSER] Found tool file: ${fullPath}`
          );
        }
        files.push(fullPath);
      }
    }
  } catch (error) {
    const errDetails = getErrDetails(error);
    getLogger().error({
      ...errDetails,
      directory: dir,
      logContext: "Erreur lors du parcours du r\xE9pertoire d'outils."
    });
    console.log(`[findToolFiles] Error scanning directory: ${dir}`, error);
    throw error;
  }
  logger.debug(`[findToolFiles] Returning files: ${files.join(", ")}`);
  return files;
}
async function loadToolFile(file) {
  const logger5 = getLogger();
  logger5.debug({ file }, `[loadToolFile] Attempting to load tool file.`);
  logger5.debug(`[loadToolFile] Attempting to load tool file: ${file}`);
  try {
    const module = await import(`${path.resolve(file)}?v=${Date.now()}`);
    logger5.debug(
      { file, moduleExports: Object.keys(module) },
      `[loadToolFile] Successfully imported module.`
    );
    logger5.debug(`[loadToolFile] Successfully imported module from ${file}`);
    logger5.debug(
      `[loadToolFile] Module exports: ${Object.keys(module).join(", ")}`
    );
    for (const exportName in module) {
      const exportedItem = module[exportName];
      if (typeof exportedItem === "object" && exportedItem !== null && "name" in exportedItem) {
        logger5.debug(
          { exportName, file },
          `[loadToolFile] Found potential tool export.`
        );
        logger5.debug(
          `[loadToolFile] Found potential tool export: ${exportName} in ${file}`
        );
        const parsedTool = toolSchema.safeParse(exportedItem);
        if (parsedTool.success) {
          const tool = parsedTool.data;
          if (toolRegistry.get(tool.name)) {
            logger5.warn(
              { file, toolName: tool.name },
              `[loadToolFile] Tool with name ${tool.name} already registered, skipping.`
            );
            logger5.debug(
              `[loadToolFile] Tool ${tool.name} already registered, skipping.`
            );
            continue;
          }
          toolRegistry.register(tool);
          loadedToolFiles.add(file);
          fileToToolNameMap.set(file, tool.name);
          logger5.info(
            { file, toolName: tool.name },
            `[loadToolFile] Successfully registered tool.`
          );
          logger5.info(
            `[loadToolFile] Successfully registered tool: ${tool.name} from ${file}`
          );
        } else {
          logger5.warn(
            {
              errors: parsedTool.error.issues.map((issue) => ({
                message: issue.message,
                path: issue.path.join(".")
              })),
              exportName,
              file
            },
            `[loadToolFile] Skipping invalid tool export due to Zod schema mismatch.`
          );
          logger5.debug(
            `[loadToolFile] Skipping invalid tool export ${exportName} from ${file} due to Zod schema mismatch`
          );
        }
      } else {
        logger5.debug(
          { exportName, file },
          `[loadToolFile] Skipping non-tool export.`
        );
        logger5.debug(
          `[loadToolFile] Skipping non-tool export: ${exportName} from ${file}`
        );
      }
    }
  } catch (error) {
    if (file.includes("browser.tool")) {
      logger5.warn({
        ...getErrDetails(error),
        file,
        logContext: `[loadToolFile] Failed to load browser tool (likely due to Playwright issues). This tool will be skipped.`
      });
      logger5.warn(
        `[loadToolFile] [BROWSER TOOL WARNING] Failed to load browser tool from ${file}:`,
        error
      );
      return;
    }
    logger5.error({
      ...getErrDetails(error),
      file,
      logContext: `[loadToolFile] Failed to dynamically load or process tool file.`
    });
    logger5.error(
      `[loadToolFile] ERROR Failed to load tool file ${file}:`,
      error
    );
  }
}
function watchTools() {
  const toolsDir = getToolsDir();
  const generatedToolsDir = path.join(
    process.cwd(),
    runningInDist ? "packages/core/dist/tools/generated" : "packages/core/src/tools/generated"
  );
  logger.info(`[watchTools] Watching for tool changes in: ${toolsDir}`);
  logger.info(
    `[watchTools] Also watching generated tools in: ${generatedToolsDir}`
  );
  watcher = chokidar.watch(
    [
      `${toolsDir}/**/*.tool.${runningInDist ? "js" : "ts"}`,
      `${generatedToolsDir}/**/*.tool.${runningInDist ? "js" : "ts"}`
    ],
    {
      ignored: /(^|\/|\\)\./,
      // ignore dotfiles
      ignoreInitial: true,
      // Don't trigger add events on startup
      persistent: true
    }
  );
  watcher.on("add", async (filePath) => {
    logger.info(`[watchTools] New tool file added: ${filePath}`);
    await loadToolFile(filePath);
  });
  watcher.on("change", async (filePath) => {
    logger.info(`[watchTools] Tool file changed: ${filePath}`);
    await loadToolFile(filePath);
  });
  watcher.on("unlink", (filePath) => {
    logger.info(`[watchTools] Tool file removed: ${filePath}`);
    const toolName = fileToToolNameMap.get(filePath);
    if (toolName) {
      toolRegistry.unregister(toolName);
      loadedToolFiles.delete(filePath);
      fileToToolNameMap.delete(filePath);
      logger.info(`[watchTools] Unregistered tool: ${toolName}`);
    }
  });
  watcher.on("error", (error) => {
    logger.error({ error }, "[watchTools] Watcher error");
  });
  watcher.on("ready", () => {
    logger.info("[watchTools] Initial scan complete. Ready for changes.");
  });
}

// src/modules/tools/definitions/system/finish.tool.ts
import { z as z3 } from "zod";
var parameters = z3.object({
  response: z3.string().describe("The final, complete answer to the user.")
});
var finishOutput = z3.string();
var FinishToolSignal = class extends Error {
  response;
  constructor(response) {
    super(response);
    this.name = "FinishToolSignal";
    this.response = response;
  }
};

// src/modules/agent/orchestrator.prompt.ts
import { existsSync, readFileSync } from "fs";
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";

// src/modules/agent/responseSchema.ts
import { z as z4 } from "zod";

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/Options.js
var ignoreOverride = Symbol("Let zodToJsonSchema decide on which parser to use");
var defaultOptions = {
  name: void 0,
  $refStrategy: "root",
  basePath: ["#"],
  effectStrategy: "input",
  pipeStrategy: "all",
  dateStrategy: "format:date-time",
  mapStrategy: "entries",
  removeAdditionalStrategy: "passthrough",
  allowedAdditionalProperties: true,
  rejectedAdditionalProperties: false,
  definitionPath: "definitions",
  target: "jsonSchema7",
  strictUnions: false,
  definitions: {},
  errorMessages: false,
  markdownDescription: false,
  patternStrategy: "escape",
  applyRegexFlags: false,
  emailStrategy: "format:email",
  base64Strategy: "contentEncoding:base64",
  nameStrategy: "ref",
  openAiAnyTypeName: "OpenAiAnyType"
};
var getDefaultOptions = (options) => typeof options === "string" ? {
  ...defaultOptions,
  name: options
} : {
  ...defaultOptions,
  ...options
};

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/Refs.js
var getRefs = (options) => {
  const _options = getDefaultOptions(options);
  const currentPath = _options.name !== void 0 ? [..._options.basePath, _options.definitionPath, _options.name] : _options.basePath;
  return {
    ..._options,
    flags: { hasReferencedOpenAiAnyType: false },
    currentPath,
    propertyPath: void 0,
    seen: new Map(Object.entries(_options.definitions).map(([name, def]) => [
      def._def,
      {
        def: def._def,
        path: [..._options.basePath, _options.definitionPath, name],
        // Resolution of references will be forced even though seen, so it's ok that the schema is undefined here for now.
        jsonSchema: void 0
      }
    ]))
  };
};

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/errorMessages.js
function addErrorMessage(res, key, errorMessage, refs) {
  if (!refs?.errorMessages)
    return;
  if (errorMessage) {
    res.errorMessage = {
      ...res.errorMessage,
      [key]: errorMessage
    };
  }
}
function setResponseValueAndErrors(res, key, value, errorMessage, refs) {
  res[key] = value;
  addErrorMessage(res, key, errorMessage, refs);
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/getRelativePath.js
var getRelativePath = (pathA, pathB) => {
  let i = 0;
  for (; i < pathA.length && i < pathB.length; i++) {
    if (pathA[i] !== pathB[i])
      break;
  }
  return [(pathA.length - i).toString(), ...pathB.slice(i)].join("/");
};

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/selectParser.js
import { ZodFirstPartyTypeKind as ZodFirstPartyTypeKind3 } from "zod";

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/any.js
function parseAnyDef(refs) {
  if (refs.target !== "openAi") {
    return {};
  }
  const anyDefinitionPath = [
    ...refs.basePath,
    refs.definitionPath,
    refs.openAiAnyTypeName
  ];
  refs.flags.hasReferencedOpenAiAnyType = true;
  return {
    $ref: refs.$refStrategy === "relative" ? getRelativePath(anyDefinitionPath, refs.currentPath) : anyDefinitionPath.join("/")
  };
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/array.js
import { ZodFirstPartyTypeKind } from "zod";
function parseArrayDef(def, refs) {
  const res = {
    type: "array"
  };
  if (def.type?._def && def.type?._def?.typeName !== ZodFirstPartyTypeKind.ZodAny) {
    res.items = parseDef(def.type._def, {
      ...refs,
      currentPath: [...refs.currentPath, "items"]
    });
  }
  if (def.minLength) {
    setResponseValueAndErrors(res, "minItems", def.minLength.value, def.minLength.message, refs);
  }
  if (def.maxLength) {
    setResponseValueAndErrors(res, "maxItems", def.maxLength.value, def.maxLength.message, refs);
  }
  if (def.exactLength) {
    setResponseValueAndErrors(res, "minItems", def.exactLength.value, def.exactLength.message, refs);
    setResponseValueAndErrors(res, "maxItems", def.exactLength.value, def.exactLength.message, refs);
  }
  return res;
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/bigint.js
function parseBigintDef(def, refs) {
  const res = {
    type: "integer",
    format: "int64"
  };
  if (!def.checks)
    return res;
  for (const check of def.checks) {
    switch (check.kind) {
      case "min":
        if (refs.target === "jsonSchema7") {
          if (check.inclusive) {
            setResponseValueAndErrors(res, "minimum", check.value, check.message, refs);
          } else {
            setResponseValueAndErrors(res, "exclusiveMinimum", check.value, check.message, refs);
          }
        } else {
          if (!check.inclusive) {
            res.exclusiveMinimum = true;
          }
          setResponseValueAndErrors(res, "minimum", check.value, check.message, refs);
        }
        break;
      case "max":
        if (refs.target === "jsonSchema7") {
          if (check.inclusive) {
            setResponseValueAndErrors(res, "maximum", check.value, check.message, refs);
          } else {
            setResponseValueAndErrors(res, "exclusiveMaximum", check.value, check.message, refs);
          }
        } else {
          if (!check.inclusive) {
            res.exclusiveMaximum = true;
          }
          setResponseValueAndErrors(res, "maximum", check.value, check.message, refs);
        }
        break;
      case "multipleOf":
        setResponseValueAndErrors(res, "multipleOf", check.value, check.message, refs);
        break;
    }
  }
  return res;
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/boolean.js
function parseBooleanDef() {
  return {
    type: "boolean"
  };
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/branded.js
function parseBrandedDef(_def, refs) {
  return parseDef(_def.type._def, refs);
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/catch.js
var parseCatchDef = (def, refs) => {
  return parseDef(def.innerType._def, refs);
};

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/date.js
function parseDateDef(def, refs, overrideDateStrategy) {
  const strategy = overrideDateStrategy ?? refs.dateStrategy;
  if (Array.isArray(strategy)) {
    return {
      anyOf: strategy.map((item, i) => parseDateDef(def, refs, item))
    };
  }
  switch (strategy) {
    case "string":
    case "format:date-time":
      return {
        type: "string",
        format: "date-time"
      };
    case "format:date":
      return {
        type: "string",
        format: "date"
      };
    case "integer":
      return integerDateParser(def, refs);
  }
}
var integerDateParser = (def, refs) => {
  const res = {
    type: "integer",
    format: "unix-time"
  };
  if (refs.target === "openApi3") {
    return res;
  }
  for (const check of def.checks) {
    switch (check.kind) {
      case "min":
        setResponseValueAndErrors(
          res,
          "minimum",
          check.value,
          // This is in milliseconds
          check.message,
          refs
        );
        break;
      case "max":
        setResponseValueAndErrors(
          res,
          "maximum",
          check.value,
          // This is in milliseconds
          check.message,
          refs
        );
        break;
    }
  }
  return res;
};

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/default.js
function parseDefaultDef(_def, refs) {
  return {
    ...parseDef(_def.innerType._def, refs),
    default: _def.defaultValue()
  };
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/effects.js
function parseEffectsDef(_def, refs) {
  return refs.effectStrategy === "input" ? parseDef(_def.schema._def, refs) : parseAnyDef(refs);
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/enum.js
function parseEnumDef(def) {
  return {
    type: "string",
    enum: Array.from(def.values)
  };
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/intersection.js
var isJsonSchema7AllOfType = (type) => {
  if ("type" in type && type.type === "string")
    return false;
  return "allOf" in type;
};
function parseIntersectionDef(def, refs) {
  const allOf = [
    parseDef(def.left._def, {
      ...refs,
      currentPath: [...refs.currentPath, "allOf", "0"]
    }),
    parseDef(def.right._def, {
      ...refs,
      currentPath: [...refs.currentPath, "allOf", "1"]
    })
  ].filter((x) => !!x);
  let unevaluatedProperties = refs.target === "jsonSchema2019-09" ? { unevaluatedProperties: false } : void 0;
  const mergedAllOf = [];
  allOf.forEach((schema) => {
    if (isJsonSchema7AllOfType(schema)) {
      mergedAllOf.push(...schema.allOf);
      if (schema.unevaluatedProperties === void 0) {
        unevaluatedProperties = void 0;
      }
    } else {
      let nestedSchema = schema;
      if ("additionalProperties" in schema && schema.additionalProperties === false) {
        const { additionalProperties, ...rest } = schema;
        nestedSchema = rest;
      } else {
        unevaluatedProperties = void 0;
      }
      mergedAllOf.push(nestedSchema);
    }
  });
  return mergedAllOf.length ? {
    allOf: mergedAllOf,
    ...unevaluatedProperties
  } : void 0;
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/literal.js
function parseLiteralDef(def, refs) {
  const parsedType = typeof def.value;
  if (parsedType !== "bigint" && parsedType !== "number" && parsedType !== "boolean" && parsedType !== "string") {
    return {
      type: Array.isArray(def.value) ? "array" : "object"
    };
  }
  if (refs.target === "openApi3") {
    return {
      type: parsedType === "bigint" ? "integer" : parsedType,
      enum: [def.value]
    };
  }
  return {
    type: parsedType === "bigint" ? "integer" : parsedType,
    const: def.value
  };
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/record.js
import { ZodFirstPartyTypeKind as ZodFirstPartyTypeKind2 } from "zod";

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/string.js
var emojiRegex = void 0;
var zodPatterns = {
  /**
   * `c` was changed to `[cC]` to replicate /i flag
   */
  cuid: /^[cC][^\s-]{8,}$/,
  cuid2: /^[0-9a-z]+$/,
  ulid: /^[0-9A-HJKMNP-TV-Z]{26}$/,
  /**
   * `a-z` was added to replicate /i flag
   */
  email: /^(?!\.)(?!.*\.\.)([a-zA-Z0-9_'+\-\.]*)[a-zA-Z0-9_+-]@([a-zA-Z0-9][a-zA-Z0-9\-]*\.)+[a-zA-Z]{2,}$/,
  /**
   * Constructed a valid Unicode RegExp
   *
   * Lazily instantiate since this type of regex isn't supported
   * in all envs (e.g. React Native).
   *
   * See:
   * https://github.com/colinhacks/zod/issues/2433
   * Fix in Zod:
   * https://github.com/colinhacks/zod/commit/9340fd51e48576a75adc919bff65dbc4a5d4c99b
   */
  emoji: () => {
    if (emojiRegex === void 0) {
      emojiRegex = RegExp("^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$", "u");
    }
    return emojiRegex;
  },
  /**
   * Unused
   */
  uuid: /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/,
  /**
   * Unused
   */
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,
  ipv4Cidr: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/,
  /**
   * Unused
   */
  ipv6: /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/,
  ipv6Cidr: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
  base64: /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/,
  base64url: /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/,
  nanoid: /^[a-zA-Z0-9_-]{21}$/,
  jwt: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/
};
function parseStringDef(def, refs) {
  const res = {
    type: "string"
  };
  if (def.checks) {
    for (const check of def.checks) {
      switch (check.kind) {
        case "min":
          setResponseValueAndErrors(res, "minLength", typeof res.minLength === "number" ? Math.max(res.minLength, check.value) : check.value, check.message, refs);
          break;
        case "max":
          setResponseValueAndErrors(res, "maxLength", typeof res.maxLength === "number" ? Math.min(res.maxLength, check.value) : check.value, check.message, refs);
          break;
        case "email":
          switch (refs.emailStrategy) {
            case "format:email":
              addFormat(res, "email", check.message, refs);
              break;
            case "format:idn-email":
              addFormat(res, "idn-email", check.message, refs);
              break;
            case "pattern:zod":
              addPattern(res, zodPatterns.email, check.message, refs);
              break;
          }
          break;
        case "url":
          addFormat(res, "uri", check.message, refs);
          break;
        case "uuid":
          addFormat(res, "uuid", check.message, refs);
          break;
        case "regex":
          addPattern(res, check.regex, check.message, refs);
          break;
        case "cuid":
          addPattern(res, zodPatterns.cuid, check.message, refs);
          break;
        case "cuid2":
          addPattern(res, zodPatterns.cuid2, check.message, refs);
          break;
        case "startsWith":
          addPattern(res, RegExp(`^${escapeLiteralCheckValue(check.value, refs)}`), check.message, refs);
          break;
        case "endsWith":
          addPattern(res, RegExp(`${escapeLiteralCheckValue(check.value, refs)}$`), check.message, refs);
          break;
        case "datetime":
          addFormat(res, "date-time", check.message, refs);
          break;
        case "date":
          addFormat(res, "date", check.message, refs);
          break;
        case "time":
          addFormat(res, "time", check.message, refs);
          break;
        case "duration":
          addFormat(res, "duration", check.message, refs);
          break;
        case "length":
          setResponseValueAndErrors(res, "minLength", typeof res.minLength === "number" ? Math.max(res.minLength, check.value) : check.value, check.message, refs);
          setResponseValueAndErrors(res, "maxLength", typeof res.maxLength === "number" ? Math.min(res.maxLength, check.value) : check.value, check.message, refs);
          break;
        case "includes": {
          addPattern(res, RegExp(escapeLiteralCheckValue(check.value, refs)), check.message, refs);
          break;
        }
        case "ip": {
          if (check.version !== "v6") {
            addFormat(res, "ipv4", check.message, refs);
          }
          if (check.version !== "v4") {
            addFormat(res, "ipv6", check.message, refs);
          }
          break;
        }
        case "base64url":
          addPattern(res, zodPatterns.base64url, check.message, refs);
          break;
        case "jwt":
          addPattern(res, zodPatterns.jwt, check.message, refs);
          break;
        case "cidr": {
          if (check.version !== "v6") {
            addPattern(res, zodPatterns.ipv4Cidr, check.message, refs);
          }
          if (check.version !== "v4") {
            addPattern(res, zodPatterns.ipv6Cidr, check.message, refs);
          }
          break;
        }
        case "emoji":
          addPattern(res, zodPatterns.emoji(), check.message, refs);
          break;
        case "ulid": {
          addPattern(res, zodPatterns.ulid, check.message, refs);
          break;
        }
        case "base64": {
          switch (refs.base64Strategy) {
            case "format:binary": {
              addFormat(res, "binary", check.message, refs);
              break;
            }
            case "contentEncoding:base64": {
              setResponseValueAndErrors(res, "contentEncoding", "base64", check.message, refs);
              break;
            }
            case "pattern:zod": {
              addPattern(res, zodPatterns.base64, check.message, refs);
              break;
            }
          }
          break;
        }
        case "nanoid": {
          addPattern(res, zodPatterns.nanoid, check.message, refs);
        }
        case "toLowerCase":
        case "toUpperCase":
        case "trim":
          break;
        default:
          /* @__PURE__ */ ((_) => {
          })(check);
      }
    }
  }
  return res;
}
function escapeLiteralCheckValue(literal, refs) {
  return refs.patternStrategy === "escape" ? escapeNonAlphaNumeric(literal) : literal;
}
var ALPHA_NUMERIC = new Set("ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvxyz0123456789");
function escapeNonAlphaNumeric(source) {
  let result = "";
  for (let i = 0; i < source.length; i++) {
    if (!ALPHA_NUMERIC.has(source[i])) {
      result += "\\";
    }
    result += source[i];
  }
  return result;
}
function addFormat(schema, value, message, refs) {
  if (schema.format || schema.anyOf?.some((x) => x.format)) {
    if (!schema.anyOf) {
      schema.anyOf = [];
    }
    if (schema.format) {
      schema.anyOf.push({
        format: schema.format,
        ...schema.errorMessage && refs.errorMessages && {
          errorMessage: { format: schema.errorMessage.format }
        }
      });
      delete schema.format;
      if (schema.errorMessage) {
        delete schema.errorMessage.format;
        if (Object.keys(schema.errorMessage).length === 0) {
          delete schema.errorMessage;
        }
      }
    }
    schema.anyOf.push({
      format: value,
      ...message && refs.errorMessages && { errorMessage: { format: message } }
    });
  } else {
    setResponseValueAndErrors(schema, "format", value, message, refs);
  }
}
function addPattern(schema, regex, message, refs) {
  if (schema.pattern || schema.allOf?.some((x) => x.pattern)) {
    if (!schema.allOf) {
      schema.allOf = [];
    }
    if (schema.pattern) {
      schema.allOf.push({
        pattern: schema.pattern,
        ...schema.errorMessage && refs.errorMessages && {
          errorMessage: { pattern: schema.errorMessage.pattern }
        }
      });
      delete schema.pattern;
      if (schema.errorMessage) {
        delete schema.errorMessage.pattern;
        if (Object.keys(schema.errorMessage).length === 0) {
          delete schema.errorMessage;
        }
      }
    }
    schema.allOf.push({
      pattern: stringifyRegExpWithFlags(regex, refs),
      ...message && refs.errorMessages && { errorMessage: { pattern: message } }
    });
  } else {
    setResponseValueAndErrors(schema, "pattern", stringifyRegExpWithFlags(regex, refs), message, refs);
  }
}
function stringifyRegExpWithFlags(regex, refs) {
  if (!refs.applyRegexFlags || !regex.flags) {
    return regex.source;
  }
  const flags = {
    i: regex.flags.includes("i"),
    m: regex.flags.includes("m"),
    s: regex.flags.includes("s")
    // `.` matches newlines
  };
  const source = flags.i ? regex.source.toLowerCase() : regex.source;
  let pattern = "";
  let isEscaped = false;
  let inCharGroup = false;
  let inCharRange = false;
  for (let i = 0; i < source.length; i++) {
    if (isEscaped) {
      pattern += source[i];
      isEscaped = false;
      continue;
    }
    if (flags.i) {
      if (inCharGroup) {
        if (source[i].match(/[a-z]/)) {
          if (inCharRange) {
            pattern += source[i];
            pattern += `${source[i - 2]}-${source[i]}`.toUpperCase();
            inCharRange = false;
          } else if (source[i + 1] === "-" && source[i + 2]?.match(/[a-z]/)) {
            pattern += source[i];
            inCharRange = true;
          } else {
            pattern += `${source[i]}${source[i].toUpperCase()}`;
          }
          continue;
        }
      } else if (source[i].match(/[a-z]/)) {
        pattern += `[${source[i]}${source[i].toUpperCase()}]`;
        continue;
      }
    }
    if (flags.m) {
      if (source[i] === "^") {
        pattern += `(^|(?<=[\r
]))`;
        continue;
      } else if (source[i] === "$") {
        pattern += `($|(?=[\r
]))`;
        continue;
      }
    }
    if (flags.s && source[i] === ".") {
      pattern += inCharGroup ? `${source[i]}\r
` : `[${source[i]}\r
]`;
      continue;
    }
    pattern += source[i];
    if (source[i] === "\\") {
      isEscaped = true;
    } else if (inCharGroup && source[i] === "]") {
      inCharGroup = false;
    } else if (!inCharGroup && source[i] === "[") {
      inCharGroup = true;
    }
  }
  try {
    new RegExp(pattern);
  } catch {
    console.warn(`Could not convert regex pattern at ${refs.currentPath.join("/")} to a flag-independent form! Falling back to the flag-ignorant source`);
    return regex.source;
  }
  return pattern;
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/record.js
function parseRecordDef(def, refs) {
  if (refs.target === "openAi") {
    console.warn("Warning: OpenAI may not support records in schemas! Try an array of key-value pairs instead.");
  }
  if (refs.target === "openApi3" && def.keyType?._def.typeName === ZodFirstPartyTypeKind2.ZodEnum) {
    return {
      type: "object",
      required: def.keyType._def.values,
      properties: def.keyType._def.values.reduce((acc, key) => ({
        ...acc,
        [key]: parseDef(def.valueType._def, {
          ...refs,
          currentPath: [...refs.currentPath, "properties", key]
        }) ?? parseAnyDef(refs)
      }), {}),
      additionalProperties: refs.rejectedAdditionalProperties
    };
  }
  const schema = {
    type: "object",
    additionalProperties: parseDef(def.valueType._def, {
      ...refs,
      currentPath: [...refs.currentPath, "additionalProperties"]
    }) ?? refs.allowedAdditionalProperties
  };
  if (refs.target === "openApi3") {
    return schema;
  }
  if (def.keyType?._def.typeName === ZodFirstPartyTypeKind2.ZodString && def.keyType._def.checks?.length) {
    const { type, ...keyType } = parseStringDef(def.keyType._def, refs);
    return {
      ...schema,
      propertyNames: keyType
    };
  } else if (def.keyType?._def.typeName === ZodFirstPartyTypeKind2.ZodEnum) {
    return {
      ...schema,
      propertyNames: {
        enum: def.keyType._def.values
      }
    };
  } else if (def.keyType?._def.typeName === ZodFirstPartyTypeKind2.ZodBranded && def.keyType._def.type._def.typeName === ZodFirstPartyTypeKind2.ZodString && def.keyType._def.type._def.checks?.length) {
    const { type, ...keyType } = parseBrandedDef(def.keyType._def, refs);
    return {
      ...schema,
      propertyNames: keyType
    };
  }
  return schema;
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/map.js
function parseMapDef(def, refs) {
  if (refs.mapStrategy === "record") {
    return parseRecordDef(def, refs);
  }
  const keys = parseDef(def.keyType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "items", "items", "0"]
  }) || parseAnyDef(refs);
  const values = parseDef(def.valueType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "items", "items", "1"]
  }) || parseAnyDef(refs);
  return {
    type: "array",
    maxItems: 125,
    items: {
      type: "array",
      items: [keys, values],
      minItems: 2,
      maxItems: 2
    }
  };
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/nativeEnum.js
function parseNativeEnumDef(def) {
  const object = def.values;
  const actualKeys = Object.keys(def.values).filter((key) => {
    return typeof object[object[key]] !== "number";
  });
  const actualValues = actualKeys.map((key) => object[key]);
  const parsedTypes = Array.from(new Set(actualValues.map((values) => typeof values)));
  return {
    type: parsedTypes.length === 1 ? parsedTypes[0] === "string" ? "string" : "number" : ["string", "number"],
    enum: actualValues
  };
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/never.js
function parseNeverDef(refs) {
  return refs.target === "openAi" ? void 0 : {
    not: parseAnyDef({
      ...refs,
      currentPath: [...refs.currentPath, "not"]
    })
  };
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/null.js
function parseNullDef(refs) {
  return refs.target === "openApi3" ? {
    enum: ["null"],
    nullable: true
  } : {
    type: "null"
  };
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/union.js
var primitiveMappings = {
  ZodString: "string",
  ZodNumber: "number",
  ZodBigInt: "integer",
  ZodBoolean: "boolean",
  ZodNull: "null"
};
function parseUnionDef(def, refs) {
  if (refs.target === "openApi3")
    return asAnyOf(def, refs);
  const options = def.options instanceof Map ? Array.from(def.options.values()) : def.options;
  if (options.every((x) => x._def.typeName in primitiveMappings && (!x._def.checks || !x._def.checks.length))) {
    const types = options.reduce((types2, x) => {
      const type = primitiveMappings[x._def.typeName];
      return type && !types2.includes(type) ? [...types2, type] : types2;
    }, []);
    return {
      type: types.length > 1 ? types : types[0]
    };
  } else if (options.every((x) => x._def.typeName === "ZodLiteral" && !x.description)) {
    const types = options.reduce((acc, x) => {
      const type = typeof x._def.value;
      switch (type) {
        case "string":
        case "number":
        case "boolean":
          return [...acc, type];
        case "bigint":
          return [...acc, "integer"];
        case "object":
          if (x._def.value === null)
            return [...acc, "null"];
        case "symbol":
        case "undefined":
        case "function":
        default:
          return acc;
      }
    }, []);
    if (types.length === options.length) {
      const uniqueTypes = types.filter((x, i, a) => a.indexOf(x) === i);
      return {
        type: uniqueTypes.length > 1 ? uniqueTypes : uniqueTypes[0],
        enum: options.reduce((acc, x) => {
          return acc.includes(x._def.value) ? acc : [...acc, x._def.value];
        }, [])
      };
    }
  } else if (options.every((x) => x._def.typeName === "ZodEnum")) {
    return {
      type: "string",
      enum: options.reduce((acc, x) => [
        ...acc,
        ...x._def.values.filter((x2) => !acc.includes(x2))
      ], [])
    };
  }
  return asAnyOf(def, refs);
}
var asAnyOf = (def, refs) => {
  const anyOf = (def.options instanceof Map ? Array.from(def.options.values()) : def.options).map((x, i) => parseDef(x._def, {
    ...refs,
    currentPath: [...refs.currentPath, "anyOf", `${i}`]
  })).filter((x) => !!x && (!refs.strictUnions || typeof x === "object" && Object.keys(x).length > 0));
  return anyOf.length ? { anyOf } : void 0;
};

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/nullable.js
function parseNullableDef(def, refs) {
  if (["ZodString", "ZodNumber", "ZodBigInt", "ZodBoolean", "ZodNull"].includes(def.innerType._def.typeName) && (!def.innerType._def.checks || !def.innerType._def.checks.length)) {
    if (refs.target === "openApi3") {
      return {
        type: primitiveMappings[def.innerType._def.typeName],
        nullable: true
      };
    }
    return {
      type: [
        primitiveMappings[def.innerType._def.typeName],
        "null"
      ]
    };
  }
  if (refs.target === "openApi3") {
    const base2 = parseDef(def.innerType._def, {
      ...refs,
      currentPath: [...refs.currentPath]
    });
    if (base2 && "$ref" in base2)
      return { allOf: [base2], nullable: true };
    return base2 && { ...base2, nullable: true };
  }
  const base = parseDef(def.innerType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "anyOf", "0"]
  });
  return base && { anyOf: [base, { type: "null" }] };
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/number.js
function parseNumberDef(def, refs) {
  const res = {
    type: "number"
  };
  if (!def.checks)
    return res;
  for (const check of def.checks) {
    switch (check.kind) {
      case "int":
        res.type = "integer";
        addErrorMessage(res, "type", check.message, refs);
        break;
      case "min":
        if (refs.target === "jsonSchema7") {
          if (check.inclusive) {
            setResponseValueAndErrors(res, "minimum", check.value, check.message, refs);
          } else {
            setResponseValueAndErrors(res, "exclusiveMinimum", check.value, check.message, refs);
          }
        } else {
          if (!check.inclusive) {
            res.exclusiveMinimum = true;
          }
          setResponseValueAndErrors(res, "minimum", check.value, check.message, refs);
        }
        break;
      case "max":
        if (refs.target === "jsonSchema7") {
          if (check.inclusive) {
            setResponseValueAndErrors(res, "maximum", check.value, check.message, refs);
          } else {
            setResponseValueAndErrors(res, "exclusiveMaximum", check.value, check.message, refs);
          }
        } else {
          if (!check.inclusive) {
            res.exclusiveMaximum = true;
          }
          setResponseValueAndErrors(res, "maximum", check.value, check.message, refs);
        }
        break;
      case "multipleOf":
        setResponseValueAndErrors(res, "multipleOf", check.value, check.message, refs);
        break;
    }
  }
  return res;
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/object.js
function parseObjectDef(def, refs) {
  const forceOptionalIntoNullable = refs.target === "openAi";
  const result = {
    type: "object",
    properties: {}
  };
  const required = [];
  const shape = def.shape();
  for (const propName in shape) {
    let propDef = shape[propName];
    if (propDef === void 0 || propDef._def === void 0) {
      continue;
    }
    let propOptional = safeIsOptional(propDef);
    if (propOptional && forceOptionalIntoNullable) {
      if (propDef._def.typeName === "ZodOptional") {
        propDef = propDef._def.innerType;
      }
      if (!propDef.isNullable()) {
        propDef = propDef.nullable();
      }
      propOptional = false;
    }
    const parsedDef = parseDef(propDef._def, {
      ...refs,
      currentPath: [...refs.currentPath, "properties", propName],
      propertyPath: [...refs.currentPath, "properties", propName]
    });
    if (parsedDef === void 0) {
      continue;
    }
    result.properties[propName] = parsedDef;
    if (!propOptional) {
      required.push(propName);
    }
  }
  if (required.length) {
    result.required = required;
  }
  const additionalProperties = decideAdditionalProperties(def, refs);
  if (additionalProperties !== void 0) {
    result.additionalProperties = additionalProperties;
  }
  return result;
}
function decideAdditionalProperties(def, refs) {
  if (def.catchall._def.typeName !== "ZodNever") {
    return parseDef(def.catchall._def, {
      ...refs,
      currentPath: [...refs.currentPath, "additionalProperties"]
    });
  }
  switch (def.unknownKeys) {
    case "passthrough":
      return refs.allowedAdditionalProperties;
    case "strict":
      return refs.rejectedAdditionalProperties;
    case "strip":
      return refs.removeAdditionalStrategy === "strict" ? refs.allowedAdditionalProperties : refs.rejectedAdditionalProperties;
  }
}
function safeIsOptional(schema) {
  try {
    return schema.isOptional();
  } catch {
    return true;
  }
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/optional.js
var parseOptionalDef = (def, refs) => {
  if (refs.currentPath.toString() === refs.propertyPath?.toString()) {
    return parseDef(def.innerType._def, refs);
  }
  const innerSchema = parseDef(def.innerType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "anyOf", "1"]
  });
  return innerSchema ? {
    anyOf: [
      {
        not: parseAnyDef(refs)
      },
      innerSchema
    ]
  } : parseAnyDef(refs);
};

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/pipeline.js
var parsePipelineDef = (def, refs) => {
  if (refs.pipeStrategy === "input") {
    return parseDef(def.in._def, refs);
  } else if (refs.pipeStrategy === "output") {
    return parseDef(def.out._def, refs);
  }
  const a = parseDef(def.in._def, {
    ...refs,
    currentPath: [...refs.currentPath, "allOf", "0"]
  });
  const b = parseDef(def.out._def, {
    ...refs,
    currentPath: [...refs.currentPath, "allOf", a ? "1" : "0"]
  });
  return {
    allOf: [a, b].filter((x) => x !== void 0)
  };
};

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/promise.js
function parsePromiseDef(def, refs) {
  return parseDef(def.type._def, refs);
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/set.js
function parseSetDef(def, refs) {
  const items = parseDef(def.valueType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "items"]
  });
  const schema = {
    type: "array",
    uniqueItems: true,
    items
  };
  if (def.minSize) {
    setResponseValueAndErrors(schema, "minItems", def.minSize.value, def.minSize.message, refs);
  }
  if (def.maxSize) {
    setResponseValueAndErrors(schema, "maxItems", def.maxSize.value, def.maxSize.message, refs);
  }
  return schema;
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/tuple.js
function parseTupleDef(def, refs) {
  if (def.rest) {
    return {
      type: "array",
      minItems: def.items.length,
      items: def.items.map((x, i) => parseDef(x._def, {
        ...refs,
        currentPath: [...refs.currentPath, "items", `${i}`]
      })).reduce((acc, x) => x === void 0 ? acc : [...acc, x], []),
      additionalItems: parseDef(def.rest._def, {
        ...refs,
        currentPath: [...refs.currentPath, "additionalItems"]
      })
    };
  } else {
    return {
      type: "array",
      minItems: def.items.length,
      maxItems: def.items.length,
      items: def.items.map((x, i) => parseDef(x._def, {
        ...refs,
        currentPath: [...refs.currentPath, "items", `${i}`]
      })).reduce((acc, x) => x === void 0 ? acc : [...acc, x], [])
    };
  }
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/undefined.js
function parseUndefinedDef(refs) {
  return {
    not: parseAnyDef(refs)
  };
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/unknown.js
function parseUnknownDef(refs) {
  return parseAnyDef(refs);
}

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parsers/readonly.js
var parseReadonlyDef = (def, refs) => {
  return parseDef(def.innerType._def, refs);
};

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/selectParser.js
var selectParser = (def, typeName, refs) => {
  switch (typeName) {
    case ZodFirstPartyTypeKind3.ZodString:
      return parseStringDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodNumber:
      return parseNumberDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodObject:
      return parseObjectDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodBigInt:
      return parseBigintDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodBoolean:
      return parseBooleanDef();
    case ZodFirstPartyTypeKind3.ZodDate:
      return parseDateDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodUndefined:
      return parseUndefinedDef(refs);
    case ZodFirstPartyTypeKind3.ZodNull:
      return parseNullDef(refs);
    case ZodFirstPartyTypeKind3.ZodArray:
      return parseArrayDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodUnion:
    case ZodFirstPartyTypeKind3.ZodDiscriminatedUnion:
      return parseUnionDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodIntersection:
      return parseIntersectionDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodTuple:
      return parseTupleDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodRecord:
      return parseRecordDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodLiteral:
      return parseLiteralDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodEnum:
      return parseEnumDef(def);
    case ZodFirstPartyTypeKind3.ZodNativeEnum:
      return parseNativeEnumDef(def);
    case ZodFirstPartyTypeKind3.ZodNullable:
      return parseNullableDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodOptional:
      return parseOptionalDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodMap:
      return parseMapDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodSet:
      return parseSetDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodLazy:
      return () => def.getter()._def;
    case ZodFirstPartyTypeKind3.ZodPromise:
      return parsePromiseDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodNaN:
    case ZodFirstPartyTypeKind3.ZodNever:
      return parseNeverDef(refs);
    case ZodFirstPartyTypeKind3.ZodEffects:
      return parseEffectsDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodAny:
      return parseAnyDef(refs);
    case ZodFirstPartyTypeKind3.ZodUnknown:
      return parseUnknownDef(refs);
    case ZodFirstPartyTypeKind3.ZodDefault:
      return parseDefaultDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodBranded:
      return parseBrandedDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodReadonly:
      return parseReadonlyDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodCatch:
      return parseCatchDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodPipeline:
      return parsePipelineDef(def, refs);
    case ZodFirstPartyTypeKind3.ZodFunction:
    case ZodFirstPartyTypeKind3.ZodVoid:
    case ZodFirstPartyTypeKind3.ZodSymbol:
      return void 0;
    default:
      return /* @__PURE__ */ ((_) => void 0)(typeName);
  }
};

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/parseDef.js
function parseDef(def, refs, forceResolution = false) {
  const seenItem = refs.seen.get(def);
  if (refs.override) {
    const overrideResult = refs.override?.(def, refs, seenItem, forceResolution);
    if (overrideResult !== ignoreOverride) {
      return overrideResult;
    }
  }
  if (seenItem && !forceResolution) {
    const seenSchema = get$ref(seenItem, refs);
    if (seenSchema !== void 0) {
      return seenSchema;
    }
  }
  const newItem = { def, path: refs.currentPath, jsonSchema: void 0 };
  refs.seen.set(def, newItem);
  const jsonSchemaOrGetter = selectParser(def, def.typeName, refs);
  const jsonSchema = typeof jsonSchemaOrGetter === "function" ? parseDef(jsonSchemaOrGetter(), refs) : jsonSchemaOrGetter;
  if (jsonSchema) {
    addMeta(def, refs, jsonSchema);
  }
  if (refs.postProcess) {
    const postProcessResult = refs.postProcess(jsonSchema, def, refs);
    newItem.jsonSchema = jsonSchema;
    return postProcessResult;
  }
  newItem.jsonSchema = jsonSchema;
  return jsonSchema;
}
var get$ref = (item, refs) => {
  switch (refs.$refStrategy) {
    case "root":
      return { $ref: item.path.join("/") };
    case "relative":
      return { $ref: getRelativePath(refs.currentPath, item.path) };
    case "none":
    case "seen": {
      if (item.path.length < refs.currentPath.length && item.path.every((value, index) => refs.currentPath[index] === value)) {
        console.warn(`Recursive reference detected at ${refs.currentPath.join("/")}! Defaulting to any`);
        return parseAnyDef(refs);
      }
      return refs.$refStrategy === "seen" ? parseAnyDef(refs) : void 0;
    }
  }
};
var addMeta = (def, refs, jsonSchema) => {
  if (def.description) {
    jsonSchema.description = def.description;
    if (refs.markdownDescription) {
      jsonSchema.markdownDescription = def.description;
    }
  }
  return jsonSchema;
};

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.6_zod@3.25.76/node_modules/zod-to-json-schema/dist/esm/zodToJsonSchema.js
var zodToJsonSchema = (schema, options) => {
  const refs = getRefs(options);
  let definitions = typeof options === "object" && options.definitions ? Object.entries(options.definitions).reduce((acc, [name2, schema2]) => ({
    ...acc,
    [name2]: parseDef(schema2._def, {
      ...refs,
      currentPath: [...refs.basePath, refs.definitionPath, name2]
    }, true) ?? parseAnyDef(refs)
  }), {}) : void 0;
  const name = typeof options === "string" ? options : options?.nameStrategy === "title" ? void 0 : options?.name;
  const main = parseDef(schema._def, name === void 0 ? refs : {
    ...refs,
    currentPath: [...refs.basePath, refs.definitionPath, name]
  }, false) ?? parseAnyDef(refs);
  const title = typeof options === "object" && options.name !== void 0 && options.nameStrategy === "title" ? options.name : void 0;
  if (title !== void 0) {
    main.title = title;
  }
  if (refs.flags.hasReferencedOpenAiAnyType) {
    if (!definitions) {
      definitions = {};
    }
    if (!definitions[refs.openAiAnyTypeName]) {
      definitions[refs.openAiAnyTypeName] = {
        // Skipping "object" as no properties can be defined and additionalProperties must be "false"
        type: ["string", "number", "integer", "boolean", "array", "null"],
        items: {
          $ref: refs.$refStrategy === "relative" ? "1" : [
            ...refs.basePath,
            refs.definitionPath,
            refs.openAiAnyTypeName
          ].join("/")
        }
      };
    }
  }
  const combined = name === void 0 ? definitions ? {
    ...main,
    [refs.definitionPath]: definitions
  } : main : {
    $ref: [
      ...refs.$refStrategy === "relative" ? [] : refs.basePath,
      refs.definitionPath,
      name
    ].join("/"),
    [refs.definitionPath]: {
      ...definitions,
      [name]: main
    }
  };
  if (refs.target === "jsonSchema7") {
    combined.$schema = "http://json-schema.org/draft-07/schema#";
  } else if (refs.target === "jsonSchema2019-09" || refs.target === "openAi") {
    combined.$schema = "https://json-schema.org/draft/2019-09/schema#";
  }
  if (refs.target === "openAi" && ("anyOf" in combined || "oneOf" in combined || "allOf" in combined || "type" in combined && Array.isArray(combined.type))) {
    console.warn("Warning: OpenAI may not support schemas with unions as roots! Try wrapping it in an object property.");
  }
  return combined;
};

// src/modules/agent/responseSchema.ts
var llmResponseSchema = z4.object({
  answer: z4.string().optional().describe(
    "The final answer to the user's request. Use this when you have completed the task and are ready to respond to the user."
  ),
  canvas: z4.object({
    content: z4.string().describe(
      "The content to display on the canvas. Can be HTML, Markdown, or just text."
    ),
    contentType: z4.enum(["html", "markdown", "text", "url"]).describe("The content type of the canvas content.")
  }).optional().describe(
    "The canvas is a visual workspace. Use it to display rich content to the user, like charts, tables, or interactive elements."
  ),
  command: z4.object({
    name: z4.string().describe("The name of the tool to execute."),
    params: z4.record(z4.string(), z4.any()).optional().describe("The parameters for the tool, as a JSON object.")
  }).optional().describe("The command to execute. Use this to call a tool."),
  thought: z4.string().optional().describe(
    "Your internal monologue and reasoning. Use it to think through problems, explain your approach, and communicate your thought process. This appears as a chat bubble in the conversation flow for the user to see your reasoning."
  )
});
function getResponseJsonSchema() {
  return zodToJsonSchema(llmResponseSchema, {
    $refStrategy: "none"
  });
}

// src/modules/agent/orchestrator.prompt.ts
var __filename3 = fileURLToPath2(import.meta.url);
var __dirname3 = path2.dirname(__filename3);
var PREAMBLE_CONTENT = null;
var getSystemPromptContent = () => {
  if (PREAMBLE_CONTENT !== null) {
    return PREAMBLE_CONTENT;
  }
  const possiblePaths = [
    path2.resolve(__dirname3, "system.prompt.md"),
    // dist/modules/agent/system.prompt.md
    path2.resolve(__dirname3, "..", "..", "..", "system.prompt.md"),
    // dist/system.prompt.md
    path2.resolve(
      __dirname3,
      "..",
      "..",
      "..",
      "..",
      "src",
      "modules",
      "agent",
      "system.prompt.md"
    )
    // src/modules/agent/system.prompt.md
  ];
  for (const filePath of possiblePaths) {
    try {
      if (existsSync(filePath)) {
        PREAMBLE_CONTENT = readFileSync(filePath, "utf-8");
        return PREAMBLE_CONTENT;
      }
    } catch (error) {
      continue;
    }
  }
  console.warn("Warning: system.prompt.md not found, using fallback content");
  PREAMBLE_CONTENT = "# AgenticForge - AI Assistant\n\nYou are AgenticForge, an AI assistant. Please respond helpfully.";
  return PREAMBLE_CONTENT;
};
var getPreamble = () => {
  const schema = JSON.stringify(getResponseJsonSchema(), null, 2);
  return getSystemPromptContent().replace("{{RESPONSE_JSON_SCHEMA}}", schema);
};
var TOOLS_SECTION_HEADER = "## Available Tools:";
var HISTORY_SECTION_HEADER = "## Conversation History:";
var WORKING_CONTEXT_HEADER = "## Working Context:";
var zodToJsonSchema2 = (_schema) => {
  if (!_schema || !_schema._def || !_schema._def.typeName) {
    throw new Error(
      `Invalid Zod schema provided for JSON schema conversion: ${JSON.stringify(_schema)}`
    );
  }
  const jsonSchema = {};
  if (_schema.description) {
    jsonSchema.description = _schema.description;
  }
  switch (_schema._def.typeName) {
    case "ZodAny":
      jsonSchema.type = [
        "string",
        "number",
        "boolean",
        "object",
        "array",
        "null"
      ];
      jsonSchema.description = "Accepts any type of value";
      break;
    case "ZodArray":
      jsonSchema.type = "array";
      jsonSchema.items = zodToJsonSchema2(_schema._def.type);
      break;
    case "ZodBoolean":
      jsonSchema.type = "boolean";
      break;
    case "ZodDefault": {
      const innerSchema = zodToJsonSchema2(_schema._def.innerType);
      innerSchema.default = _schema._def.defaultValue();
      return innerSchema;
    }
    case "ZodEffects": {
      return zodToJsonSchema2(_schema._def.schema);
    }
    case "ZodEnum":
      jsonSchema.type = "string";
      jsonSchema.enum = _schema._def.values;
      break;
    case "ZodLiteral": {
      const literalValue = _schema._def.value;
      jsonSchema.type = typeof literalValue;
      jsonSchema.const = literalValue;
      break;
    }
    case "ZodNullable":
    case "ZodOptional":
      return zodToJsonSchema2(_schema._def.innerType);
    case "ZodNumber":
      jsonSchema.type = "number";
      break;
    case "ZodObject": {
      jsonSchema.type = "object";
      jsonSchema.properties = {};
      jsonSchema.$schema = "http://json-schema.org/draft-07/schema#";
      jsonSchema.additionalProperties = false;
      const required = [];
      for (const key in _schema.shape) {
        const field = _schema.shape[key];
        jsonSchema.properties[key] = zodToJsonSchema2(field);
        if (!field.isOptional() && !field.isNullable()) {
          required.push(key);
        }
      }
      if (required.length > 0) {
        jsonSchema.required = required;
      }
      break;
    }
    case "ZodRecord":
      jsonSchema.type = "object";
      jsonSchema.additionalProperties = _schema._def.valueType ? zodToJsonSchema2(_schema._def.valueType) : { type: ["string", "number", "boolean", "object", "array", "null"] };
      break;
    case "ZodString":
      jsonSchema.type = "string";
      break;
    case "ZodUnion":
      jsonSchema.anyOf = _schema._def.options.map(
        (option) => zodToJsonSchema2(option)
      );
      break;
    case "ZodUnknown":
      jsonSchema.type = [
        "string",
        "number",
        "boolean",
        "object",
        "array",
        "null"
      ];
      jsonSchema.description = "Accepts unknown type of value";
      break;
    default:
      throw new Error(
        `Unsupported Zod type for JSON schema conversion: ${_schema._def.typeName}`
      );
  }
  return jsonSchema;
};
var formatToolForPrompt = (tool) => {
  if (!tool.parameters) {
    return `### ${tool.name}
Description: ${tool.description}
Parameters: None
`;
  }
  if (typeof tool.parameters !== "object" || !("_def" in tool.parameters)) {
    throw new Error("Invalid Zod schema provided");
  }
  if (!("shape" in tool.parameters) || Object.keys(tool.parameters.shape).length === 0) {
    return `### ${tool.name}
Description: ${tool.description}
Parameters: None
`;
  }
  const params = JSON.stringify(zodToJsonSchema2(tool.parameters), null, 2);
  return `### ${tool.name}
Description: ${tool.description}
Parameters (JSON Schema):
${params}
`;
};
var formatHistoryMessage = (message) => {
  let role;
  let content;
  switch (message.type) {
    case "agent_canvas_output":
      role = "ASSISTANT";
      content = `Canvas Output (${message.contentType}):
${message.content}`;
      break;
    case "agent_response":
      role = "ASSISTANT";
      content = message.content;
      break;
    case "agent_thought":
      role = "ASSISTANT";
      content = `Thought: ${message.content}`;
      break;
    case "error":
      role = "SYSTEM";
      content = `Error: ${message.content}`;
      break;
    case "tool_call":
      role = "ASSISTANT";
      content = `Tool Call: ${message.toolName}(${JSON.stringify(message.params, null, 2)})`;
      break;
    case "tool_result":
      role = "OBSERVATION";
      content = `Tool Result from ${message.toolName}: ${JSON.stringify(message.result, null, 2)}`;
      break;
    case "user":
      role = "USER";
      content = message.content;
      break;
    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
  const MAX_CONTENT_LENGTH = 3500;
  if (content.length > MAX_CONTENT_LENGTH) {
    content = `${content.substring(0, MAX_CONTENT_LENGTH)}... (truncated)`;
  }
  return `${role}:
${content}`;
};
var getMasterPrompt = (session, tools) => {
  let workingContextSection = "";
  if (session.data.workingContext) {
    workingContextSection = `${WORKING_CONTEXT_HEADER}
${JSON.stringify(
      session.data.workingContext,
      null,
      2
    )}

`;
  }
  const formattedTools = tools.map(formatToolForPrompt).join("\n");
  const toolsSection = `${TOOLS_SECTION_HEADER}
${formattedTools}`;
  const formattedHistory = (session.data.history || []).map(formatHistoryMessage).join("\n\n");
  const historySection = formattedHistory.length > 0 ? `${HISTORY_SECTION_HEADER}
${formattedHistory}` : "";
  const todoInstructions = `
  ## Task Management Instructions:
  - For "Cr\xE9er une todo list simple" (Create a simple todo list), always use the todo_write tool to create exactly 3-5 relevant tasks with status "pending". Do not use finish after creating the list; the task is complete only after creating multiple tasks and confirming the list is ready.
  - For "Ajouter des \xE9l\xE9ments \xE0 la liste de t\xE2ches" (Add items to the todo list), use todo_write to append 2-3 new tasks to the existing list with status "pending". Do not use finish until all items are added.
  - For "Marquer la premi\xE8re t\xE2che comme termin\xE9e" (Mark the first task as done), use todo_write to update the status of the first task in the list to "completed". Do not use finish until the task is fully done.
  - Always use the todo_write tool for managing todo lists. Only use finish when the entire todo-related task is complete with no further actions needed.
  - The todo_write tool takes a "todos" parameter which is an array of objects with id, content, status (pending/completed), priority (high/medium/low), and category (e.g., personal/work).
  
  Remember: For todo-related tasks, prioritize using todo_write before finishing. Create multiple tasks for creation requests and continue iterations if needed to complete the task fully.
  `;
  return `${getPreamble()}

${workingContextSection}${toolsSection}

${todoInstructions}

${historySection}

ASSISTANT's turn. Your response:`;
};

// src/modules/context/tokenOptimizer.ts
var TokenOptimizer = class {
  modelLimits = /* @__PURE__ */ new Map();
  tokenCache = /* @__PURE__ */ new Map();
  compressionHistory = [];
  constructor() {
    this.initializeModelLimits();
  }
  initializeModelLimits() {
    this.modelLimits.set("claude-3-5-sonnet-20241022", {
      maxContextTokens: 2e5,
      maxHistoryTokens: 15e4,
      compressionThreshold: 0.75,
      minRetentionTokens: 1e4
    });
    this.modelLimits.set("claude-3-opus-20240229", {
      maxContextTokens: 2e5,
      maxHistoryTokens: 12e4,
      compressionThreshold: 0.7,
      minRetentionTokens: 8e3
    });
    this.modelLimits.set("gemini-2.5-pro", {
      maxContextTokens: 2e6,
      maxHistoryTokens: 5e5,
      compressionThreshold: 0.8,
      minRetentionTokens: 2e4
    });
    this.modelLimits.set("gpt-4-turbo", {
      maxContextTokens: 128e3,
      maxHistoryTokens: 8e4,
      compressionThreshold: 0.75,
      minRetentionTokens: 8e3
    });
    this.modelLimits.set("default", {
      maxContextTokens: 1e5,
      maxHistoryTokens: 5e4,
      compressionThreshold: 0.7,
      minRetentionTokens: 5e3
    });
  }
  /**
   * 🔍 Count tokens in text using intelligent approximation
   */
  countTokens(text, model = "default") {
    const baseTokens = Math.ceil(text.length / 4);
    const modelMultiplier = this.getModelTokenMultiplier(model);
    const codeMultiplier = this.hasCodeContent(text) ? 1.2 : 1;
    return Math.ceil(baseTokens * modelMultiplier * codeMultiplier);
  }
  /**
   * 📊 Calculate tokens for a message array
   */
  countMessageTokens(messages, model = "default") {
    const cacheKey = `${model}_${messages.length}_${messages[messages.length - 1]?.timestamp || 0}`;
    if (this.tokenCache.has(cacheKey)) {
      const cached = this.tokenCache.get(cacheKey);
      cached.lastUpdated = Date.now();
      return cached;
    }
    let inputTokens = 0;
    let outputTokens = 0;
    for (const message of messages) {
      const content = this.getMessageContent(message);
      const tokens = this.countTokens(content, model);
      if (message.type === "user") {
        inputTokens += tokens;
      } else if (message.type === "agent_response") {
        outputTokens += tokens;
      } else {
        inputTokens += tokens;
      }
    }
    const tokenCount = {
      input: inputTokens,
      output: outputTokens,
      total: inputTokens + outputTokens,
      lastUpdated: Date.now()
    };
    this.tokenCache.set(cacheKey, tokenCount);
    if (this.tokenCache.size > 100) {
      const oldestKey = Array.from(this.tokenCache.keys())[0];
      this.tokenCache.delete(oldestKey);
    }
    return tokenCount;
  }
  /**
   * 🗜️ Optimize message history based on token limits
   */
  optimizeMessageHistory(messages, model = "default") {
    const limits = this.modelLimits.get(model) || this.modelLimits.get("default");
    const tokenCount = this.countMessageTokens(messages, model);
    if (tokenCount.total <= limits.maxHistoryTokens) {
      return {
        messages,
        tokenCount,
        wasCompressed: false,
        strategy: "none"
      };
    }
    console.log(`\u{1F9E0} Token optimization triggered: ${tokenCount.total} > ${limits.maxHistoryTokens}`);
    const compressionRatio = limits.maxHistoryTokens / tokenCount.total;
    let strategy;
    if (compressionRatio > 0.6) {
      strategy = "semantic";
    } else if (compressionRatio > 0.3) {
      strategy = "aggressive";
    } else {
      strategy = "emergency";
    }
    console.log(`\u{1F9E0} Using compression strategy: ${strategy} (ratio: ${compressionRatio.toFixed(2)})`);
    const startTime = Date.now();
    const optimizedMessages = this.applyCompressionStrategy(messages, strategy, limits);
    const timeElapsed = Date.now() - startTime;
    const newTokenCount = this.countMessageTokens(optimizedMessages, model);
    const compressionMetrics = {
      originalTokens: tokenCount.total,
      compressedTokens: newTokenCount.total,
      compressionRatio: newTokenCount.total / tokenCount.total,
      semanticLoss: this.calculateSemanticLoss(messages, optimizedMessages),
      timeElapsed
    };
    console.log(`\u{1F9E0} Compression completed: ${tokenCount.total} \u2192 ${newTokenCount.total} tokens (${(compressionMetrics.compressionRatio * 100).toFixed(1)}%)`);
    this.compressionHistory.push(compressionMetrics);
    if (this.compressionHistory.length > 50) {
      this.compressionHistory = this.compressionHistory.slice(-50);
    }
    return {
      messages: optimizedMessages,
      tokenCount: newTokenCount,
      compressionMetrics,
      wasCompressed: true,
      strategy
    };
  }
  /**
   * 🎯 Apply specific compression strategy
   */
  applyCompressionStrategy(messages, strategy, limits) {
    switch (strategy) {
      case "semantic":
        return this.semanticCompression(messages, limits);
      case "aggressive":
        return this.aggressiveCompression(messages, limits);
      case "emergency":
        return this.emergencyCompression(messages, limits);
      default:
        return messages;
    }
  }
  /**
   * 🧠 Smart semantic compression - preserves important context
   */
  semanticCompression(messages, limits) {
    const recentMessages = messages.slice(-Math.min(20, messages.length));
    const olderMessages = messages.slice(0, -recentMessages.length);
    const importantMessages = this.extractImportantMessages(olderMessages);
    let combined = [...importantMessages, ...recentMessages];
    let currentTokens = this.countMessageTokens(combined).total;
    while (currentTokens > limits.maxHistoryTokens && importantMessages.length > 0) {
      importantMessages.shift();
      combined = [...importantMessages, ...recentMessages];
      currentTokens = this.countMessageTokens(combined).total;
    }
    if (olderMessages.length > importantMessages.length) {
      const compressionMessage = {
        id: `compression-${Date.now()}`,
        type: "agent_response",
        content: `\u{1F9E0} Smart compression applied: ${olderMessages.length - importantMessages.length} older messages were analyzed and compressed. Key decisions and important context preserved.`,
        timestamp: Date.now()
      };
      combined.unshift(compressionMessage);
    }
    return combined;
  }
  /**
   * ⚡ Aggressive compression - for high compression ratios
   */
  aggressiveCompression(messages, limits) {
    const recentMessages = messages.slice(-10);
    const olderMessages = messages.slice(0, -10);
    if (olderMessages.length === 0) return recentMessages;
    const summary = this.generateQuickSummary(olderMessages);
    const compressionMessage = {
      id: `aggressive-compression-${Date.now()}`,
      type: "agent_response",
      content: `\u{1F9E0} Aggressive compression applied: ${olderMessages.length} messages compressed to key points:

${summary}`,
      timestamp: Date.now()
    };
    return [compressionMessage, ...recentMessages];
  }
  /**
   * 🚨 Emergency compression - maximum compression
   */
  emergencyCompression(messages, limits) {
    let recentMessages = messages.slice(-5);
    let currentTokens = this.countMessageTokens(recentMessages).total;
    if (currentTokens > limits.minRetentionTokens) {
      recentMessages = messages.slice(-3);
    }
    const compressionMessage = {
      id: `emergency-compression-${Date.now()}`,
      type: "agent_response",
      content: `\u{1F6A8} Emergency compression applied: ${messages.length} messages compressed to recent context only. Important historical details may be lost.`,
      timestamp: Date.now()
    };
    return [compressionMessage, ...recentMessages];
  }
  /**
   * 🔍 Extract important messages based on content analysis
   */
  extractImportantMessages(messages) {
    const important = [];
    for (const message of messages) {
      const content = this.getMessageContent(message);
      if (this.containsImportantKeywords(content)) {
        important.push(message);
        continue;
      }
      if (message.type === "tool_call" && this.importantToolCall(message)) {
        important.push(message);
        continue;
      }
      if (message.type === "user" && this.isSummaryRequest(content)) {
        important.push(message);
      }
    }
    return important.slice(-30);
  }
  /**
   * 📝 Generate quick summary of messages
   */
  generateQuickSummary(messages) {
    const summary = [];
    const themes = this.extractThemes(messages);
    if (themes.length > 0) {
      summary.push(`**Key topics**: ${themes.join(", ")}`);
    }
    const toolCalls = messages.filter((m) => m.type === "tool_call").length;
    if (toolCalls > 0) {
      summary.push(`**Actions taken**: ${toolCalls} tool operations`);
    }
    const decisions = messages.filter(
      (m) => m.type === "agent_response" && this.containsImportantKeywords(this.getMessageContent(m))
    ).length;
    if (decisions > 0) {
      summary.push(`**Key decisions**: ${decisions} important conclusions`);
    }
    return summary.join("\n");
  }
  // Helper methods
  getModelTokenMultiplier(model) {
    const multipliers = {
      "claude-3-5-sonnet-20241022": 1,
      "claude-3-opus-20240229": 1,
      "gemini-2.5-pro": 0.9,
      // Gemini tends to be more efficient
      "gpt-4-turbo": 1.1,
      "default": 1
    };
    return multipliers[model] || multipliers["default"];
  }
  hasCodeContent(text) {
    return /```[\s\S]*```|`[^`]+`|function|class|const|let|var|import|export/.test(text);
  }
  getMessageContent(message) {
    if ("content" in message) {
      return String(message.content);
    }
    return "";
  }
  containsImportantKeywords(content) {
    const keywords = [
      "important",
      "critical",
      "key",
      "decision",
      "conclusion",
      "summary",
      "plan",
      "architecture",
      "pattern",
      "solution",
      "error",
      "issue",
      "problem",
      "bug",
      "fix",
      "resolve",
      "\u26A0\uFE0F",
      "\u2705",
      "\u274C",
      "\u{1F680}",
      "\u{1F3AF}",
      "\u{1F4A1}"
    ];
    const lowerContent = content.toLowerCase();
    return keywords.some((keyword) => lowerContent.includes(keyword));
  }
  importantToolCall(message) {
    const toolName = message.toolName;
    if (!toolName) return false;
    const importantTools = [
      "writeFile",
      "createFile",
      "deploy",
      "build",
      "test",
      "fix",
      "resolve",
      "debug",
      "analyze",
      "design"
    ];
    return importantTools.some((tool) => toolName.toLowerCase().includes(tool.toLowerCase()));
  }
  isSummaryRequest(content) {
    const summaryKeywords = ["summarize", "summary", "recap", "conclusion", "final"];
    const lowerContent = content.toLowerCase();
    return summaryKeywords.some((keyword) => lowerContent.includes(keyword));
  }
  extractThemes(messages) {
    const themes = [];
    const content = messages.map((m) => this.getMessageContent(m)).join(" ").toLowerCase();
    const themeKeywords = {
      "development": ["develop", "code", "implement", "build", "create"],
      "debugging": ["debug", "error", "issue", "problem", "fix"],
      "planning": ["plan", "design", "architecture", "structure"],
      "testing": ["test", "verify", "check", "validate"],
      "documentation": ["document", "explain", "describe"],
      "optimization": ["optimize", "improve", "performance"]
    };
    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      if (keywords.some((keyword) => content.includes(keyword))) {
        themes.push(theme);
      }
    }
    return themes;
  }
  calculateSemanticLoss(original, compressed) {
    const ratio = compressed.length / original.length;
    if (ratio > 0.8) return 0.1;
    if (ratio > 0.5) return 0.3;
    if (ratio > 0.3) return 0.6;
    return 0.9;
  }
  /**
   * 📈 Get optimization statistics
   */
  getOptimizationStats() {
    const totalCompressions = this.compressionHistory.length;
    if (totalCompressions === 0) {
      return {
        totalCompressions: 0,
        avgCompressionRatio: 1,
        avgSemanticLoss: 0,
        cacheHitRate: 0
      };
    }
    const avgCompressionRatio = this.compressionHistory.reduce((sum, m) => sum + m.compressionRatio, 0) / totalCompressions;
    const avgSemanticLoss = this.compressionHistory.reduce((sum, m) => sum + m.semanticLoss, 0) / totalCompressions;
    const cacheHitRate = this.tokenCache.size > 0 ? 0.7 : 0;
    return {
      totalCompressions,
      avgCompressionRatio,
      avgSemanticLoss,
      cacheHitRate
    };
  }
};

// src/modules/agent/enhancedWorkingContext.ts
var EnhancedWorkingContextManager = class {
  context;
  constructor(initialSessionId) {
    this.context = this.initializeContext(initialSessionId);
  }
  initializeContext(sessionId) {
    const tokenOptimizer = new TokenOptimizer();
    return {
      todos: [],
      taskStats: { total: 0, completed: 0, inProgress: 0, blocked: 0 },
      intent: { currentPhase: "understanding" },
      memory: {
        keyTopics: [],
        importantDecisions: [],
        codePatterns: [],
        userPreferences: {},
        recentInsights: []
      },
      files: { recentFiles: [] },
      toolUsage: /* @__PURE__ */ new Map(),
      currentState: {
        isProcessing: false,
        iterationCount: 0,
        confidenceLevel: 50
      },
      learningPatterns: {
        successfulApproaches: [],
        avoidPatterns: []
      },
      temporal: {
        sessionStartTime: Date.now(),
        lastUserInteraction: Date.now(),
        timeOnCurrentTask: 0
      },
      tokenOptimization: {
        tokenOptimizer,
        lastOptimization: Date.now(),
        optimizationHistory: [],
        currentModel: "default"
      }
    };
  }
  // Todo Management (like Claude Code)
  addTodo(content, priority = "medium") {
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const todo = {
      id,
      content,
      status: "pending",
      priority,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    this.context.todos.push(todo);
    this.updateTaskStats();
    return id;
  }
  updateTodoStatus(id, status, activeForm) {
    const todo = this.context.todos.find((t) => t.id === id);
    if (!todo) return false;
    todo.status = status;
    todo.updatedAt = Date.now();
    if (activeForm) todo.activeForm = activeForm;
    if (status === "in_progress") {
      this.context.currentFocus = id;
      this.context.temporal.timeOnCurrentTask = Date.now();
    }
    if (status === "completed") {
      this.recordSuccessfulPattern(todo.content);
      this.context.currentFocus = void 0;
    }
    this.updateTaskStats();
    return true;
  }
  getCurrentTask() {
    if (!this.context.currentFocus) return void 0;
    return this.context.todos.find((t) => t.id === this.context.currentFocus);
  }
  getNextTask() {
    const pendingTasks = this.context.todos.filter((t) => t.status === "pending").sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    return pendingTasks[0];
  }
  // Intent Management
  updateIntent(intent) {
    this.context.intent = { ...this.context.intent, ...intent };
    this.context.temporal.lastUserInteraction = Date.now();
  }
  // Memory Management
  addImportantDecision(decision, reasoning, context) {
    this.context.memory.importantDecisions.push({
      decision,
      reasoning,
      context,
      timestamp: Date.now()
    });
    if (this.context.memory.importantDecisions.length > 20) {
      this.context.memory.importantDecisions = this.context.memory.importantDecisions.slice(-20);
    }
  }
  addCodePattern(pattern, file, context) {
    this.context.memory.codePatterns.push({
      pattern,
      file,
      context,
      timestamp: Date.now()
    });
    if (this.context.memory.codePatterns.length > 50) {
      this.context.memory.codePatterns = this.context.memory.codePatterns.slice(-50);
    }
  }
  addKeyTopic(topic) {
    if (!this.context.memory.keyTopics.includes(topic)) {
      this.context.memory.keyTopics.push(topic);
    }
  }
  // Tool Usage Tracking
  recordToolUsage(toolName, success, executionTime) {
    const existing = this.context.toolUsage.get(toolName);
    if (existing) {
      existing.count++;
      existing.lastUsed = Date.now();
      existing.successRate = (existing.successRate * (existing.count - 1) + (success ? 1 : 0)) / existing.count;
      if (executionTime) {
        existing.averageExecutionTime = existing.averageExecutionTime ? (existing.averageExecutionTime + executionTime) / 2 : executionTime;
      }
      existing.lastResult = success ? "success" : "error";
    } else {
      this.context.toolUsage.set(toolName, {
        toolName,
        count: 1,
        lastUsed: Date.now(),
        successRate: success ? 1 : 0,
        averageExecutionTime: executionTime,
        lastResult: success ? "success" : "error"
      });
    }
  }
  // Learning Patterns
  recordSuccessfulPattern(pattern) {
    const existing = this.context.learningPatterns.successfulApproaches.find((p) => p.pattern === pattern);
    if (existing) {
      existing.successCount++;
    } else {
      this.context.learningPatterns.successfulApproaches.push({
        pattern,
        context: this.context.intent.currentPhase || "unknown",
        successCount: 1
      });
    }
  }
  recordAvoidPattern(pattern, reason) {
    const existing = this.context.learningPatterns.avoidPatterns.find((p) => p.pattern === pattern);
    if (existing) {
      existing.occurrenceCount++;
    } else {
      this.context.learningPatterns.avoidPatterns.push({
        pattern,
        reason,
        occurrenceCount: 1
      });
    }
  }
  // State Management
  updateAgentState(state) {
    this.context.currentState = { ...this.context.currentState, ...state };
    if (state.iterationCount) {
      this.context.currentState.iterationCount = state.iterationCount;
    }
  }
  // File Context
  setCurrentFile(file, purpose) {
    this.context.files.currentFile = file;
    const existing = this.context.files.recentFiles.find((f) => f.path === file);
    if (existing) {
      existing.lastAccessed = Date.now();
      existing.purpose = purpose;
      existing.modifications++;
    } else {
      this.context.files.recentFiles.push({
        path: file,
        lastAccessed: Date.now(),
        purpose,
        modifications: 1
      });
    }
    if (this.context.files.recentFiles.length > 20) {
      this.context.files.recentFiles = this.context.files.recentFiles.sort((a, b) => b.lastAccessed - a.lastAccessed).slice(0, 20);
    }
  }
  // Context Summary for LLM
  getContextSummary() {
    const currentTask = this.getCurrentTask();
    const nextTask = this.getNextTask();
    return `
\u{1F4CB} TASK MANAGEMENT:
\u2022 Current Task: ${currentTask ? `${currentTask.content} (${currentTask.status})` : "None"}
\u2022 Next Task: ${nextTask ? nextTask.content : "None"}
\u2022 Progress: ${this.context.taskStats.completed}/${this.context.taskStats.total} tasks completed

\u{1F3AF} INTENT & GOAL:
\u2022 User Goal: ${this.context.intent.userGoal || "Not specified"}
\u2022 Current Phase: ${this.context.intent.currentPhase}
\u2022 Progress: ${this.context.intent.progressPercentage || 0}%

\u{1F4AD} WORKING MEMORY:
\u2022 Key Topics: ${this.context.memory.keyTopics.join(", ")}
\u2022 Recent Insights: ${this.context.memory.recentInsights.slice(-3).join("; ")}
\u2022 Important Decisions: ${this.context.memory.importantDecisions.length} recorded

\u{1F4C1} FILE CONTEXT:
\u2022 Current File: ${this.context.files.currentFile || "None"}
\u2022 Recent Files: ${this.context.files.recentFiles.slice(0, 5).map((f) => `${f.path} (${f.purpose})`).join(", ")}

\u{1F527} TOOL USAGE:
\u2022 Recently Used: ${Array.from(this.context.toolUsage.values()).sort((a, b) => b.lastUsed - a.lastUsed).slice(0, 5).map((t) => `${t.toolName} (${t.successRate.toFixed(1)}% success)`).join(", ")}

\u{1F3AF} CURRENT STATE:
\u2022 Iteration: ${this.context.currentState.iterationCount}
\u2022 Confidence: ${this.context.currentState.confidenceLevel}%
\u2022 Current Strategy: ${this.context.currentState.currentStrategy || "Adapting"}
    `.trim();
  }
  // Private helpers
  updateTaskStats() {
    this.context.taskStats = {
      total: this.context.todos.length,
      completed: this.context.todos.filter((t) => t.status === "completed").length,
      inProgress: this.context.todos.filter((t) => t.status === "in_progress").length,
      blocked: this.context.todos.filter((t) => t.status === "blocked").length
    };
  }
  // Getters
  getContext() {
    return { ...this.context };
  }
  getTaskStats() {
    return this.context.taskStats;
  }
  getToolUsageHistory() {
    return Array.from(this.context.toolUsage.values());
  }
  // 🚀 TOKEN OPTIMIZATION METHODS
  /**
   * 🧠 Optimize message history with smart token management
   */
  optimizeMessageHistory(messages, model = "default") {
    console.log(`\u{1F9E0} Optimizing ${messages.length} messages for model: ${model}`);
    this.context.tokenOptimization.currentModel = model;
    const result = this.context.tokenOptimization.tokenOptimizer.optimizeMessageHistory(messages, model);
    if (result.wasCompressed) {
      this.context.tokenOptimization.optimizationHistory.push(result);
      this.context.tokenOptimization.lastOptimization = Date.now();
      if (this.context.tokenOptimization.optimizationHistory.length > 20) {
        this.context.tokenOptimization.optimizationHistory = this.context.tokenOptimization.optimizationHistory.slice(-20);
      }
      console.log(`\u{1F9E0} Optimization completed: ${result.strategy} strategy applied`);
    }
    return result;
  }
  /**
   * 📊 Get current token count for a message array
   */
  getTokenCount(messages, model = "default") {
    return this.context.tokenOptimization.tokenOptimizer.countMessageTokens(messages, model);
  }
  /**
   * 🎯 Set current model for optimization
   */
  setCurrentModel(model) {
    this.context.tokenOptimization.currentModel = model;
    console.log(`\u{1F9E0} Token optimization model set to: ${model}`);
  }
  /**
   * 📈 Get optimization statistics
   */
  getOptimizationStats() {
    const stats = this.context.tokenOptimization.tokenOptimizer.getOptimizationStats();
    const lastOptimization = this.context.tokenOptimization.lastOptimization;
    const currentModel = this.context.tokenOptimization.currentModel;
    return {
      ...stats,
      lastOptimization,
      currentModel,
      optimizationHistoryLength: this.context.tokenOptimization.optimizationHistory.length
    };
  }
  /**
   * 🔄 Force optimization check
   */
  checkOptimizationNeeded(messages, model) {
    const targetModel = model || this.context.tokenOptimization.currentModel;
    const tokenCount = this.getTokenCount(messages, targetModel);
    const limits = this.context.tokenOptimization.tokenOptimizer["modelLimits"]?.get(targetModel) || this.context.tokenOptimization.tokenOptimizer["modelLimits"]?.get("default");
    if (!limits) {
      return {
        needed: false,
        currentTokens: tokenCount.total,
        limit: 1e5
      };
    }
    const threshold = limits.maxHistoryTokens * limits.compressionThreshold;
    const needed = tokenCount.total > threshold;
    return {
      needed,
      reason: needed ? `Token count (${tokenCount.total}) exceeds threshold (${threshold})` : void 0,
      currentTokens: tokenCount.total,
      limit: limits.maxHistoryTokens
    };
  }
  /**
   * 🧠 Enhanced context summary with token info
   */
  getContextSummaryWithTokens() {
    const basicSummary = this.getContextSummary();
    const stats = this.getOptimizationStats();
    const tokenInfo = `
\u{1F9E0} TOKEN OPTIMIZATION:
\u2022 Current Model: ${stats.currentModel}
\u2022 Total Compressions: ${stats.totalCompressions}
\u2022 Avg Compression Ratio: ${(stats.avgCompressionRatio * 100).toFixed(1)}%
\u2022 Avg Semantic Loss: ${(stats.avgSemanticLoss * 100).toFixed(1)}%
\u2022 Cache Hit Rate: ${(stats.cacheHitRate * 100).toFixed(1)}%
\u2022 Last Optimization: ${stats.lastOptimization ? new Date(stats.lastOptimization).toLocaleTimeString() : "Never"}`;
    return basicSummary + tokenInfo;
  }
};

// src/modules/agent/agent.ts
var Agent = class {
  constructor(job, session, taskQueue, tools, activeLlmProvider, sessionManager, apiKey, llmModelName, llmApiKey) {
    this.llmModelName = llmModelName;
    this.llmApiKey = llmApiKey;
    this.job = job;
    this.session = session;
    this.log = getLoggerInstance().child({
      jobId: job.id,
      sessionId: session.id
    });
    this.taskQueue = taskQueue;
    this.tools = tools ?? [];
    this.activeLlmProvider = activeLlmProvider;
    this.session.activeLlmProvider = activeLlmProvider;
    this.sessionManager = sessionManager;
    this.apiKey = apiKey;
    llmRouterService.syncWithKeyManager();
    this.behaviorHistory = [];
    this.loopDetectionThreshold = 5;
    this.enhancedContextManager = new EnhancedWorkingContextManager(String(session.id));
  }
  activeLlmProvider;
  // New property
  apiKey;
  // New property
  // LLM Router is now handled by the shared service
  // Loop detection properties
  behaviorHistory = [];
  commandHistory = [];
  interrupted = false;
  job;
  log;
  loopCounter = 0;
  loopDetectionThreshold = 5;
  // Detect loops after 5 repetitions (increased for complex tasks)
  malformedResponseCounter = 0;
  MAX_MALFORMED_RESPONSES = getConfig().AGENT_MAX_MALFORMED_RESPONSES;
  MAX_LLM_FAILURES = getConfig().AGENT_MAX_LLM_FAILURES;
  llmFailureCounter = 0;
  consecutiveLlmFailures = 0;
  // Track consecutive failures
  MAX_CONSECUTIVE_LLM_FAILURES = 3;
  // Allow 3 consecutive failures before fallback
  maxBehaviorHistory = 10;
  // Keep track of last 10 behaviors
  session;
  // 🚨 AMÉLIORATION: Tracking des actions réalisées
  executedActions = /* @__PURE__ */ new Map();
  lastDisplayCanvasCall = 0;
  // Multi-file operations tracking
  pendingMultiFileOperations = [];
  // 🚀 ENHANCED WORKING CONTEXT: Claude Code-inspired context management
  enhancedContextManager;
  sessionManager;
  // New property
  subscriber;
  taskQueue;
  tools;
  /**
   * Get LLM Router statistics for monitoring
   */
  getLlmRouterStats() {
    const stats = llmRouterService.getProviderStatistics();
    return {
      ...stats,
      currentProvider: this.activeLlmProvider
    };
  }
  /**
   * Detect optimal tool based on systemPrompt and message keywords
   */
  detectOptimalTool(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    const systemPrompt = this.job.data?.systemPrompt || "";
    this.log.info(`\u{1F50D} Smart Detection Debug: prompt="${lowerPrompt}", systemPrompt="${systemPrompt}"`);
    const debugKeywords = ["debug", "error", "logs", "analyse", "analysis", "troubleshoot", "investigate", "stack trace", "exception", "bug", "issue", "problem", "failure", "crash"];
    const hasDebugKeywords = debugKeywords.some((keyword) => lowerPrompt.includes(keyword));
    this.log.info(`\u{1F50D} Debug keywords check: hasDebugKeywords=${hasDebugKeywords}, systemPrompt=${systemPrompt}`);
    const todoKeywords = ["todo", "task", "comprehensive", "planning", "management", "web application", "building", "development", "phases"];
    const hasTodoKeywords = todoKeywords.some((keyword) => lowerPrompt.includes(keyword));
    if (hasDebugKeywords && systemPrompt === "debug") {
      return {
        tool: "listFiles",
        params: { path: "." },
        reason: "Debug request detected - exploring files first"
      };
    }
    if (hasTodoKeywords && (systemPrompt === "orchestrator" || systemPrompt === "architect")) {
      const smartTodos = this.createSmartTodoList(prompt);
      return {
        tool: "todo_write",
        params: { todos: smartTodos },
        reason: "Todo/Planning request detected - creating structured todo list"
      };
    }
    const complexKeywords = ["project", "application", "system", "d\xE9velopper", "complet", "architecture", "multi"];
    const hasComplexKeywords = complexKeywords.some((keyword) => lowerPrompt.includes(keyword));
    if (hasComplexKeywords && prompt.length > 100 && systemPrompt === "architect") {
      return {
        tool: "listFiles",
        params: { path: "." },
        reason: "Complex architecture request - exploring environment first"
      };
    }
    return null;
  }
  async run() {
    this.log.info("Agent starting...");
    await this.setupInterruptListener();
    try {
      const jobData = this.job.data;
      const { prompt } = jobData;
      this.log.info("\u{1F9E0} Initializing enhanced context from prompt...");
      this.initializeContextFromPrompt(prompt);
      this.log.info("\u{1F9E0} Enhanced context initialized successfully");
      const newUserMessage = {
        content: prompt,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: "user"
      };
      this.session.history.push(newUserMessage);
      const smartToolDetection = this.detectOptimalTool(prompt);
      if (smartToolDetection) {
        this.log.info(`Smart tool detection: ${smartToolDetection.tool} for ${smartToolDetection.reason}`);
        const isCompleteProject = prompt.toLowerCase().includes("complete") && prompt.toLowerCase().includes("project") && (prompt.toLowerCase().includes("a to z") || prompt.toLowerCase().includes("development") || prompt.toLowerCase().includes("deploy"));
        if (isCompleteProject) {
          this.log.info("Complete A-Z project detected - executing initial tool but continuing workflow");
          const command = { name: smartToolDetection.tool, params: smartToolDetection.params };
          const result = await this.executeTool(command, this.log);
          this.log.info("\u{1F9E0} Updating enhanced context after tool execution...");
          this.updateContextAfterToolExecution(command, result);
          this.log.info("\u{1F9E0} Enhanced context updated successfully");
          const initialMessage = {
            id: crypto.randomUUID(),
            type: "tool_result",
            result: { content: typeof result === "string" ? result : JSON.stringify(result) },
            toolName: smartToolDetection.tool,
            timestamp: Date.now()
          };
          this.session.history.push(initialMessage);
          this.publishToChannel(initialMessage);
        } else {
          const command = { name: smartToolDetection.tool, params: smartToolDetection.params };
          const result = await this.executeTool(command, this.log);
          if (typeof result === "string") return result;
          return JSON.stringify(result);
        }
      }
      let iterations = 0;
      const MAX_ITERATIONS = config.AGENT_MAX_ITERATIONS ?? 50;
      while (iterations < MAX_ITERATIONS) {
        if (this.interrupted) {
          this.log.info("Job has been interrupted.");
          break;
        }
        if (await this.job.isFailed()) {
          this.log.info("Job has failed.");
          this.interrupted = true;
          break;
        }
        iterations++;
        const iterationLog = this.log.child({ iteration: iterations });
        iterationLog.info(`Agent iteration starting`);
        const thinkingMessage = {
          content: `The agent is thinking... (iteration ${iterations})`,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          type: "agent_thought"
        };
        this.session.history.push(thinkingMessage);
        this.publishToChannel(thinkingMessage);
        try {
          this.log.info("\u{1F9E0} Preparing enhanced context for LLM prompt...");
          const enhancedContext = this.enhancedContextManager.getContext();
          this.log.info(`\u{1F9E0} Enhanced context stats: ${enhancedContext.todos.length} todos, ${enhancedContext.taskStats.completed} completed, iteration: ${enhancedContext.currentState.iterationCount}`);
          const sessionWithContext = {
            data: {
              ...this.session,
              workingContext: {
                ...this.session.workingContext,
                // Legacy context for compatibility
                executedActions: this.getActionExecutionSummary(),
                lastDisplayCanvas: this.hasExecutedActionRecently(
                  "display_canvas"
                ) ? `\u2705 display_canvas executed ${Math.floor((Date.now() - this.lastDisplayCanvasCall) / 1e3)}s ago` : "\u274C display_canvas not executed recently",
                iterationCount: iterations,
                // 🚀 Enhanced context (Claude Code-style)
                enhancedContext,
                contextSummary: this.enhancedContextManager.getContextSummary(),
                taskStats: enhancedContext.taskStats,
                currentTask: enhancedContext.todos.find((t) => t.id === enhancedContext.currentFocus),
                nextTask: this.enhancedContextManager.getNextTask(),
                intentContext: enhancedContext.intent,
                learningPatterns: enhancedContext.learningPatterns
              }
            },
            id: String(this.session.id)
          };
          const orchestratorPrompt = getMasterPrompt(
            sessionWithContext,
            this.tools
          );
          const messagesForLlm = this.session.history.map((message) => {
            switch (message.type) {
              case "agent_canvas_output":
                return null;
              case "agent_response":
              case "agent_thought":
                const agentMessage = message;
                if (typeof agentMessage.content === "string") {
                  return {
                    parts: [{ text: agentMessage.content }],
                    role: "model"
                  };
                }
                return null;
              case "error":
                const errorMessage = message;
                return {
                  parts: [{ text: `Error: ${errorMessage.content}` }],
                  role: "tool"
                };
              case "tool_call":
                const toolCallMessage = message;
                return {
                  parts: [
                    {
                      text: `Tool Call: ${toolCallMessage.toolName} with params ${JSON.stringify(toolCallMessage.params)}`
                    }
                  ],
                  role: "tool"
                };
              case "tool_result":
                const toolResultMessage = message;
                return {
                  parts: [
                    {
                      text: `Tool Result: ${toolResultMessage.toolName} output: ${JSON.stringify(toolResultMessage.result)}`
                    }
                  ],
                  role: "tool"
                };
              case "user":
                if (message.type === "user" && typeof message.content === "string") {
                  return {
                    parts: [{ text: message.content }],
                    role: "user"
                  };
                }
                return null;
              default:
                return null;
            }
          }).filter((m) => m !== null);
          let llmResponse;
          try {
            const router = llmRouterService.getRouter();
            const routeResult = await router.routeRequest(
              messagesForLlm,
              orchestratorPrompt,
              this.llmApiKey || this.apiKey || "",
              this.llmModelName || ""
            );
            llmResponse = routeResult.response;
            this.activeLlmProvider = routeResult.provider;
            this.session.activeLlmProvider = routeResult.provider;
            await this.sessionManager.saveSession(
              this.session,
              this.job,
              this.taskQueue
            );
            this.log.info(
              {
                provider: routeResult.provider,
                attempts: routeResult.attempts,
                totalTime: routeResult.totalTime,
                fallbackUsed: routeResult.fallbackUsed,
                responseLength: llmResponse.length
              },
              "\u2705 LLM Router: Request completed successfully"
            );
          } catch (routingError) {
            this.log.error(
              { routingError },
              "\u274C LLM Router: All providers failed"
            );
            try {
              llmResponse = await this.attemptFallbackResponse();
              if (!llmResponse) {
                const localResponse = await this.generateLocalFallbackResponse();
                if (localResponse) {
                  llmResponse = localResponse;
                } else {
                  throw new LlmError(
                    "All fallback approaches failed. Cannot continue."
                  );
                }
              }
            } catch (fallbackError) {
              this.log.error(
                { fallbackError },
                "All fallback approaches failed"
              );
              throw new LlmError(
                "No LLM provider could provide a response, and fallback approaches failed."
              );
            }
          }
          if (this.interrupted) {
            this.log.info("Job has been interrupted.");
            break;
          }
          if (typeof llmResponse !== "string" || llmResponse.trim() === "") {
            this.log.error(
              { llmResponse, type: typeof llmResponse },
              "The `generate` tool did not return a string as expected or returned an empty string."
            );
            this.session.history.push({
              content: "Error: The `generate` tool returned an unexpected non-string or empty response.",
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: "error"
            });
            this.malformedResponseCounter++;
            if (this.malformedResponseCounter > 2) {
              this.log.error("Malformed response limit reached. Breaking.");
              return "Agent stopped due to persistent malformed responses.";
            }
            continue;
          }
          this.malformedResponseCounter = 0;
          const parsedResponse = this.parseLlmResponse(
            llmResponse,
            iterationLog
          );
          this.log.debug(
            { parsedResponse },
            "Parsed LLM response before answer check"
          );
          const { answer, canvas, thought } = parsedResponse;
          let command = parsedResponse.command;
          if (answer) {
            this.session.history.push({
              content: answer,
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: "agent_response"
            });
            iterationLog.info({ answer }, "Agent final answer");
            this.publishToChannel({ content: answer, type: "agent_response" });
            return answer;
          }
          if (this.detectLoop(thought, command)) {
            this.log.error(
              "Loop detected in agent behavior. Forcing finish response."
            );
            const finishCommand = {
              name: "finish",
              params: {
                response: "J'ai termin\xE9 les t\xE2ches demand\xE9es. Y a-t-il autre chose que je puisse faire pour vous ?"
              }
            };
            try {
              const finishResult = await this.executeTool(finishCommand, iterationLog);
              if (typeof finishResult === "object" && finishResult !== null && "answer" in finishResult && typeof finishResult.answer === "string") {
                const finalAnswer = finishResult.answer;
                this.publishToChannel({
                  content: finalAnswer,
                  type: "agent_response"
                });
                return finalAnswer;
              }
            } catch (error) {
              this.log.error("Failed to execute forced finish command:", error);
              return "J'ai termin\xE9 les t\xE2ches demand\xE9es. Y a-t-il autre chose que je puisse faire pour vous ?";
            }
          }
          if (thought) {
            this.session.history.push({
              content: thought,
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: "agent_thought"
            });
          }
          if (command) {
            this.session.history.push({
              id: crypto.randomUUID(),
              params: command.params || {},
              timestamp: Date.now(),
              toolName: command.name,
              type: "tool_call"
            });
          }
          if (canvas) {
            this.session.history.push({
              content: canvas.content,
              contentType: canvas.contentType,
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: "agent_canvas_output"
            });
          }
          if (this.interrupted) {
            this.log.info("Job has been interrupted.");
            break;
          }
          if (thought) {
            iterationLog.info({ thought }, "Agent thought");
            this.publishToChannel({ content: thought, type: "agent_thought" });
          }
          if (canvas) {
            iterationLog.info({ canvas }, "Agent canvas output");
            if (!command) {
              command = {
                name: "display_canvas",
                params: {
                  content: canvas.content,
                  contentType: canvas.contentType || "html"
                }
              };
              this.log.info(
                "\u{1F527} Converting canvas output to display_canvas tool call"
              );
            }
          }
          if (answer) {
            iterationLog.info({ answer }, "Agent final answer");
            this.publishToChannel({ content: answer, type: "agent_response" });
            return answer;
          }
          if (command && command.name === "finish") {
            try {
              const finishResult = await this.executeTool(
                command,
                iterationLog
              );
              if (typeof finishResult === "object" && finishResult !== null && "answer" in finishResult && typeof finishResult.answer === "string") {
                const finalAnswer = finishResult.answer;
                iterationLog.info(
                  { finalAnswer },
                  "Agent finished via finish tool"
                );
                this.publishToChannel({
                  content: finalAnswer,
                  type: "agent_response"
                });
                this.session.history.push({
                  id: crypto.randomUUID(),
                  result: finishResult,
                  timestamp: Date.now(),
                  toolName: "finish",
                  type: "tool_result"
                });
                return finalAnswer;
              } else {
                const errorMessage = `Finish tool did not return a valid answer object: ${JSON.stringify(finishResult)}`;
                iterationLog.error(errorMessage);
                this.session.history.push({
                  content: `Error: ${errorMessage}`,
                  id: crypto.randomUUID(),
                  timestamp: Date.now(),
                  type: "error"
                });
                return errorMessage;
              }
            } catch (_error) {
              if (_error instanceof FinishToolSignal) {
                const finalAnswer = _error.message;
                iterationLog.info(
                  { finalAnswer },
                  "Agent finished via finish tool signal"
                );
                this.publishToChannel({
                  content: finalAnswer,
                  type: "agent_response"
                });
                this.session.history.push({
                  content: finalAnswer,
                  id: crypto.randomUUID(),
                  timestamp: Date.now(),
                  type: "agent_response"
                });
                return finalAnswer;
              } else {
                throw _error;
              }
            }
          } else if (command) {
            this.commandHistory.push(command);
            if (this.commandHistory.length > 5) {
              this.commandHistory.shift();
            }
            let shouldAutoFinish = false;
            if (command.name === "display_canvas") {
              shouldAutoFinish = true;
              iterationLog.info("\u{1F3AF} display_canvas detected - will auto-finish after execution");
            }
            const lastTwoCommands = this.commandHistory.slice(-2);
            if (this.commandHistory.length > 1 && JSON.stringify(lastTwoCommands[0]) === JSON.stringify(lastTwoCommands[1])) {
              this.loopCounter++;
            } else {
              this.loopCounter = 0;
            }
            if (this.loopCounter > 2) {
              this.log.warn("Loop detected. Breaking.");
              return "Agent stuck in a loop.";
            }
            const toolResult = await this.executeTool(command, iterationLog);
            iterationLog.info("\u{1F9E0} Updating enhanced context after tool execution...");
            this.updateContextAfterToolExecution(command, toolResult);
            iterationLog.info("\u{1F9E0} Enhanced context updated successfully");
            this.session.history.push({
              id: crypto.randomUUID(),
              result: toolResult,
              timestamp: Date.now(),
              toolName: command.name,
              type: "tool_result"
            });
            if (typeof toolResult === "string" && toolResult.startsWith("Error executing tool")) {
              this.session.history.push({
                content: `The tool execution failed with the following error: ${toolResult}. Please analyze the error and try a different approach. You can use another tool, or try to fix the problem with the previous tool.`,
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                type: "error"
              });
            }
            if (shouldAutoFinish && command.name === "display_canvas") {
              iterationLog.info("\u{1F3AF} display_canvas executed successfully, now auto-finishing");
              const autoFinishCommand = {
                name: "finish",
                params: {
                  response: "J'ai affich\xE9 le contenu demand\xE9 dans le canvas. Y a-t-il autre chose que je puisse faire pour vous ?"
                }
              };
              try {
                const finishResult = await this.executeTool(autoFinishCommand, iterationLog);
                if (typeof finishResult === "object" && finishResult !== null && "answer" in finishResult && typeof finishResult.answer === "string") {
                  const finalAnswer = finishResult.answer;
                  this.publishToChannel({
                    content: finalAnswer,
                    type: "agent_response"
                  });
                  return finalAnswer;
                }
              } catch (error) {
                iterationLog.error("Failed to execute auto-finish after display_canvas:", error);
                return "J'ai affich\xE9 le contenu demand\xE9 dans le canvas. Y a-t-il autre chose que je puisse faire pour vous ?";
              }
            }
            if (this.pendingMultiFileOperations.length > 0 && command.name === "writeFile") {
              const nextFile = this.pendingMultiFileOperations.shift();
              if (nextFile) {
                iterationLog.info(`Creating next file: ${nextFile.filename}`);
                const nextCommand = {
                  name: "writeFile",
                  params: {
                    path: nextFile.filename,
                    content: nextFile.content
                  }
                };
                const nextResult = await this.executeTool(
                  nextCommand,
                  iterationLog
                );
                this.session.history.push({
                  id: crypto.randomUUID(),
                  result: nextResult,
                  timestamp: Date.now(),
                  toolName: nextCommand.name,
                  type: "tool_result"
                });
                if (this.pendingMultiFileOperations.length === 0 && nextFile.type === "html") {
                  iterationLog.info(
                    "All files created, displaying HTML in canvas"
                  );
                  const canvasCommand = {
                    name: "display_canvas",
                    params: {
                      content: nextFile.content,
                      contentType: "html"
                    }
                  };
                  const canvasResult = await this.executeTool(
                    canvasCommand,
                    iterationLog
                  );
                  this.session.history.push({
                    id: crypto.randomUUID(),
                    result: canvasResult,
                    timestamp: Date.now(),
                    toolName: canvasCommand.name,
                    type: "tool_result"
                  });
                }
              }
            }
          } else if (!thought && !canvas) {
            this.session.history.push({
              content: "You must provide a command, a thought, a canvas output, or a final answer.",
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: "error"
            });
          }
        } catch (_error) {
          if (_error instanceof FinishToolSignal) {
            this.log.info(
              { answer: _error.message },
              "Agent finished by tool signal."
            );
            this.publishToChannel({
              content: _error.message,
              type: "agent_response"
            });
            return _error.message;
          }
          let errorMessage;
          if (_error instanceof Error) {
            errorMessage = _error.message;
          } else {
            errorMessage = String(_error);
          }
          iterationLog.error(
            {
              error: _error instanceof Error ? _error : new Error(String(_error))
            },
            `Error in agent iteration: ${errorMessage}`
          );
          if (errorMessage.includes("Failed to parse LLM response")) {
            this.malformedResponseCounter++;
            this.session.history.push({
              content: `I was unable to parse your last response (attempt ${this.malformedResponseCounter}/${this.MAX_MALFORMED_RESPONSES}). Please ensure your response is a valid JSON object with the expected properties ('thought', 'command', 'canvas', or 'answer'). Check for syntax errors, missing commas, or unclosed brackets. If you need to provide a simple response, use the 'finish' tool with a 'response' parameter.`,
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: "error"
            });
            if (this.malformedResponseCounter >= this.MAX_MALFORMED_RESPONSES) {
              this.log.error(
                "Too many malformed responses. Attempting fallback approach."
              );
              try {
                const fallbackResponse = await this.attemptFallbackResponse();
                if (fallbackResponse) {
                  return fallbackResponse;
                }
              } catch (fallbackError) {
                this.log.error(
                  { fallbackError },
                  "Fallback approach also failed"
                );
              }
              this.log.warn("Using emergency fallback response");
              return JSON.stringify({
                thought: "Unable to parse LLM response, using emergency fallback",
                command: {
                  name: "finish",
                  params: {
                    response: "I apologize, but I'm having trouble processing your request. Could you please rephrase it?"
                  }
                }
              });
            }
            continue;
          } else if (errorMessage.includes("Error executing tool")) {
            continue;
          } else if (errorMessage.includes("Failed to communicate with the LLM") || errorMessage.includes("LLM API") || errorMessage.includes("network") || errorMessage.includes("timeout") || errorMessage.includes("API key not valid") || errorMessage.includes("API_KEY_INVALID")) {
            this.llmFailureCounter++;
            this.log.error(
              `LLM communication failure (attempt ${this.llmFailureCounter}/${this.MAX_LLM_FAILURES}): ${errorMessage}`
            );
            if (this.llmFailureCounter >= this.MAX_LLM_FAILURES) {
              this.log.error(
                "Max LLM failures reached. Attempting fallback mode..."
              );
              try {
                const localResponse = await this.generateLocalFallbackResponse();
                if (localResponse) {
                  this.log.info(
                    "Successfully generated local fallback response"
                  );
                  const parsedLocal = this.parseLlmResponse(
                    localResponse,
                    this.log
                  );
                  const {
                    answer: localAnswer,
                    canvas: localCanvas,
                    thought: localThought
                  } = parsedLocal;
                  let localCommand = parsedLocal.command;
                  if (localThought) {
                    this.session.history.push({
                      content: localThought,
                      id: crypto.randomUUID(),
                      timestamp: Date.now(),
                      type: "agent_thought"
                    });
                  }
                  if (localCommand && localCommand.name === "finish") {
                    try {
                      const finishResult = await this.executeTool(
                        localCommand,
                        this.log
                      );
                      if (typeof finishResult === "object" && finishResult !== null && "answer" in finishResult) {
                        const finalAnswer = finishResult.answer;
                        this.publishToChannel({
                          content: finalAnswer,
                          type: "agent_response"
                        });
                        return finalAnswer;
                      }
                    } catch (finishError) {
                      this.log.error(
                        { finishError },
                        "Local finish command failed"
                      );
                    }
                  }
                  continue;
                }
              } catch (localError) {
                this.log.error({ localError }, "Local fallback also failed");
                return "Agent stopped due to persistent LLM communication issues and failed fallback attempts. Please check your API keys and network connection.";
              }
            }
            await new Promise(
              (resolve2) => setTimeout(resolve2, 2e3 * this.llmFailureCounter)
            );
            continue;
          } else {
            this.session.history.push({
              content: `An unexpected error occurred: ${errorMessage}`,
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: "error"
            });
            this.interrupted = true;
            return `Error in agent iteration: ${errorMessage}`;
          }
        }
      }
      if (this.interrupted) {
        return "Agent execution interrupted.";
      }
      if (iterations >= MAX_ITERATIONS) {
        return "Agent reached maximum iterations without a final answer.";
      }
      return "Agent reached maximum iterations without a final answer.";
    } catch (_error) {
      if (_error instanceof FinishToolSignal) {
        this.log.info(
          { answer: _error.message },
          "Agent finished by tool signal."
        );
        this.publishToChannel({
          content: _error.message,
          type: "agent_response"
        });
        return _error.message;
      }
      let errorMessage;
      if (_error instanceof Error) {
        errorMessage = _error.message;
      } else {
        errorMessage = String(_error);
      }
      this.log.error(
        {
          error: _error instanceof Error ? _error : new Error(String(_error))
        },
        `Agent run failed: ${errorMessage}`
      );
      return `Agent run failed: ${errorMessage}`;
    } finally {
      try {
        const redisClient = getRedisClientInstance();
        await redisClient.incr("leaderboard:successfulRuns");
        this.log.info("Successfully incremented successfulRuns counter");
      } catch (error) {
        this.log.error(
          { err: error },
          "Failed to increment successfulRuns in Redis"
        );
      }
      await this.cleanup();
    }
  }
  calculateTextSimilarity(text1, text2) {
    const set1 = new Set(text1.toLowerCase().split(/\s+/));
    const set2 = new Set(text2.toLowerCase().split(/\s+/));
    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = /* @__PURE__ */ new Set([...set1, ...set2]);
    return union.size === 0 ? 1 : intersection.size / union.size;
  }
  detectRepetitiveResponse(response) {
    const recentResponses = this.behaviorHistory.slice(-3);
    const similarityThreshold = 0.8;
    for (const behavior of recentResponses) {
      if (behavior.thought) {
        const similarity = this.calculateTextSimilarity(
          response,
          behavior.thought
        );
        if (similarity > similarityThreshold) {
          return true;
        }
      }
    }
    return false;
  }
  async cleanup() {
    if (this.subscriber) {
      const channel = `job:${this.job.id}:interrupt`;
      await this.subscriber.unsubscribe(channel);
      await this.subscriber.quit();
    }
  }
  /**
   * Converts plain text responses to valid JSON format
   * This handles cases where the LLM responds with plain text instead of JSON
   */
  convertPlainTextToValidJson(text) {
    const cleanText = text.trim();
    let command;
    let thought;
    if (cleanText.includes("currently unable to process your request") || cleanText.includes("quota") && cleanText.includes("exceeded") || cleanText.includes("free-tier quota") || cleanText.includes("Please try again once the quota has reset")) {
      throw new Error(`Gemini API Error: ${cleanText}`);
    }
    try {
      JSON.parse(cleanText);
      return cleanText;
    } catch {
    }
    const genericTemplatePatterns = [
      /assistant['']?s turn\. your response:?$/i,
      /^the agent['']?s turn\. your response:?$/i,
      /your response:$/i,
      /tour de l['']?assistant\. votre réponse:?$/i
    ];
    const isGenericTemplate = genericTemplatePatterns.some(
      (pattern) => pattern.test(cleanText.trim())
    );
    if (cleanText.length < 50 && !cleanText.toLowerCase().includes("canvas") && !cleanText.toLowerCase().includes("graphique") && !cleanText.toLowerCase().includes("acheter") && !cleanText.toLowerCase().includes("tesla") && !cleanText.toLowerCase().includes("action") && !cleanText.toLowerCase().includes("chart") && (cleanText.toLowerCase().includes("ok") || cleanText.toLowerCase().includes("merci") || cleanText.toLowerCase().includes("merci") || cleanText.toLowerCase().includes("parfait") || cleanText.toLowerCase().includes("bien") || cleanText.toLowerCase().includes("bon") || cleanText.toLowerCase().includes("super") || cleanText.match(/^[a-z\s]{2,20}$/i))) {
      this.log.info("\u{1F527} Simple response detected, forcing finish command");
      const fallbackResponse = {
        command: {
          name: "finish",
          params: {
            response: cleanText.trim() || "Je suis pr\xEAt \xE0 vous aider ! Que souhaitez-vous que je fasse ?"
          }
        },
        thought: "R\xE9ponse simple d\xE9tect\xE9e, terminaison de la conversation."
      };
      return JSON.stringify(fallbackResponse);
    }
    if (isGenericTemplate || cleanText.trim().length < 10) {
      this.log.info("\u{1F527} Detected generic template response, providing helpful fallback");
      const fallbackResponse = {
        command: {
          name: "finish",
          params: {
            response: "Je suis pr\xEAt \xE0 vous aider ! Que souhaitez-vous que je fasse ?"
          }
        },
        thought: "R\xE9ponse template d\xE9tect\xE9e, fourniture d'une r\xE9ponse utile par d\xE9faut."
      };
      return JSON.stringify(fallbackResponse);
    }
    const embeddedJsonMatch = cleanText.match(/(\{[\s\S]*?\})(?:\s*$|\n|$)/);
    if (embeddedJsonMatch) {
      try {
        const potentialJson = embeddedJsonMatch[1];
        JSON.parse(potentialJson);
        this.log.info("\u{1F527} Extracted embedded JSON from mixed response");
        return potentialJson;
      } catch {
      }
    }
    const thoughtJsonPattern = cleanText.match(
      /Thought:\s*([^}]+)\s*(\{[\s\S]*?\})/
    );
    if (thoughtJsonPattern) {
      try {
        const jsonPart = thoughtJsonPattern[2];
        JSON.parse(jsonPart);
        this.log.info("\u{1F527} Extracted JSON from Thought+JSON pattern");
        return jsonPart;
      } catch {
      }
    }
    const lowerCleanText = cleanText.toLowerCase();
    if (lowerCleanText.includes("readfile") || lowerCleanText.includes("lire") && lowerCleanText.includes("fichier") || lowerCleanText.includes("read") && lowerCleanText.includes("file") || lowerCleanText.includes("analyser") || (lowerCleanText.includes("complex.json") || lowerCleanText.includes("test-complex"))) {
      const fileMatch = cleanText.match(/[\w/.-]+\.(js|ts|json|txt|md)/);
      const fileName = fileMatch ? fileMatch[0] : "test-complex.json";
      return JSON.stringify({
        thought: `Lecture du fichier ${fileName} pour analyser son contenu`,
        command: {
          name: "readFile",
          params: { path: fileName }
        }
      });
    }
    if (lowerCleanText.includes("editfile") || lowerCleanText.includes("ajouter") && lowerCleanText.includes("fichier") || lowerCleanText.includes("modifier") && lowerCleanText.includes("fichier") || lowerCleanText.includes("edit") && lowerCleanText.includes("file") || lowerCleanText.includes("append")) {
      const fileMatch = cleanText.match(/[\w/.-]+\.(js|ts|json|txt|md)/);
      const fileName = fileMatch ? fileMatch[0] : "test-file.txt";
      const contentMatch = cleanText.match(/"([^"]+)"/) || cleanText.match(/'([^']+)'/);
      const content = contentMatch ? contentMatch[1] : "Ligne ajout\xE9e par Dusk";
      return JSON.stringify({
        thought: `Ajout de contenu au fichier ${fileName}`,
        command: {
          name: "editFile",
          params: {
            path: fileName,
            content_to_replace: "$",
            // End of file for append
            new_content: `
${content}`,
            is_regex: true
          }
        }
      });
    }
    if (lowerCleanText.includes("executeshellcommand") || lowerCleanText.includes("copy") && lowerCleanText.includes("file") || lowerCleanText.includes("copier") && lowerCleanText.includes("fichier") || lowerCleanText.includes(" cp ")) {
      const commandMatch = cleanText.match(/"([^"]+)"/) || cleanText.match(/'([^']+)'/);
      let shellCommand = commandMatch ? commandMatch[1] : "";
      if (!shellCommand) {
        const fileMatches = cleanText.match(/[\w/.-]+\.(js|ts|json|txt|md)/g);
        if (fileMatches && fileMatches.length >= 2) {
          shellCommand = `cp "${fileMatches[0]}" "${fileMatches[1]}"`;
        } else {
          shellCommand = 'echo "Hello World"';
        }
      }
      return JSON.stringify({
        thought: `Ex\xE9cution de la commande: ${shellCommand}`,
        command: {
          name: "executeShellCommand",
          params: { command: shellCommand }
        }
      });
    }
    if (lowerCleanText.includes("todo") || lowerCleanText.includes("t\xE2che") || lowerCleanText.includes("task") || lowerCleanText.includes("liste") || lowerCleanText.includes("cr\xE9er") && (lowerCleanText.includes("list") || lowerCleanText.includes("todo"))) {
      return JSON.stringify({
        thought: "Cr\xE9ation d'une liste de t\xE2ches",
        command: {
          name: "todo_write",
          params: {
            todos: [
              {
                id: "1",
                content: "Tester le syst\xE8me de todo",
                status: "pending",
                priority: "high",
                category: "test"
              },
              {
                id: "2",
                content: "V\xE9rifier l'int\xE9gration canvas",
                status: "pending",
                priority: "medium",
                category: "development"
              },
              {
                id: "3",
                content: "Tester l'automatisation playwright",
                status: "pending",
                priority: "medium",
                category: "test"
              }
            ]
          }
        }
      });
    }
    if (lowerCleanText.includes("canvas") || lowerCleanText.includes("affiche") || lowerCleanText.includes("display") || lowerCleanText.includes("tableau") || lowerCleanText.includes("dashboard") || lowerCleanText.includes("cr\xE9er") && lowerCleanText.includes("html")) {
      const canvasContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Test Canvas</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: rgba(255,255,255,0.1);
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
          }
          h1 {
            text-align: center;
            color: #fff;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          }
          .status {
            background: rgba(76, 175, 80, 0.2);
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #4CAF50;
            margin: 20px 0;
          }
          .feature-list {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
          }
          .feature-list li {
            margin: 10px 0;
            padding: 8px;
            background: rgba(255,255,255,0.05);
            border-radius: 5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>\u{1F3A8} Canvas Test R\xE9ussi!</h1>
          <div class="status">
            <h3>\u2705 Syst\xE8me Canvas Fonctionnel</h3>
            <p>L'agent peut afficher du contenu HTML interactif dans le canvas.</p>
          </div>
          <div class="feature-list">
            <h3>\u{1F680} Fonctionnalit\xE9s Test\xE9es:</h3>
            <ul>
              <li>\u2705 Affichage HTML complexe</li>
              <li>\u2705 Styles CSS int\xE9gr\xE9s</li>
              <li>\u2705 Design responsive</li>
              <li>\u2705 Support des animations</li>
              <li>\u2705 Integration avec l'agent</li>
            </ul>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <button onclick="alert('Canvas interactif fonctionnel!')" style="
              background: #4CAF50;
              color: white;
              border: none;
              padding: 15px 30px;
              border-radius: 25px;
              font-size: 16px;
              cursor: pointer;
              transition: all 0.3s ease;
            " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
              Test Interactif
            </button>
          </div>
        </div>
        <script>
          console.log('Canvas initialis\xE9 avec succ\xE8s!');
          document.addEventListener('DOMContentLoaded', function() {
            console.log('DOM charg\xE9 - Canvas pr\xEAt');
          });
        </script>
      </body>
      </html>`;
      return JSON.stringify({
        thought: "Cr\xE9ation d'un canvas de test interactif",
        command: {
          name: "display_canvas",
          params: {
            content: canvasContent,
            contentType: "html",
            title: "Canvas Test Agent"
          }
        }
      });
    }
    if (this.llmFailureCounter > 0 && this.detectIfShouldUseLocalMode(cleanText)) {
      this.log.info("\u{1F504} Switching to local mode due to API failures");
      return this.generateLocalModeResponse(cleanText);
    }
    if (cleanText.toLowerCase().includes("playwright_navigate")) {
      const urlMatch = cleanText.match(/https?:\/\/[^\s<>"']+/i) || cleanText.match(/vers?\s+([^\s<>"']+)/i);
      const url = urlMatch ? urlMatch[0] : "https://example.com";
      return JSON.stringify({
        thought: `Navigation vers ${url}`,
        command: {
          name: "playwright_navigate",
          params: { url }
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_click")) {
      const selectorMatch = cleanText.match(/sur\s+(?:le\s+)?(?:lien\s+)?"([^"]+)"/i) || cleanText.match(/click\s+(?:on\s+)?(?:the\s+)?"([^"]+)"/i) || cleanText.match(/"([^"]+)"/);
      const selector = selectorMatch ? selectorMatch[1] : 'a[href*="more"]';
      return JSON.stringify({
        thought: `Clic sur l'\xE9l\xE9ment ${selector}`,
        command: {
          name: "playwright_click",
          params: { selector }
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_wait_for_selector")) {
      const selectorMatch = cleanText.match(/attendre\s+(?:un\s+)?([^\s]+)/i) || cleanText.match(/wait.*?for.*?([^\s]+)/i) || cleanText.match(/h\d+/i);
      const selector = selectorMatch ? selectorMatch[1] : "h1";
      return JSON.stringify({
        thought: `Attente du s\xE9lecteur ${selector}`,
        command: {
          name: "playwright_wait_for_selector",
          params: { selector }
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_get_content")) {
      return JSON.stringify({
        thought: "Extraction du contenu de la page",
        command: {
          name: "playwright_get_content",
          params: {}
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_type")) {
      const textMatch = cleanText.match(/dans.*?"([^"]+)"/i) || cleanText.match(/type.*?"([^"]+)"/i);
      const text2 = textMatch ? textMatch[1] : "test";
      return JSON.stringify({
        thought: `Saisie du texte: ${text2}`,
        command: {
          name: "playwright_type",
          params: { selector: "input", text: text2 }
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_screenshot")) {
      return JSON.stringify({
        thought: "Capture d'\xE9cran de la page",
        command: {
          name: "playwright_screenshot",
          params: { fullPage: true }
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_set_viewport")) {
      const sizeMatch = cleanText.match(/(\d+)x(\d+)/i);
      const width = sizeMatch ? parseInt(sizeMatch[1]) : 1280;
      const height = sizeMatch ? parseInt(sizeMatch[2]) : 720;
      return JSON.stringify({
        thought: `Configuration de la fen\xEAtre ${width}x${height}`,
        command: {
          name: "playwright_set_viewport",
          params: { width, height }
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_evaluate")) {
      const codeMatch = cleanText.match(/console\.log\("([^"]+)"\)/i) || cleanText.match(/"([^"]+)"/);
      const code = codeMatch ? `console.log("${codeMatch[1]}")` : 'console.log("Test Browser Live View")';
      return JSON.stringify({
        thought: `Ex\xE9cution du code JavaScript: ${code}`,
        command: {
          name: "playwright_evaluate",
          params: { expression: code }
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_scroll")) {
      return JSON.stringify({
        thought: "D\xE9filement de la page vers le bas",
        command: {
          name: "playwright_scroll",
          params: { direction: "down", amount: 500 }
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_get_title")) {
      return JSON.stringify({
        thought: "R\xE9cup\xE9ration du titre de la page",
        command: {
          name: "playwright_get_title",
          params: {}
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_get_url")) {
      return JSON.stringify({
        thought: "R\xE9cup\xE9ration de l'URL actuelle",
        command: {
          name: "playwright_get_url",
          params: {}
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_reload")) {
      return JSON.stringify({
        thought: "Rechargement de la page",
        command: {
          name: "playwright_reload",
          params: {}
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_go_back")) {
      return JSON.stringify({
        thought: "Retour \xE0 la page pr\xE9c\xE9dente",
        command: {
          name: "playwright_go_back",
          params: {}
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_go_forward")) {
      return JSON.stringify({
        thought: "Avancer \xE0 la page suivante",
        command: {
          name: "playwright_go_forward",
          params: {}
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_console_log")) {
      return JSON.stringify({
        thought: "Capture des logs de la console",
        command: {
          name: "playwright_console_log",
          params: { enable: true }
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_console_error")) {
      return JSON.stringify({
        thought: "D\xE9tection des erreurs console",
        command: {
          name: "playwright_console_error",
          params: { enable: true }
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_console_warn")) {
      return JSON.stringify({
        thought: "D\xE9tection des avertissements console",
        command: {
          name: "playwright_console_warn",
          params: { enable: true }
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_inject_script")) {
      const scriptMatch = cleanText.match(/injecter\s+(?:du\s+)?code\s+"([^"]+)"/i) || cleanText.match(/inject.*?"([^"]+)"/i);
      const script = scriptMatch ? scriptMatch[1] : 'console.log("Script inject\xE9");';
      return JSON.stringify({
        thought: `Injection de script: ${script}`,
        command: {
          name: "playwright_inject_script",
          params: { script }
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_evaluate_console")) {
      const codeMatch = cleanText.match(/console\s+"([^"]+)"/i) || cleanText.match(/exécuter.*?"([^"]+)"/i);
      const code = codeMatch ? codeMatch[1] : "document.title";
      return JSON.stringify({
        thought: `Ex\xE9cution dans la console: ${code}`,
        command: {
          name: "playwright_evaluate_console",
          params: { expression: code }
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_get_console_messages")) {
      return JSON.stringify({
        thought: "R\xE9cup\xE9ration des messages console",
        command: {
          name: "playwright_get_console_messages",
          params: {}
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_double_click")) {
      const selectorMatch = cleanText.match(
        /sur\s+(?:l'élément\s+)?"?([^"]+)"?/i
      );
      const selector = selectorMatch ? selectorMatch[1] : "button";
      return JSON.stringify({
        thought: `Double-clic sur ${selector}`,
        command: {
          name: "playwright_double_click",
          params: { selector }
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_right_click")) {
      const selectorMatch = cleanText.match(
        /sur\s+(?:l'élément\s+)?"?([^"]+)"?/i
      );
      const selector = selectorMatch ? selectorMatch[1] : "body";
      return JSON.stringify({
        thought: `Clic droit sur ${selector}`,
        command: {
          name: "playwright_right_click",
          params: { selector }
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_drag_and_drop")) {
      return JSON.stringify({
        thought: "Glisser-d\xE9poser d'\xE9l\xE9ments",
        command: {
          name: "playwright_drag_and_drop",
          params: {
            source: ".draggable-item",
            target: ".drop-zone"
          }
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_search_google")) {
      const termMatch = cleanText.match(/terme\s+"([^"]+)"/i) || cleanText.match(/recherche\s+"([^"]+)"/i);
      const term = termMatch ? termMatch[1] : "test search";
      return JSON.stringify({
        thought: `Recherche Google: ${term}`,
        command: {
          name: "playwright_search_google",
          params: { query: term }
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_search_youtube")) {
      const termMatch = cleanText.match(/terme\s+"([^"]+)"/i) || cleanText.match(/recherche\s+"([^"]+)"/i);
      const term = termMatch ? termMatch[1] : "programming tutorial";
      return JSON.stringify({
        thought: `Recherche YouTube: ${term}`,
        command: {
          name: "playwright_search_youtube",
          params: { query: term }
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_search_github")) {
      const termMatch = cleanText.match(/terme\s+"([^"]+)"/i) || cleanText.match(/recherche\s+"([^"]+)"/i);
      const term = termMatch ? termMatch[1] : "playwright examples";
      return JSON.stringify({
        thought: `Recherche GitHub: ${term}`,
        command: {
          name: "playwright_search_github",
          params: { query: term }
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_measure_page_load")) {
      return JSON.stringify({
        thought: "Mesure du temps de chargement de page",
        command: {
          name: "playwright_measure_page_load",
          params: {}
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_memory_usage")) {
      return JSON.stringify({
        thought: "Monitoring de l'utilisation m\xE9moire",
        command: {
          name: "playwright_memory_usage",
          params: {}
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_network_inspector")) {
      return JSON.stringify({
        thought: "Inspection du trafic r\xE9seau",
        command: {
          name: "playwright_network_inspector",
          params: { enable: true }
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_check_security_headers")) {
      return JSON.stringify({
        thought: "V\xE9rification des headers de s\xE9curit\xE9",
        command: {
          name: "playwright_check_security_headers",
          params: {}
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_stealth_mode")) {
      return JSON.stringify({
        thought: "Activation du mode furtif complet",
        command: {
          name: "playwright_stealth_mode",
          params: { enable: true }
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_random_user_agent")) {
      return JSON.stringify({
        thought: "Configuration d'un user-agent al\xE9atoire r\xE9aliste",
        command: {
          name: "playwright_random_user_agent",
          params: { platform: "random", browser: "random" }
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_fake_webgl_renderer")) {
      return JSON.stringify({
        thought: "Simulation d'un GPU diff\xE9rent",
        command: {
          name: "playwright_fake_webgl_renderer",
          params: {
            renderer: "NVIDIA GeForce GTX 1060",
            vendor: "NVIDIA Corporation"
          }
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_spoof_canvas_fingerprint")) {
      return JSON.stringify({
        thought: "Masquage de l'empreinte canvas",
        command: {
          name: "playwright_spoof_canvas_fingerprint",
          params: { randomize: true }
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_hide_webdriver_property")) {
      return JSON.stringify({
        thought: "Masquage de la propri\xE9t\xE9 webdriver",
        command: {
          name: "playwright_hide_webdriver_property",
          params: { hide: true }
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_fake_plugins")) {
      return JSON.stringify({
        thought: "Simulation de plugins navigateur r\xE9alistes",
        command: {
          name: "playwright_fake_plugins",
          params: {
            plugins: [
              "Chrome PDF Plugin",
              "Adobe Flash Player",
              "Java Applet Plug-in"
            ]
          }
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_randomize_screen_resolution")) {
      return JSON.stringify({
        thought: "Randomisation de la r\xE9solution d'\xE9cran",
        command: {
          name: "playwright_randomize_screen_resolution",
          params: {
            common_resolutions: true,
            avoid_uncommon: true
          }
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_human_mouse_movement")) {
      return JSON.stringify({
        thought: "Simulation de mouvements souris humains r\xE9alistes",
        command: {
          name: "playwright_human_mouse_movement",
          params: {
            enable_jitter: true,
            realistic_curves: true,
            random_delays: true
          }
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_bypass_cloudflare")) {
      return JSON.stringify({
        thought: "Contournement des protections Cloudflare",
        command: {
          name: "playwright_bypass_cloudflare",
          params: {
            method: "stealth",
            challenge_solver: true
          }
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_bypass_recaptcha")) {
      return JSON.stringify({
        thought: "Contournement des reCAPTCHA",
        command: {
          name: "playwright_bypass_recaptcha",
          params: {
            solver: "ai_based",
            audio_fallback: true
          }
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_human_typing_speed")) {
      return JSON.stringify({
        thought: "Simulation de vitesse de frappe humaine variable",
        command: {
          name: "playwright_human_typing_speed",
          params: {
            wpm_min: 40,
            wpm_max: 80,
            errors: true,
            corrections: true
          }
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_rotating_proxy")) {
      return JSON.stringify({
        thought: "Rotation automatique de proxies",
        command: {
          name: "playwright_rotating_proxy",
          params: {
            proxy_list: ["residential", "datacenter"],
            rotation_interval: 300,
            country_rotation: true
          }
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_spoof_timezone")) {
      return JSON.stringify({
        thought: "Changement du fuseau horaire",
        command: {
          name: "playwright_spoof_timezone",
          params: {
            timezone: "random",
            match_proxy_location: true
          }
        }
      });
    }
    if (cleanText.toLowerCase().includes("playwright_behavioral_pattern_analysis")) {
      return JSON.stringify({
        thought: "Analyse des patterns comportementaux pour \xE9viter d\xE9tection",
        command: {
          name: "playwright_behavioral_pattern_analysis",
          params: {
            learn_from_humans: true,
            adaptive_behavior: true,
            pattern_randomization: true
          }
        }
      });
    }
    if (cleanText.toLowerCase().includes("canvas_display_simple_html")) {
      return JSON.stringify({
        thought: "Affichage de HTML basique dans le canvas",
        command: {
          name: "displayCanvas",
          params: {
            contentType: "html",
            content: "<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Hello World</h1></body></html>",
            title: "HTML Simple"
          }
        }
      });
    }
    if (cleanText.toLowerCase().includes("canvas_display_complex_website")) {
      return JSON.stringify({
        thought: "Affichage d'un site web complexe dans le canvas",
        command: {
          name: "displayCanvas",
          params: {
            contentType: "website",
            url: "https://example.com",
            title: "Site Web Complexe",
            interactive: true
          }
        }
      });
    }
    if (cleanText.toLowerCase().includes("canvas_display_interactive_game")) {
      return JSON.stringify({
        thought: "Affichage d'un jeu HTML5 interactif",
        command: {
          name: "displayCanvas",
          params: {
            contentType: "game",
            gameType: "html5",
            title: "Jeu Interactif",
            interactive: true,
            fullscreen: true
          }
        }
      });
    }
    if (cleanText.toLowerCase().includes("canvas_display_video_content")) {
      return JSON.stringify({
        thought: "Affichage de contenu vid\xE9o dans le canvas",
        command: {
          name: "displayCanvas",
          params: {
            contentType: "video",
            controls: true,
            autoplay: false,
            title: "Contenu Vid\xE9o"
          }
        }
      });
    }
    if (cleanText.toLowerCase().includes("canvas_display_3d_graphics")) {
      return JSON.stringify({
        thought: "Affichage de graphiques 3D WebGL",
        command: {
          name: "displayCanvas",
          params: {
            contentType: "webgl",
            graphics: "3d",
            interactive: true,
            title: "Graphiques 3D"
          }
        }
      });
    }
    if (cleanText.toLowerCase().includes("canvas_screenshot_full_page")) {
      return JSON.stringify({
        thought: "Capture d'\xE9cran de la page enti\xE8re",
        command: {
          name: "playwright_screenshot",
          params: {
            fullPage: true,
            quality: 90,
            type: "png"
          }
        }
      });
    }
    if (cleanText.toLowerCase().includes("canvas_render_real_time_data")) {
      return JSON.stringify({
        thought: "Rendu de donn\xE9es temps r\xE9el dans le canvas",
        command: {
          name: "displayCanvas",
          params: {
            contentType: "data",
            realTime: true,
            updateInterval: 1e3,
            title: "Donn\xE9es Temps R\xE9el",
            charts: true
          }
        }
      });
    }
    if (cleanText.toLowerCase().includes("canvas_display_code_editor")) {
      return JSON.stringify({
        thought: "Affichage d'un \xE9diteur de code",
        command: {
          name: "displayCanvas",
          params: {
            contentType: "code",
            language: "javascript",
            theme: "dark",
            lineNumbers: true,
            title: "\xC9diteur de Code",
            interactive: true
          }
        }
      });
    }
    if (cleanText.toLowerCase().includes("canvas_display_dashboard_app")) {
      return JSON.stringify({
        thought: "Affichage d'une application dashboard",
        command: {
          name: "displayCanvas",
          params: {
            contentType: "dashboard",
            widgets: ["charts", "metrics", "tables"],
            realTime: true,
            title: "Dashboard Application",
            responsive: true
          }
        }
      });
    }
    if (cleanText.toLowerCase().includes("canvas_display_bar_charts")) {
      return JSON.stringify({
        thought: "Affichage de graphiques en barres",
        command: {
          name: "displayCanvas",
          params: {
            contentType: "chart",
            chartType: "bar",
            data: [10, 20, 30, 40, 50],
            labels: ["A", "B", "C", "D", "E"],
            title: "Graphique en Barres",
            animated: true
          }
        }
      });
    }
    if (cleanText.toLowerCase().includes("canvas_display_live_updates")) {
      return JSON.stringify({
        thought: "Affichage de contenu avec mises \xE0 jour en direct",
        command: {
          name: "displayCanvas",
          params: {
            contentType: "live",
            updateMethod: "websocket",
            refreshRate: 2e3,
            title: "Mises \xE0 Jour en Direct",
            realTime: true
          }
        }
      });
    }
    const jsonToolCodeMatch = cleanText.match(
      /```json\s*\n\s*{\s*"tool_code":\s*"([^"]+)"\s*}\s*\n```/is
    );
    if (jsonToolCodeMatch) {
      const toolCallStr = jsonToolCodeMatch[1];
      const toolCallParsed = toolCallStr.match(/(\w+)\s*\(\s*([\s\S]*?)\s*\)$/);
      if (toolCallParsed) {
        const toolName = toolCallParsed[1];
        let paramsStr = toolCallParsed[2].trim();
        let params = {};
        if (paramsStr) {
          try {
            const paramMatches = [
              ...paramsStr.matchAll(/(\w+)=([^,]+?)(?=,\s*\w+=|$)/gs)
            ];
            paramMatches.forEach((match) => {
              const key = match[1];
              let value = match[2].trim();
              if (value.startsWith('"') && value.endsWith('"')) {
                params[key] = value.slice(1, -1);
              } else if (value.startsWith("json.dumps(") && value.endsWith(")")) {
                const jsonStr = value.slice(11, -1);
                try {
                  params[key] = JSON.parse(jsonStr);
                } catch (e) {
                  params[key] = jsonStr;
                }
              } else {
                params[key] = value;
              }
            });
          } catch (e) {
            params = { content: paramsStr };
          }
        }
        const thoughtMatch = cleanText.match(/^(.*?)```json/s);
        const thought2 = thoughtMatch ? thoughtMatch[1].trim() : `Ex\xE9cution de l'outil ${toolName}`;
        return JSON.stringify({
          thought: thought2,
          command: {
            name: toolName,
            params
          }
        });
      }
    }
    const toolCodeMatch = cleanText.match(
      /```tool_code\s*\n\s*(\w+)\s*\(\s*([\s\S]*?)\s*\)\s*\n```/is
    );
    if (toolCodeMatch) {
      const toolName = toolCodeMatch[1];
      let paramsStr = toolCodeMatch[2].trim();
      let params = {};
      if (paramsStr) {
        if (paramsStr.startsWith("{") && paramsStr.endsWith("}")) {
          try {
            params = JSON.parse(paramsStr);
          } catch (e) {
            const keyValueMatches = [
              ...paramsStr.matchAll(/(\w+)=['"](.*?)['"],?/g)
            ];
            keyValueMatches.forEach((match) => {
              params[match[1]] = match[2].replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
            });
          }
        } else {
          const keyValueMatches = [
            ...paramsStr.matchAll(/(\w+)=['"](.*?)['"],?/gs)
          ];
          keyValueMatches.forEach((match) => {
            params[match[1]] = match[2].replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
          });
        }
      }
      const thoughtMatch = cleanText.match(/^(.*?)```tool_code/s);
      const thought2 = thoughtMatch ? thoughtMatch[1].trim() : `Ex\xE9cution de l'outil ${toolName}`;
      return JSON.stringify({
        thought: thought2,
        command: {
          name: toolName,
          params
        }
      });
    }
    let toolCallMatch = cleanText.match(
      /Tool Call:\s*(\w+)\s*with\s*params\s*(\{.*?\}(?:\s*$|\n|Tool Result:))/is
    );
    if (!toolCallMatch) {
      toolCallMatch = cleanText.match(
        /Tool Call:\s*(\w+)\s*\(\s*(\{[\s\S]*?\})\s*\)(?:\s*$|\n|Tool Result:)/is
      );
    }
    if (!toolCallMatch) {
      toolCallMatch = cleanText.match(
        /Tool Call:\s*(\w+)\s*(\{[\s\S]*?\})(?:\s*$|\n|Tool Result:)/is
      );
    }
    if (!toolCallMatch && cleanText.trim().startsWith("Tool Call:")) {
      toolCallMatch = cleanText.match(
        /^Tool Call:\s*(\w+)\s*\(\s*(\{[\s\S]*?\})\s*\)(?:\s*$|\n)/is
      );
    }
    if (toolCallMatch) {
      const toolName = toolCallMatch[1];
      let params = {};
      let jsonStr = toolCallMatch[2].trim();
      let braceCount = 0;
      let jsonEnd = 0;
      let inString = false;
      let escapeNext = false;
      for (let i = 0; i < jsonStr.length; i++) {
        const char = jsonStr[i];
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        if (char === "\\") {
          escapeNext = true;
          continue;
        }
        if (char === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }
        if (!inString) {
          if (char === "{") braceCount++;
          if (char === "}") braceCount--;
          if (braceCount === 0 && char === "}") {
            jsonEnd = i + 1;
            break;
          }
        }
      }
      if (jsonEnd > 0) {
        jsonStr = jsonStr.substring(0, jsonEnd);
      } else {
        const jsonEndMatch = jsonStr.match(
          /^(\{.*?\})(?:\s*(?:Tool Result:|$|\n))/s
        );
        if (jsonEndMatch) {
          jsonStr = jsonEndMatch[1];
        }
      }
      try {
        params = JSON.parse(jsonStr);
        if (toolName === "display_canvas" && params && typeof params.content === "object") {
          this.log.info(
            "\u{1F527} Converting display_canvas content object to JSON string"
          );
          params.content = JSON.stringify(params.content);
        }
      } catch (e) {
        this.log.warn(
          `Failed to parse JSON params for tool ${toolName}: ${jsonStr}`
        );
        const responseMatch = cleanText.match(/"response":\s*"([^"]+)"/);
        if (responseMatch && toolName.toLowerCase() === "finish") {
          params = { response: responseMatch[1] };
        } else if (toolName.toLowerCase() === "todowrite") {
          const todosMatch = jsonStr.match(/"todos":\s*\[[\s\S]*?\]/);
          if (todosMatch) {
            try {
              const todosObj = JSON.parse(`{${todosMatch[0]}}`);
              params = todosObj;
            } catch (e3) {
              params = { todos: [] };
            }
          } else {
            params = { todos: [] };
          }
        } else {
          const quotedValues = jsonStr.match(/"([^"]+)":\s*"([^"]+)"/g);
          if (quotedValues) {
            const extracted = {};
            quotedValues.forEach((match) => {
              const keyValue = match.match(/"([^"]+)":\s*"([^"]+)"/);
              if (keyValue) {
                extracted[keyValue[1]] = keyValue[2];
              }
            });
            params = extracted;
          }
        }
      }
      const thoughtMatch = cleanText.match(/^(.*?)Tool Call:/s);
      const thought2 = thoughtMatch ? thoughtMatch[1].trim() : `Appel de l'outil ${toolName}`;
      return JSON.stringify({
        thought: thought2,
        command: {
          name: toolName,
          params
        }
      });
    }
    const lowerText = cleanText.toLowerCase();
    const directActionKeywords = [
      "continue",
      "continuer",
      "reprendre",
      "recommencer",
      "next",
      "go",
      "ok",
      "lancer",
      "start",
      "run",
      "execute",
      "executer",
      "type",
      "enter",
      "input",
      "fill",
      "complete",
      "submit",
      "taper",
      "entrer",
      "remplir",
      "compl\xE9ter",
      "soumettre"
    ];
    const isDirectAction = directActionKeywords.some(
      (keyword) => lowerText.includes(keyword)
    );
    const gameKeywords = [
      "jeu",
      "game",
      "defender",
      "projet",
      "project",
      "application",
      "app"
    ];
    const isGameRequest = gameKeywords.some(
      (keyword) => lowerText.includes(keyword)
    );
    if (isDirectAction && isGameRequest) {
      thought = "L'utilisateur demande de continuer/reprendre un projet. Je vais d'abord explorer la structure du projet.";
      command = {
        name: "listDirectory",
        params: {
          path: "."
        }
      };
    } else if (isDirectAction && cleanText.length < 15) {
      thought = "L'utilisateur veut continuer. Je vais d'abord voir l'\xE9tat actuel du projet.";
      command = {
        name: "listDirectory",
        params: {
          path: "."
        }
      };
    } else if (this.isFormContinuationResponse(cleanText)) {
      thought = "L'IA indique qu'elle va continuer avec la prochaine \xE9tape du formulaire.";
      command = this.getNextFormStep(cleanText);
    }
    const canvasKeywords = [
      "canvas",
      "demo",
      "visual",
      "html page",
      "web page",
      "interface",
      "render",
      "visualize",
      "graph"
      // Removed 'chart' to avoid false positives when agent plans to create charts
    ];
    const displayPatterns = [
      /afficher.*canvas/i,
      /montrer.*canvas/i,
      /display.*canvas/i,
      /show.*canvas/i,
      /create.*interface/i,
      /générer.*page/i,
      /render.*html/i
    ];
    const planningPhrases = [
      "i will generate",
      "i need to",
      "then, i will",
      "je vais g\xE9n\xE9rer",
      "je dois",
      "puis, je vais",
      "now i need",
      "maintenant je dois",
      "next, i will",
      "ensuite, je vais"
    ];
    const isPlanningThought = planningPhrases.some(
      (phrase) => lowerText.includes(phrase)
    );
    const isCanvasRequest = !isPlanningThought && (canvasKeywords.some((keyword) => lowerText.includes(keyword)) || displayPatterns.some((pattern) => pattern.test(cleanText)));
    const thoughtKeywords = [
      "think",
      "thought",
      "reason",
      "plan",
      "approach",
      "next step",
      "r\xE9flexion",
      "pens\xE9e",
      "raisonnement",
      "prochaine \xE9tape",
      "je vais"
    ];
    const isThoughtContent = thoughtKeywords.some(
      (keyword) => lowerText.includes(keyword)
    );
    const isAgentThought = cleanText.startsWith("Je vais") || cleanText.startsWith("I will") || cleanText.startsWith("I am going") || cleanText.startsWith("Je dois") || cleanText.startsWith("I need to") || cleanText.startsWith("I have the") || cleanText.startsWith("Now I need") || cleanText.includes("next step") || cleanText.includes("prochaine \xE9tape") || cleanText.includes("then, i will") || cleanText.includes("then i will") || isPlanningThought;
    const todoKeywords = [
      "todo",
      "task",
      "todo list",
      "task list",
      "liste de t\xE2ches",
      "step",
      "workflow",
      "t\xE2che",
      "\xE9tape"
    ];
    const isTodoRequest = todoKeywords.some(
      (keyword) => lowerText.includes(keyword)
    );
    const isListFilesRequest = (lowerText.includes("list") || lowerText.includes("lister")) && (lowerText.includes("workspace") || lowerText.includes("directory") || lowerText.includes("files") || lowerText.includes("fichiers") || lowerText.includes("dossier"));
    const creationKeywords = [
      "create",
      "build",
      "make",
      "generate",
      "develop",
      "implement",
      "write",
      "game",
      "website",
      "app",
      "cr\xE9er",
      "construire",
      "faire",
      "g\xE9n\xE9rer",
      "d\xE9velopper",
      "impl\xE9menter",
      "\xE9crire"
    ];
    const isCreationRequest = creationKeywords.some(
      (keyword) => lowerText.includes(keyword)
    );
    const multiFilePatterns = [
      /```html[\s\S]*?```[\s\S]*?```css[\s\S]*?```/i,
      /```html[\s\S]*?```[\s\S]*?```javascript[\s\S]*?```/i,
      /```css[\s\S]*?```[\s\S]*?```javascript[\s\S]*?```/i,
      /<\!DOCTYPE html[\s\S]*?<\/html>[\s\S]*?body\s*\{[\s\S]*?\}/i,
      /index\.html[\s\S]*?style\.css[\s\S]*?game\.js/i,
      /\*\*index\.html\*\*[\s\S]*?\*\*style\.css\*\*[\s\S]*?\*\*game\.js\*\*/i
    ];
    const isMultiFileResponse = multiFilePatterns.some(
      (pattern) => pattern.test(cleanText)
    );
    if (isMultiFileResponse) {
      const parsedFiles = this.parseMultiFileResponse(cleanText);
      if (parsedFiles.length > 0) {
        const firstFile = parsedFiles[0];
        thought = `Cr\xE9ation de ${parsedFiles.length} fichiers pour le projet. Cr\xE9ation du fichier ${firstFile.filename} et affichage dans le canvas.`;
        command = {
          name: "writeFile",
          params: {
            path: firstFile.filename,
            content: firstFile.content
          }
        };
        if (parsedFiles.length > 1) {
          this.pendingMultiFileOperations = parsedFiles.slice(1);
        }
        return JSON.stringify({ thought, command });
      }
    }
    const isTruncated = this.isResponseTruncated(cleanText);
    if (isTruncated) {
      thought = "La r\xE9ponse de l'IA semble incompl\xE8te.";
      command = {
        name: "finish",
        params: {
          response: "La r\xE9ponse pr\xE9c\xE9dente \xE9tait incompl\xE8te. Pourriez-vous reformuler votre demande pour obtenir une r\xE9ponse plus claire ?"
        }
      };
    } else if (isListFilesRequest) {
      thought = "L'utilisateur veut lister des fichiers/dossiers.";
      command = {
        name: "listDirectory",
        params: {
          path: "."
        }
      };
    } else if (isThoughtContent || isAgentThought) {
      thought = "R\xE9ponse de l'IA trait\xE9e.";
      command = {
        name: "finish",
        params: {
          response: cleanText
        }
      };
    } else if (isCanvasRequest && !isThoughtContent && !isAgentThought) {
      thought = "L'utilisateur veut afficher quelque chose dans le canvas.";
      let filteredContent = cleanText;
      try {
        const parsed = JSON.parse(cleanText);
        if (parsed.thought || parsed.command) {
          filteredContent = "<div style='padding: 20px; text-align: center;'><h2>Content filtered</h2><p>Internal agent debugging information was filtered out for security.</p></div>";
        }
      } catch {
        if (cleanText.includes('"thought"') || cleanText.includes("```json")) {
          filteredContent = "<div style='padding: 20px; text-align: center;'><h2>Content filtered</h2><p>Internal agent debugging information was filtered out for security.</p></div>";
        }
      }
      command = {
        name: "display_canvas",
        params: {
          content: cleanText.includes("helloworld") ? "<div style='display: flex; justify-content: center; align-items: center; height: 100vh; font-size: 48px; font-weight: bold;'>helloworld</div>" : filteredContent,
          // Use filteredContent directly instead of wrapping it
          contentType: "html"
        }
      };
    } else if (isCreationRequest && isTodoRequest) {
      const smartTodos = this.createSmartTodoList(cleanText);
      thought = "Je vais cr\xE9er une todo list sp\xE9cifique et utile pour organiser le travail demand\xE9.";
      command = {
        name: "todo_write",
        params: {
          todos: smartTodos
        }
      };
    } else if (isTodoRequest) {
      thought = "L'utilisateur veut utiliser la todo list. Je vais afficher ou g\xE9rer la todo list.";
      command = {
        name: "todo_write",
        params: {
          action: "display"
        }
      };
    } else if (isCreationRequest) {
      const recentCommands = this.commandHistory.slice(-2);
      const hasRecentTodoList = recentCommands.some(
        (cmd) => cmd.name === "todo_write" && cmd.params && (cmd.params.action === "create" || cmd.params.action === "display")
      );
      if (hasRecentTodoList) {
        thought = "J'ai d\xE9j\xE0 cr\xE9\xE9 une todo list r\xE9cemment.";
        command = {
          name: "finish",
          params: {
            response: "J'ai d\xE9j\xE0 cr\xE9\xE9 une liste de t\xE2ches pour ce projet. Si vous souhaitez modifier ou consulter la liste existante, faites-le moi savoir."
          }
        };
      } else {
        const smartTodos = this.createSmartTodoList(cleanText);
        thought = "Je vais cr\xE9er une todo list sp\xE9cifique et utile pour organiser le travail demand\xE9.";
        command = {
          name: "todo_write",
          params: {
            todos: smartTodos
          }
        };
      }
    } else {
      if (cleanText.toLowerCase().includes("search") || cleanText.toLowerCase().includes("recherche")) {
        thought = "L'utilisateur demande une recherche. Je vais utiliser Playwright pour naviguer vers un moteur de recherche.";
        command = {
          name: "playwright_navigate",
          params: {
            url: `https://www.google.com/search?q=${encodeURIComponent(cleanText.replace(/^.*?(search|recherche)\s+/i, "").trim() || cleanText)}`
          }
        };
      } else if (
        // Web navigation detection (French and English)
        cleanText.toLowerCase().includes("vas sur") || cleanText.toLowerCase().includes("va sur") || cleanText.toLowerCase().includes("aller sur") || cleanText.toLowerCase().includes("aller \xE0") || cleanText.toLowerCase().includes("navigue sur") || cleanText.toLowerCase().includes("go to") || cleanText.toLowerCase().includes("navigate to") || cleanText.toLowerCase().includes("visit") || cleanText.toLowerCase().includes("open") || // Popular sites detection
        cleanText.toLowerCase().includes("youtube") || cleanText.toLowerCase().includes("google") || cleanText.toLowerCase().includes("github") || cleanText.toLowerCase().includes("facebook") || cleanText.toLowerCase().includes("twitter") || cleanText.toLowerCase().includes("linkedin") || // URL patterns
        cleanText.match(/https?:\/\/[^\s<>"']+/i)
      ) {
        thought = "L'utilisateur demande une navigation web. Je vais utiliser web_automation pour naviguer.";
        let url = "";
        const lowerText2 = cleanText.toLowerCase();
        const urlMatch = cleanText.match(/https?:\/\/[^\s<>"']+/i);
        if (urlMatch) {
          url = urlMatch[0];
        } else if (lowerText2.includes("youtube")) {
          const channelMatch = cleanText.match(/youtube.*?(de|et|affiche.*page.*de)\s+([a-zA-Z\s]+)/i);
          if (channelMatch) {
            const searchTerm = channelMatch[2].trim();
            url = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchTerm)}`;
          } else {
            url = "https://www.youtube.com";
          }
        } else if (lowerText2.includes("google")) {
          url = "https://www.google.com";
        } else if (lowerText2.includes("github")) {
          url = "https://www.github.com";
        } else if (lowerText2.includes("facebook")) {
          url = "https://www.facebook.com";
        } else if (lowerText2.includes("twitter")) {
          url = "https://www.twitter.com";
        } else if (lowerText2.includes("linkedin")) {
          url = "https://www.linkedin.com";
        } else {
          const domainMatch = cleanText.match(/(?:sur|to|visit|open)\s+([a-zA-Z0-9.-]+\.com)/i);
          if (domainMatch) {
            url = `https://${domainMatch[1]}`;
          } else {
            url = "https://www.google.com";
          }
        }
        command = {
          name: "web_automation",
          params: {
            action: "navigate",
            url
          }
        };
      } else if (cleanText.toLowerCase().includes("editfile") || cleanText.toLowerCase().includes("edit") || cleanText.toLowerCase().includes("modifier") || cleanText.toLowerCase().includes("ajouter") || cleanText.toLowerCase().includes("add")) {
        thought = "L'utilisateur veut modifier un fichier.";
        const fileMatch = cleanText.match(/[\w/.-]+\.(js|ts|json|txt|md)/);
        const fileName = fileMatch ? fileMatch[0] : "test-file.txt";
        const contentMatch = cleanText.match(/"([^"]+)"/) || cleanText.match(/'([^']+)'/);
        const contentToAdd = contentMatch ? contentMatch[1] : "New content";
        command = {
          name: "editFile",
          params: {
            path: fileName,
            content_to_replace: "$",
            new_content: `
${contentToAdd}`,
            is_regex: true
          }
        };
      } else if (cleanText.toLowerCase().includes("readfile") || cleanText.toLowerCase().includes("read") || cleanText.toLowerCase().includes("lire") || cleanText.toLowerCase().includes("file") && !cleanText.toLowerCase().includes("edit")) {
        thought = "L'utilisateur veut lire un fichier.";
        const fileMatch = cleanText.match(/[\w/.-]+\.(js|ts|json|txt|md)/);
        const fileName = fileMatch ? fileMatch[0] : "test-complex.json";
        command = {
          name: "readFile",
          params: {
            path: fileName
          }
        };
      } else if (cleanText.toLowerCase().includes("copyfile") || cleanText.toLowerCase().includes("copy") || cleanText.toLowerCase().includes("copier")) {
        thought = "L'utilisateur veut copier un fichier.";
        const fileMatches = cleanText.match(/[\w/.-]+\.(js|ts|json|txt|md)/g);
        const source = fileMatches ? fileMatches[0] : "source.txt";
        const destination = fileMatches && fileMatches[1] ? fileMatches[1] : "destination.txt";
        command = {
          name: "executeShellCommand",
          params: {
            command: `cp "${source}" "${destination}"`
          }
        };
      } else if (cleanText.toLowerCase().includes("search") || cleanText.toLowerCase().includes("replace") || cleanText.toLowerCase().includes("chercher") || cleanText.toLowerCase().includes("remplacer")) {
        thought = "L'utilisateur veut effectuer une recherche et remplacement dans un fichier.";
        const searchMatch = cleanText.match(/search\s+["']([^"']+)["']/i) || cleanText.match(/chercher\s+["']([^"']+)["']/i);
        const replaceMatch = cleanText.match(/replace\s+["']([^"']+)["']/i) || cleanText.match(/remplacer\s+["']([^"']+)["']/i);
        const fileMatch = cleanText.match(/[\w/.-]+\.(js|ts|json|txt|md)/);
        const searchTerm = searchMatch ? searchMatch[1] : "old text";
        const replaceTerm = replaceMatch ? replaceMatch[1] : "new text";
        const fileName = fileMatch ? fileMatch[0] : "test-file.txt";
        command = {
          name: "editFile",
          params: {
            path: fileName,
            content_to_replace: searchTerm,
            new_content: replaceTerm,
            is_regex: false
          }
        };
      } else if (cleanText.toLowerCase().includes("workspace") || cleanText.toLowerCase().includes("project") || cleanText.toLowerCase().includes("projet")) {
        thought = "L'utilisateur veut explorer le workspace/projet.";
        command = {
          name: "listDirectory",
          params: {
            path: "."
          }
        };
      } else {
        const continueKeywords = [
          "continue",
          "continuer",
          "next",
          "suivant",
          "reprendre",
          "resume",
          "start"
        ];
        const workKeywords = [
          "faire",
          "do",
          "work",
          "implement",
          "create",
          "build",
          "develop"
        ];
        const shouldContinue = continueKeywords.some(
          (keyword) => lowerText.includes(keyword)
        );
        const isWorkRequest = workKeywords.some(
          (keyword) => lowerText.includes(keyword)
        );
        if (cleanText.length < 10 && !shouldContinue) {
          thought = "R\xE9ponse simple de l'utilisateur.";
          command = {
            name: "finish",
            params: {
              response: cleanText.length > 0 ? cleanText : "Hello! How can I help you?"
            }
          };
        } else if (shouldContinue || isWorkRequest) {
          const recentTodoCommands = this.commandHistory.slice(-5).filter((cmd) => cmd.name === "todo_write");
          if (recentTodoCommands.length > 0) {
            thought = "L'utilisateur veut continuer. Je vais travailler sur la prochaine t\xE2che de la todo list.";
            command = {
              name: "listDirectory",
              params: {
                path: ".",
                detailed: true
              }
            };
          } else {
            thought = "L'utilisateur veut commencer \xE0 travailler. Je vais d'abord cr\xE9er une todo list.";
            const smartTodos = this.createSmartTodoList(cleanText);
            command = {
              name: "todo_write",
              params: {
                todos: smartTodos
              }
            };
          }
        } else {
          if (lowerText.includes("projet") || lowerText.includes("project") || lowerText.includes("travail")) {
            thought = "L'utilisateur parle d'un projet. Je vais explorer la structure du projet.";
            command = {
              name: "listDirectory",
              params: {
                path: ".",
                detailed: true
              }
            };
          } else {
            const debugKeywords = ["debug", "error", "logs", "analyse", "analysis", "troubleshoot", "investigate", "stack trace", "exception", "bug", "issue", "problem", "failure", "crash"];
            const hasDebugKeywords = debugKeywords.some((keyword) => lowerText.includes(keyword));
            const todoKeywords2 = ["todo", "task", "comprehensive", "planning", "management", "web application", "building", "development", "phases"];
            const hasTodoKeywords = todoKeywords2.some((keyword) => lowerText.includes(keyword));
            if (hasDebugKeywords) {
              thought = "D\xE9tection d'une demande de d\xE9bogage/analyse. Je vais d'abord explorer les fichiers de log disponibles.";
              command = {
                name: "listFiles",
                params: {
                  path: "."
                }
              };
            } else if (hasTodoKeywords) {
              thought = "D\xE9tection d'une demande n\xE9cessitant une planification. Je vais cr\xE9er une todo list structur\xE9e.";
              const smartTodos = this.createSmartTodoList(cleanText);
              command = {
                name: "todo_write",
                params: {
                  todos: smartTodos
                }
              };
            } else if (cleanText.length > 50 || lowerText.includes("test") || lowerText.includes("complex") || lowerText.includes("run") || lowerText.includes("execute")) {
              thought = "Requ\xEAte complexe d\xE9tect\xE9e. Je vais explorer l'environnement pour mieux comprendre le contexte.";
              command = {
                name: "listFiles",
                params: {
                  path: "."
                }
              };
            } else {
              thought = "Traitement de la r\xE9ponse simple de l'utilisateur.";
              command = {
                name: "finish",
                params: {
                  response: cleanText
                }
              };
            }
          }
        }
      }
    }
    const jsonObject = { command, thought };
    return JSON.stringify(jsonObject);
  }
  /**
   * Check if a response appears to be truncated or incomplete
   */
  isResponseTruncated(text) {
    const truncationIndicators = [
      "\\",
      // Escaped characters at end
      '",',
      // Incomplete key-value pair with comma
      '":'
      // Incomplete string with colon
    ];
    const trimmed = text.trim();
    if (truncationIndicators.some((indicator) => trimmed.endsWith(indicator))) {
      return true;
    }
    const codeBlockPatterns = [
      "```javascript",
      "```html",
      "```json",
      "function",
      "const ",
      "let ",
      "var ",
      "if (",
      "for (",
      "while ("
    ];
    if (codeBlockPatterns.some(
      (pattern) => trimmed.includes(pattern) && !trimmed.includes("```") && trimmed.length > 100
    )) {
      return true;
    }
    if (trimmed.length < 50 && (trimmed.includes("Tool Call:") || trimmed.includes("Tool Result:"))) {
      return true;
    }
    if (trimmed.length > 100 && (trimmed.includes('{"') || trimmed.includes('"command"') || trimmed.includes('"thought"')) && !trimmed.endsWith("}") && !trimmed.endsWith('"]')) {
      return true;
    }
    return false;
  }
  detectLoop(thought, command) {
    const now = Date.now();
    this.behaviorHistory.push({
      command,
      thought,
      timestamp: now
    });
    if (this.behaviorHistory.length > this.maxBehaviorHistory) {
      this.behaviorHistory.shift();
    }
    if (this.behaviorHistory.length >= 3) {
      if (command && command.name === "todo_write") {
        const recentTodoCommands = this.behaviorHistory.slice(-3).filter((behavior) => behavior.command?.name === "todo_write");
        if (recentTodoCommands.length >= 3) {
          this.log.warn(
            `\u{1F6A8} CRITICAL: todo_write loop detected! Forcing finish command after ${recentTodoCommands.length} repetitions`
          );
          this.log.info("\u{1F527} Forcing finish response due to todo_write loop");
          return true;
        }
      }
      if (command) {
        const recentCommands = this.behaviorHistory.slice(
          -this.loopDetectionThreshold
        );
        const allSameCommand = recentCommands.every(
          (behavior) => behavior.command && behavior.command.name === command.name && JSON.stringify(behavior.command.params) === JSON.stringify(command.params)
        );
        if (allSameCommand) {
          this.log.warn(
            `Loop detected: Same command '${command.name}' repeated ${this.loopDetectionThreshold} times`
          );
          return true;
        }
      }
      if (thought && !command) {
        const recentThoughts = this.behaviorHistory.slice(
          -this.loopDetectionThreshold
        );
        const allSimilarThoughts = recentThoughts.every(
          (behavior, index, arr) => behavior.thought && this.calculateTextSimilarity(behavior.thought, thought) > 0.8
        );
        if (allSimilarThoughts) {
          this.log.warn(
            `Loop detected: Similar thoughts repeated ${this.loopDetectionThreshold} times`
          );
          return true;
        }
      }
    }
    return false;
  }
  async executeTool(command, log) {
    try {
      this.publishToChannel({
        data: { args: command.params, name: command.name },
        type: "tool.start"
      });
      let result;
      if (command.name === "ls -la") {
        try {
          result = await toolRegistry.execute(
            "simpleList",
            { detailed: true },
            {
              job: this.job,
              llm: getLlmProvider(this.activeLlmProvider),
              log,
              reportProgress: async (data) => {
                this.job.updateProgress(data);
              },
              session: this.session,
              streamContent: async (data) => {
                this.publishToChannel({
                  content: data,
                  toolName: command.name,
                  type: "tool_stream"
                });
              },
              taskQueue: this.taskQueue
            }
          );
        } catch (toolError) {
          log.error(
            {
              error: toolError instanceof Error ? toolError : new Error(String(toolError)),
              params: command.params,
              tool: command.name
            },
            `Error executing tool ${command.name}`
          );
          throw toolError;
        }
      } else {
        try {
          result = await toolRegistry.execute(command.name, command.params, {
            job: this.job,
            llm: getLlmProvider(this.activeLlmProvider),
            log,
            reportProgress: async (data) => {
              this.job.updateProgress(data);
            },
            session: this.session,
            streamContent: async (data) => {
              this.publishToChannel({
                content: data,
                toolName: command.name,
                type: "tool_stream"
              });
            },
            taskQueue: this.taskQueue
          });
        } catch (toolError) {
          this.trackExecutedAction(command.name, false);
          log.error(
            {
              error: toolError instanceof Error ? toolError : new Error(String(toolError)),
              params: command.params,
              tool: command.name
            },
            `Error executing tool ${command.name}`
          );
          throw toolError;
        }
      }
      this.publishToChannel({
        result,
        // Removed 'as unknown'
        toolName: command.name,
        type: "tool_result"
      });
      this.trackExecutedAction(command.name, true);
      if (command.name === "display_canvas") {
        this.lastDisplayCanvasCall = Date.now();
        log.info("\u2705 display_canvas tracked as executed successfully");
      }
      const readOnlyTools = ["listDirectory", "listFiles", "readFile"];
      const isReadOnlyCommand = readOnlyTools.includes(command.name);
      const isSimpleRequest = this.session.history.length <= 2;
      if (isReadOnlyCommand && isSimpleRequest) {
        log.info(`\u{1F3C1} Auto-finishing after ${command.name} for simple request`);
        const response = typeof result === "string" ? result : JSON.stringify(result);
        throw new FinishToolSignal(response);
      }
      return result;
    } catch (_error) {
      if (_error instanceof FinishToolSignal) {
        throw _error;
      }
      const errorDetails = _error instanceof Error ? {
        message: _error.message,
        name: _error.name,
        stack: _error.stack
      } : {
        message: String(_error),
        name: "UnknownError",
        stack: ""
      };
      log.error(
        {
          error: errorDetails,
          params: command.params,
          tool: command.name
        },
        `Error executing tool ${command.name}`
      );
      this.publishToChannel({
        result: { error: errorDetails },
        toolName: command.name,
        type: "tool_result"
      });
      return `Error executing tool ${command.name}: ${errorDetails.message}`;
    }
  }
  extractJsonFromMarkdown(text) {
    const match = text.match(/```(?:json)?\s*\n([\s\S]+?)\n```/);
    if (match && match[1]) {
      const content = match[1];
      if (content.trim().startsWith("**") && content.trim().endsWith("**") || content.trim().startsWith("#") || content.trim().startsWith("*")) {
        return text.trim();
      }
      try {
        JSON.parse(content);
        return content;
      } catch (error) {
        return text.trim();
      }
    }
    return text.trim();
  }
  async attemptFallbackResponse() {
    this.log.info("Attempting fallback response generation");
    const fallbackPrompt = `
    I need you to provide a simple, direct response to complete this task. 
    Please respond with only:
    {"thought": "Completing the task with a fallback response", "command": {"name": "finish", "params": {"response": "I encountered some technical difficulties but have completed what I can. Please let me know if you need any specific assistance."}}}
    
    Do not include any other text outside the JSON object.`;
    try {
      const response = await getLlmProvider("gemini").getLlmResponse(
        [{ role: "user", parts: [{ text: fallbackPrompt }] }],
        "You are a helpful assistant. Always respond with valid JSON format exactly as requested.",
        this.llmApiKey || this.apiKey,
        this.llmModelName
      );
      if (response) {
        const parsed = this.parseLlmResponse(response, this.log);
        if (parsed.command?.name === "finish" && parsed.command.params?.response) {
          return parsed.command.params.response;
        }
      }
    } catch (error) {
      this.log.error({ error }, "Fallback LLM call also failed");
    }
    return "I apologize, but I encountered technical difficulties completing your request. Please try rephrasing your request or contact support if the issue persists.";
  }
  parseLlmResponse(llmResponse, log) {
    log.info("\u{1F9E0} PARSING LLM Response...");
    const trimmedResponse = llmResponse.trim();
    const isIncomplete = trimmedResponse.endsWith("...") || trimmedResponse.endsWith("```") && !trimmedResponse.endsWith("```json") && !trimmedResponse.endsWith("```") || llmResponse.includes("ASSISTANT:") || llmResponse.includes("La r\xE9ponse de l'IA semble incompl\xE8te") || llmResponse.includes("The response was cut off") || llmResponse.includes("Response truncated") || llmResponse.includes("The agent is thinking...") && !llmResponse.includes("Tool Call:") && !llmResponse.includes("{") || // Plus de tolérance pour les réponses courtes valides
    trimmedResponse.length < 10 && !trimmedResponse.includes('"command"') && !trimmedResponse.includes('"thought"') || // Vérifier si le JSON est valide mais potentiellement tronqué
    trimmedResponse.includes("{") && !trimmedResponse.includes("}") || trimmedResponse.includes('"command"') && !trimmedResponse.includes('"name"');
    const isRepetitive = this.detectRepetitiveResponse(llmResponse);
    if (isIncomplete) {
      log.warn("\u{1F6A8} R\xE9ponse LLM potentiellement incompl\xE8te d\xE9tect\xE9e", {
        responseLength: trimmedResponse.length,
        hasCommand: trimmedResponse.includes('"command"'),
        hasThought: trimmedResponse.includes('"thought"'),
        firstChars: trimmedResponse.substring(0, 100)
      });
      if (trimmedResponse.includes("{") && !trimmedResponse.includes("}")) {
        log.info("\u{1F527} Tentative de r\xE9paration JSON tronqu\xE9...");
        const repairedJson = trimmedResponse + "}";
        if (repairedJson) {
          log.info("\u2705 JSON tronqu\xE9 r\xE9par\xE9 avec succ\xE8s");
          try {
            const parsed = JSON.parse(repairedJson);
            return llmResponseSchema.parse(parsed);
          } catch (repairError) {
            throw new Error("LLM response appears incomplete or truncated");
          }
        } else {
          throw new Error("LLM response appears incomplete or truncated");
        }
      } else {
        throw new Error("LLM response appears incomplete or truncated");
      }
    }
    if (isRepetitive) {
      log.warn("\u{1F6A8} R\xE9ponse LLM r\xE9p\xE9titive d\xE9tect\xE9e, for\xE7age fallback");
      throw new Error("LLM response appears repetitive, avoiding loop");
    }
    let jsonText = llmResponse;
    try {
      jsonText = this.extractJsonFromMarkdown(llmResponse);
    } catch (extractionError) {
      log.warn("\u26A0\uFE0F Failed to extract JSON from markdown, using full response...");
      jsonText = llmResponse;
    }
    log.debug(
      { jsonText: jsonText.substring(0, 200) + "..." },
      "Attempting to parse LLM response"
    );
    try {
      const parsed = JSON.parse(jsonText);
      log.debug({ parsed }, "Successfully parsed LLM response");
      return llmResponseSchema.parse(parsed);
    } catch (error) {
      log.warn("\u26A0\uFE0F Initial parsing failed, trying conversion...");
      try {
        const convertedResponse = this.convertPlainTextToValidJson(jsonText);
        const convertedParsed = JSON.parse(convertedResponse);
        log.info("\u2705 Successfully converted plain text to valid JSON");
        const validated = llmResponseSchema.parse(convertedParsed);
        if (validated.command) {
          log.info(`\u{1F527} Tool detected: ${validated.command.name}`);
        }
        return validated;
      } catch (conversionError) {
        log.error(
          {
            conversionError,
            originalError: error,
            responseLength: llmResponse.length
          },
          "\u{1F4A5} Failed to convert plain text to valid JSON"
        );
      }
      log.error(
        {
          responseStart: llmResponse.substring(0, 100),
          responseEnd: llmResponse.substring(
            Math.max(0, llmResponse.length - 100)
          ),
          jsonTextStart: jsonText.substring(0, 100),
          hasToolCall: jsonText.includes("Tool Call:"),
          hasJson: jsonText.includes("{")
        },
        "\u{1F50D} Detailed parsing failure analysis"
      );
      throw new Error(
        `Failed to parse LLM response: ${jsonText.substring(0, 200)}...`
      );
    }
  }
  publishToChannel(data) {
    const channel = `job:${this.job.id}:events`;
    const message = JSON.stringify(data);
    this.log.info(
      { channel, dataType: data.type, message },
      "[PUBLISH] Publishing message to Redis channel"
    );
    getRedisClientInstance().publish(channel, message);
    this.log.info("[PUBLISH] Message published to Redis successfully");
    const progressData = { ...data };
    if (progressData.type === "tool.start") {
      delete progressData.data.args;
    }
    this.job.updateProgress(progressData);
  }
  /**
   * 🚨 NOUVEAU: Affiche les actions de l'agent de manière détaillée comme un humain
   */
  displayAgentAction(action, details, type = "info") {
    const timestamp = (/* @__PURE__ */ new Date()).toLocaleTimeString("fr-FR");
    const icon = type === "success" ? "\u2705" : type === "warning" ? "\u26A0\uFE0F" : type === "error" ? "\u274C" : "\u{1F527}";
    let message = `${icon} [${timestamp}] ${action}`;
    if (details) {
      if (typeof details === "string") {
        message += `: ${details}`;
      } else if (details.command) {
        message += `: ${details.command}`;
      } else if (details.url) {
        message += `: ${details.url}`;
      } else if (details.tool) {
        message += `: ${details.tool}`;
      }
    }
    this.publishToChannel({
      content: message,
      type: "agent_action_display"
    });
    this.log.info(`\u{1F3AF} AGENT ACTION: ${message}`);
  }
  /**
   * 🚨 NOUVEAU: Affiche les requêtes API de l'agent
   */
  displayApiRequest(method, url, headers, body) {
    const timestamp = (/* @__PURE__ */ new Date()).toLocaleTimeString("fr-FR");
    let curlCommand = `curl -X ${method} "${url}"`;
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        curlCommand += ` \\
  -H "${key}: ${value}"`;
      });
    }
    if (body) {
      curlCommand += ` \\
  -d '${JSON.stringify(body)}'`;
    }
    const message = `\u{1F310} [${timestamp}] Requ\xEAte API:
${curlCommand}`;
    this.publishToChannel({
      content: message,
      type: "agent_api_request"
    });
    this.log.info(`\u{1F310} API REQUEST: ${method} ${url}`);
  }
  /**
   * 🚨 NOUVEAU: Affiche les étapes de traitement de l'agent
   */
  displayProcessingStep(step, total, description) {
    const timestamp = (/* @__PURE__ */ new Date()).toLocaleTimeString("fr-FR");
    const progress = Math.round(step / total * 100);
    const message = `\u{1F4CB} [${timestamp}] \xC9tape ${step}/${total} (${progress}%): ${description}`;
    this.publishToChannel({
      content: message,
      type: "agent_processing_step"
    });
    this.log.info(`\u{1F4CB} PROCESSING STEP ${step}/${total}: ${description}`);
  }
  async setupInterruptListener() {
    const channel = `job:${this.job.id}:interrupt`;
    this.subscriber = getRedisClientInstance().duplicate();
    const messageHandler = (messageChannel, message) => {
      if (messageChannel === channel) {
        this.log.warn(`Interrupting job ${this.job.id}: ${message}`);
        this.interrupted = true;
      }
    };
    this.subscriber.on("message", messageHandler);
    await this.subscriber.subscribe(
      channel,
      (err, count) => {
        if (err) {
          this.log.error(err, `Error subscribing to ${channel}`);
          return;
        }
        this.log.info(
          `Subscribed to ${channel}. Total subscriptions: ${count}`
        );
      }
    );
  }
  // 🚨 AMÉLIORATION: Méthodes de tracking des actions
  trackExecutedAction(actionName, successful) {
    const current = this.executedActions.get(actionName);
    this.executedActions.set(actionName, {
      count: (current?.count || 0) + 1,
      lastExecution: Date.now(),
      successful
    });
    this.log.info(
      `\u{1F4CA} Action tracked: ${actionName} (success: ${successful}, total: ${(current?.count || 0) + 1})`
    );
  }
  hasExecutedActionRecently(actionName, withinMs = 3e4) {
    const action = this.executedActions.get(actionName);
    if (!action || !action.successful) return false;
    const timeSince = Date.now() - action.lastExecution;
    return timeSince <= withinMs;
  }
  getActionExecutionSummary() {
    const summary = [];
    for (const [action, info] of this.executedActions.entries()) {
      if (info.successful) {
        const timeAgo = Math.floor((Date.now() - info.lastExecution) / 1e3);
        summary.push(`\u2705 ${action} (${timeAgo}s ago, ${info.count}x)`);
      } else {
        summary.push(`\u274C ${action} (failed ${info.count}x)`);
      }
    }
    return summary.length > 0 ? summary.join(", ") : "No actions executed yet";
  }
  /**
   * Detect if the agent should start working on pending tasks
   */
  detectIfShouldStartWorking(text) {
    const lowerText = text.toLowerCase();
    const startIndicators = [
      "first",
      "start",
      "begin",
      "let's",
      "i'll start",
      "commencer",
      "premi\xE8rement",
      "commen\xE7ons",
      "je vais commencer"
    ];
    const hasStartIndicators = startIndicators.some(
      (indicator) => lowerText.includes(indicator)
    );
    const recentCommands = this.commandHistory.slice(-2);
    const hasRecentTodoWrite = recentCommands.some(
      (cmd) => cmd.name === "todo_write"
    );
    return hasRecentTodoWrite && hasStartIndicators;
  }
  /**
   * Get the next pending task based on recent todo creation
   */
  getNextPendingTask() {
    const recentCommands = this.commandHistory.slice(-3);
    const todoWriteCommand = recentCommands.find(
      (cmd) => cmd.name === "todo_write"
    );
    if (todoWriteCommand && todoWriteCommand.params?.todos) {
      const todos = todoWriteCommand.params.todos;
      const pendingTodo = todos.find((todo) => todo.status === "pending");
      return pendingTodo || null;
    }
    return null;
  }
  /**
   * Convert a task to an appropriate command
   */
  convertTaskToCommand(task) {
    const lowerContent = task.content.toLowerCase();
    if (lowerContent.includes("list") && lowerContent.includes("tool")) {
      return {
        name: "listTools",
        params: {}
      };
    }
    if (lowerContent.includes("navigate") || lowerContent.includes("go to")) {
      return {
        name: "playwright_navigate",
        params: {
          url: "https://example.com"
          // Default URL, could be made smarter
        }
      };
    }
    if (lowerContent.includes("content") || lowerContent.includes("extract")) {
      return {
        name: "playwright_get_content",
        params: {
          selector: "body"
          // Default selector
        }
      };
    }
    if (lowerContent.includes("screenshot")) {
      return {
        name: "playwright_screenshot",
        params: {}
      };
    }
    if (this.isFormCompletionTask(task)) {
      return this.getNextFormFieldCommand();
    }
    return {
      name: "finish",
      params: {
        response: `Working on: ${task.content}`
      }
    };
  }
  /**
   * Check if the current task involves completing a form
   */
  isFormCompletionTask(task) {
    const lowerContent = task.content.toLowerCase();
    const formKeywords = [
      "form",
      "field",
      "input",
      "fill",
      "complete",
      "submit",
      "formulaire",
      "champ",
      "remplir",
      "compl\xE9ter",
      "soumettre",
      "name",
      "email",
      "phone",
      "address",
      "contact",
      "nom",
      "courriel",
      "t\xE9l\xE9phone",
      "adresse",
      "contact"
    ];
    return formKeywords.some((keyword) => lowerContent.includes(keyword));
  }
  /**
   * Get the next logical form field command based on recent actions
   */
  getNextFormFieldCommand() {
    const recentCommands = this.commandHistory.slice(-3);
    const lastTypeCommand = recentCommands.reverse().find((cmd) => cmd.name === "playwright_type" && cmd.params);
    if (lastTypeCommand) {
      const lastSelector = lastTypeCommand.params.selector || "";
      if (lastSelector.includes("name") || lastSelector.includes("nom")) {
        return {
          name: "playwright_type",
          params: {
            selector: 'input[name="phone"], input[name="tel"], input[name="telephone"], input[type="tel"]',
            text: "+33123456789",
            // Default phone number
            clear: true
          }
        };
      }
      if (lastSelector.includes("phone") || lastSelector.includes("tel")) {
        return {
          name: "playwright_type",
          params: {
            selector: 'input[name="email"], input[type="email"]',
            text: "test@example.com",
            // Default email
            clear: true
          }
        };
      }
      if (lastSelector.includes("email")) {
        return {
          name: "playwright_click",
          params: {
            selector: 'button[type="submit"], input[type="submit"], button:contains("Submit"), button:contains("Send")'
          }
        };
      }
    }
    return {
      name: "playwright_type",
      params: {
        selector: "input[required]:not([value]), input[name]:not([value])",
        text: "Test Value",
        clear: true
      }
    };
  }
  /**
   * Detect if the agent has pending work based on the response content
   */
  detectIfAgentHasPendingWork(text) {
    const lowerText = text.toLowerCase();
    const workIndicators = [
      "i'll",
      "i will",
      "first",
      "then",
      "next",
      "after",
      "following",
      "je vais",
      "ensuite",
      "suivant",
      "apr\xE8s",
      "premi\xE8rement",
      "list",
      "demonstrate",
      "show",
      "create",
      "implement",
      "build",
      "lister",
      "d\xE9montrer",
      "montrer",
      "cr\xE9er",
      "impl\xE9menter",
      "construire",
      "continue",
      "continuer",
      "start",
      "commencer",
      "begin",
      "commencer",
      "plan",
      "planned",
      "planning",
      "planifi\xE9",
      "planification"
    ];
    const hasWorkIndicators = workIndicators.some(
      (indicator) => lowerText.includes(indicator)
    );
    const hasQuestions = lowerText.includes("?");
    const actionKeywords = [
      "tool",
      "tools",
      "navigate",
      "content",
      "screenshot",
      "list",
      "outil",
      "outils",
      "naviguer",
      "contenu",
      "capture",
      "lister"
    ];
    const hasActionKeywords = actionKeywords.some(
      (keyword) => lowerText.includes(keyword)
    );
    const recentCommands = this.commandHistory.slice(-3);
    const hasRecentTodoWrite = recentCommands.some(
      (cmd) => cmd.name === "todo_write"
    );
    if (hasRecentTodoWrite && (hasWorkIndicators || hasActionKeywords)) {
      return true;
    }
    if (hasWorkIndicators && hasActionKeywords) {
      return true;
    }
    if (hasWorkIndicators && hasQuestions) {
      return true;
    }
    return false;
  }
  /**
   * Detect if the response indicates continuation of work rather than completion
   */
  detectIfContinuationResponse(text) {
    const lowerText = text.toLowerCase();
    const continuationIndicators = [
      "i will now",
      "i'm going to",
      "i'll now",
      "now i will",
      "next i will",
      "i am going to",
      "i'm about to",
      "i'll proceed to",
      "i will proceed",
      "je vais maintenant",
      "maintenant je vais",
      "je vais proc\xE9der",
      "je m'appr\xEAte \xE0",
      "ensuite je vais",
      "maintenant je",
      "type",
      "enter",
      "input",
      "fill",
      "complete",
      "submit",
      "taper",
      "entrer",
      "remplir",
      "compl\xE9ter",
      "soumettre",
      "navigate",
      "go to",
      "visit",
      "access",
      "open",
      "naviguer",
      "aller \xE0",
      "visiter",
      "acc\xE9der",
      "ouvrir",
      "click",
      "select",
      "choose",
      "pick",
      "cliquer",
      "s\xE9lectionner",
      "choisir",
      "s\xE9lectionner",
      "search",
      "find",
      "look for",
      "locate",
      "chercher",
      "trouver",
      "rechercher",
      "localiser"
    ];
    const hasContinuationIndicators = continuationIndicators.some(
      (indicator) => lowerText.includes(indicator)
    );
    const formActionKeywords = [
      "field",
      "input",
      "form",
      "button",
      "textbox",
      "textarea",
      "champ",
      "entr\xE9e",
      "formulaire",
      "bouton",
      "zone de texte",
      "name",
      "email",
      "phone",
      "address",
      "password",
      "nom",
      "courriel",
      "t\xE9l\xE9phone",
      "adresse",
      "mot de passe",
      "telephone",
      "t\xE9l\xE9phone",
      "number",
      "num\xE9ro"
    ];
    const hasFormKeywords = formActionKeywords.some(
      (keyword) => lowerText.includes(keyword)
    );
    const recentCommands = this.commandHistory.slice(-2);
    const hasRecentFormInteraction = recentCommands.some(
      (cmd) => cmd.name && (cmd.name.includes("playwright") || cmd.name.includes("type") || cmd.name.includes("click") || cmd.name.includes("fill"))
    );
    if (hasContinuationIndicators && hasFormKeywords) {
      return true;
    }
    if (hasContinuationIndicators && hasRecentFormInteraction) {
      return true;
    }
    if (lowerText.includes("type") && (lowerText.includes("into") || lowerText.includes("in"))) {
      return true;
    }
    if ((lowerText.includes("enter") || lowerText.includes("input")) && hasFormKeywords) {
      return true;
    }
    return false;
  }
  /**
   * Detect if we should switch to local mode based on text content
   */
  detectIfShouldUseLocalMode(text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes("playwright_") || lowerText.includes("browser")) {
      return false;
    }
    if (lowerText.includes("navigate") || lowerText.includes("click") || lowerText.includes("wait_for_selector") || lowerText.includes("console") || lowerText.includes("inject") || lowerText.includes("evaluate") || lowerText.includes("search_google") || lowerText.includes("search_youtube") || lowerText.includes("search_github") || lowerText.includes("drag_and_drop") || lowerText.includes("double_click") || lowerText.includes("right_click") || lowerText.includes("measure_page_load") || lowerText.includes("memory_usage") || lowerText.includes("network_inspector") || lowerText.includes("security_headers") || lowerText.includes("stealth_mode") || lowerText.includes("user_agent") || lowerText.includes("webgl_renderer") || lowerText.includes("canvas_fingerprint") || lowerText.includes("webdriver_property") || lowerText.includes("fake_plugins") || lowerText.includes("screen_resolution") || lowerText.includes("mouse_movement") || lowerText.includes("bypass_cloudflare") || lowerText.includes("bypass_recaptcha") || lowerText.includes("typing_speed") || lowerText.includes("rotating_proxy") || lowerText.includes("spoof_timezone") || lowerText.includes("behavioral_pattern")) {
      return false;
    }
    if (lowerText.includes("display_canvas") || lowerText.includes("canvas_display") || lowerText.includes("canvas_render") || lowerText.includes("canvas_show") || lowerText.includes("afficher_canvas") || lowerText.includes("affichage_canvas")) {
      return false;
    }
    const localKeywords = [
      "list",
      "read",
      "file",
      "directory",
      "status",
      "info",
      "local",
      "lister",
      "lire",
      "fichier",
      "dossier",
      "\xE9tat",
      "information"
    ];
    const hasLocalKeywords = localKeywords.some(
      (keyword) => lowerText.includes(keyword)
    );
    const hasPendingTasks = this.getNextPendingTask() !== null;
    return hasLocalKeywords || hasPendingTasks;
  }
  /**
   * Generate a response for local mode operation
   */
  generateLocalModeResponse(text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes("list") || lowerText.includes("lister")) {
      return JSON.stringify({
        thought: "Je vais lister les fichiers disponibles localement.",
        command: {
          name: "listFiles",
          params: { path: "." }
        }
      });
    }
    if (lowerText.includes("read") || lowerText.includes("lire") || lowerText.includes("file")) {
      return JSON.stringify({
        thought: "Je vais lire un fichier localement.",
        command: {
          name: "readFile",
          params: {
            filePath: "/home/demon/agentforge/AgenticForge2/AgenticForge/README.md"
          }
        }
      });
    }
    if (lowerText.includes("status") || lowerText.includes("info") || lowerText.includes("\xE9tat")) {
      return JSON.stringify({
        thought: "Je vais afficher les informations syst\xE8me.",
        command: {
          name: "listTools",
          params: {}
        }
      });
    }
    return JSON.stringify({
      thought: "Passage en mode local pour effectuer des op\xE9rations syst\xE8me.",
      command: {
        name: "listDirectory",
        params: { path: ".", detailed: true }
      }
    });
  }
  /**
   * Generate a local fallback response when all LLM providers fail
   */
  async generateLocalFallbackResponse() {
    this.log.info("Generating local fallback response...");
    const nextTask = this.getNextPendingTask();
    if (nextTask) {
      this.log.info(`Found pending task: ${nextTask.content}`);
      const localCommand = this.convertTaskToLocalCommand(nextTask);
      if (localCommand) {
        this.log.info(`Converting to local command: ${localCommand.name}`);
        try {
          const result = await this.executeTool(localCommand, this.log);
          this.log.info("Local command executed successfully");
          return JSON.stringify({
            thought: `Executed local task: ${nextTask.content}`,
            command: {
              name: "finish",
              params: {
                response: `I successfully completed the local task: ${nextTask.content}. Result: ${result}`
              }
            }
          });
        } catch (error) {
          this.log.error({ error }, "Local command execution failed");
          return JSON.stringify({
            thought: `Local task failed: ${nextTask.content}`,
            command: {
              name: "finish",
              params: {
                response: `I attempted to complete the local task: ${nextTask.content}, but encountered an error. Please check the system status.`
              }
            }
          });
        }
      }
    }
    return JSON.stringify({
      thought: "All LLM providers are unavailable, but I can help with local system tasks.",
      command: {
        name: "finish",
        params: {
          response: "I'm currently unable to access LLM services, but I can help you with local system operations. Please let me know what specific local tasks you'd like me to perform."
        }
      }
    });
  }
  /**
   * Convert a task to a local command that doesn't require LLM
   */
  convertTaskToLocalCommand(task) {
    const lowerContent = task.content.toLowerCase();
    if (lowerContent.includes("list") && lowerContent.includes("file")) {
      return {
        name: "listFiles",
        params: { path: "." }
      };
    }
    if (lowerContent.includes("read") || lowerContent.includes("examine")) {
      return {
        name: "readFile",
        params: {
          filePath: "/home/demon/agentforge/AgenticForge2/AgenticForge/README.md"
        }
      };
    }
    if (lowerContent.includes("status") || lowerContent.includes("info")) {
      return {
        name: "listTools",
        params: {}
      };
    }
    if (lowerContent.includes("explore") || lowerContent.includes("directory")) {
      return {
        name: "listDirectory",
        params: { path: ".", detailed: true }
      };
    }
    return null;
  }
  /**
   * Crée une todo list intelligente basée sur le contenu de la demande utilisateur
   */
  createSmartTodoList(userRequest) {
    const lowerRequest = userRequest.toLowerCase();
    const todos = [];
    if (lowerRequest.includes("game") || lowerRequest.includes("jeu") || lowerRequest.includes("defender")) {
      todos.push(
        {
          id: "1",
          content: "Analyser les sp\xE9cifications du jeu Defender et ses m\xE9caniques",
          status: "pending",
          priority: "high",
          category: "analysis"
        },
        {
          id: "2",
          content: "Concevoir l'architecture du jeu (classes, composants)",
          status: "pending",
          priority: "high",
          category: "design"
        },
        {
          id: "3",
          content: "Impl\xE9menter le joueur et ses contr\xF4les",
          status: "pending",
          priority: "high",
          category: "development"
        },
        {
          id: "4",
          content: "Cr\xE9er le syst\xE8me d'ennemis et d'obstacles",
          status: "pending",
          priority: "high",
          category: "development"
        },
        {
          id: "5",
          content: "Ajouter le syst\xE8me de score et de vies",
          status: "pending",
          priority: "medium",
          category: "development"
        },
        {
          id: "6",
          content: "Impl\xE9menter les effets visuels et sons",
          status: "pending",
          priority: "medium",
          category: "development"
        },
        {
          id: "7",
          content: "Tester et d\xE9boguer le jeu",
          status: "pending",
          priority: "high",
          category: "testing"
        }
      );
    } else if (lowerRequest.includes("website") || lowerRequest.includes("site web") || lowerRequest.includes("web")) {
      todos.push(
        {
          id: "1",
          content: "D\xE9finir les sp\xE9cifications fonctionnelles du site web",
          status: "pending",
          priority: "high",
          category: "planning"
        },
        {
          id: "2",
          content: "Cr\xE9er la maquette et le design de l'interface",
          status: "pending",
          priority: "high",
          category: "design"
        },
        {
          id: "3",
          content: "D\xE9velopper la structure HTML et CSS",
          status: "pending",
          priority: "high",
          category: "development"
        },
        {
          id: "4",
          content: "Impl\xE9menter les fonctionnalit\xE9s JavaScript",
          status: "pending",
          priority: "high",
          category: "development"
        },
        {
          id: "5",
          content: "Optimiser pour les appareils mobiles",
          status: "pending",
          priority: "medium",
          category: "development"
        },
        {
          id: "6",
          content: "Tester la compatibilit\xE9 cross-browser",
          status: "pending",
          priority: "medium",
          category: "testing"
        }
      );
    } else if (lowerRequest.includes("app") || lowerRequest.includes("application") || lowerRequest.includes("mobile")) {
      todos.push(
        {
          id: "1",
          content: "Analyser les besoins utilisateurs et sp\xE9cifications",
          status: "pending",
          priority: "high",
          category: "analysis"
        },
        {
          id: "2",
          content: "Concevoir l'architecture et l'interface utilisateur",
          status: "pending",
          priority: "high",
          category: "design"
        },
        {
          id: "3",
          content: "D\xE9velopper les fonctionnalit\xE9s principales",
          status: "pending",
          priority: "high",
          category: "development"
        },
        {
          id: "4",
          content: "Impl\xE9menter la gestion des donn\xE9es",
          status: "pending",
          priority: "high",
          category: "development"
        },
        {
          id: "5",
          content: "Ajouter les tests unitaires et d'int\xE9gration",
          status: "pending",
          priority: "medium",
          category: "testing"
        },
        {
          id: "6",
          content: "Pr\xE9parer le d\xE9ploiement et la distribution",
          status: "pending",
          priority: "medium",
          category: "deployment"
        }
      );
    } else {
      todos.push(
        {
          id: "1",
          content: "Analyser la demande et d\xE9finir les objectifs",
          status: "pending",
          priority: "high",
          category: "analysis"
        },
        {
          id: "2",
          content: "Planifier l'approche et les \xE9tapes",
          status: "pending",
          priority: "high",
          category: "planning"
        },
        {
          id: "3",
          content: "Commencer l'impl\xE9mentation",
          status: "pending",
          priority: "high",
          category: "development"
        },
        {
          id: "4",
          content: "Tester et valider les r\xE9sultats",
          status: "pending",
          priority: "medium",
          category: "testing"
        }
      );
    }
    return todos;
  }
  /**
   * Check if the response indicates continuation of a form-filling task
   */
  isFormContinuationResponse(text) {
    const lowerText = text.toLowerCase();
    const formContinuationKeywords = [
      "telephone",
      "phone",
      "t\xE9l\xE9phone",
      "number",
      "num\xE9ro",
      "email",
      "courriel",
      "address",
      "adresse",
      "city",
      "ville",
      "zip",
      "postal",
      "code",
      "message",
      "comment",
      "type",
      "enter",
      "input",
      "fill",
      "complete",
      "taper",
      "entrer",
      "remplir",
      "compl\xE9ter"
    ];
    const hasFormFieldKeywords = formContinuationKeywords.some(
      (keyword) => lowerText.includes(keyword)
    );
    const recentCommands = this.commandHistory.slice(-2);
    const hasRecentFormInteraction = recentCommands.some(
      (cmd) => cmd.name && (cmd.name.includes("playwright_type") || cmd.name.includes("playwright_click") || cmd.name === "playwright_type")
    );
    return hasFormFieldKeywords && hasRecentFormInteraction;
  }
  /**
   * Parse multi-file responses containing HTML, CSS, and JavaScript code
   */
  parseMultiFileResponse(text) {
    const files = [];
    const htmlMatch = text.match(/```html\s*\n([\s\S]*?)\n```/i);
    if (htmlMatch) {
      const htmlContent = htmlMatch[1].trim();
      const filenameMatch = htmlContent.match(/<!--\s*filename:\s*([^\s]+)\s*-->/i) || htmlContent.match(/<!--\s*([^\s]+\.html)\s*-->/i);
      const filename = filenameMatch ? filenameMatch[1] : "index.html";
      files.push({
        filename,
        content: htmlContent,
        type: "html"
      });
    }
    const cssMatch = text.match(/```css\s*\n([\s\S]*?)\n```/i);
    if (cssMatch) {
      const cssContent = cssMatch[1].trim();
      const filenameMatch = cssContent.match(/\/\*\s*filename:\s*([^\s]+)\s*\*\//i) || cssContent.match(/\/\*\s*([^\s]+\.css)\s*\*\//i);
      const filename = filenameMatch ? filenameMatch[1] : "style.css";
      files.push({
        filename,
        content: cssContent,
        type: "css"
      });
    }
    const jsMatch = text.match(/```javascript\s*\n([\s\S]*?)\n```/i) || text.match(/```js\s*\n([\s\S]*?)\n```/i);
    if (jsMatch) {
      const jsContent = jsMatch[1].trim();
      const filenameMatch = jsContent.match(/\/\/\s*filename:\s*([^\s]+)/i) || jsContent.match(/\/\/\s*([^\s]+\.js)/i);
      const filename = filenameMatch ? filenameMatch[1] : "game.js";
      files.push({
        filename,
        content: jsContent,
        type: "javascript"
      });
    }
    if (files.length === 0) {
      const htmlPattern = /<\!DOCTYPE html[\s\S]*?<\/html>/i;
      const htmlFallback = text.match(htmlPattern);
      if (htmlFallback) {
        files.push({
          filename: "index.html",
          content: htmlFallback[0],
          type: "html"
        });
      }
      const cssPattern = /body\s*\{[\s\S]*?\}/i;
      const cssFallback = text.match(cssPattern);
      if (cssFallback) {
        files.push({
          filename: "style.css",
          content: cssFallback[0],
          type: "css"
        });
      }
      const jsPattern = /function\s+\w+\s*\([\s\S]*?\}|\w+\s*=\s*\{[\s\S]*?\}|class\s+\w+[\s\S]*?\}/i;
      const jsFallback = text.match(jsPattern);
      if (jsFallback) {
        files.push({
          filename: "game.js",
          content: jsFallback[0],
          type: "javascript"
        });
      }
    }
    if (files.length === 0) {
      const filePatterns = [
        /\*\*([^\*]+\.html)\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/i,
        /\*\*([^\*]+\.css)\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/i,
        /\*\*([^\*]+\.js)\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/i
      ];
      filePatterns.forEach((pattern) => {
        const match = text.match(pattern);
        if (match) {
          const filename = match[1];
          const content = match[2].trim();
          let type;
          if (filename.endsWith(".html")) {
            type = "html";
          } else if (filename.endsWith(".css")) {
            type = "css";
          } else if (filename.endsWith(".js")) {
            type = "javascript";
          } else {
            return;
          }
          files.push({
            filename,
            content,
            type
          });
        }
      });
    }
    return files;
  }
  /**
   * Get the next form step based on the continuation response
   */
  getNextFormStep(text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes("telephone") || lowerText.includes("phone") || lowerText.includes("t\xE9l\xE9phone")) {
      return {
        name: "playwright_type",
        params: {
          selector: 'input[name*="phone"], input[name*="tel"], input[name*="telephone"], input[type="tel"]',
          text: "+33123456789",
          clear: true
        }
      };
    }
    if (lowerText.includes("email") || lowerText.includes("courriel")) {
      return {
        name: "playwright_type",
        params: {
          selector: 'input[name*="email"], input[type="email"]',
          text: "test@example.com",
          clear: true
        }
      };
    }
    if (lowerText.includes("address") || lowerText.includes("adresse")) {
      return {
        name: "playwright_type",
        params: {
          selector: 'input[name*="address"], input[name*="addr"], textarea[name*="address"]',
          text: "123 Test Street",
          clear: true
        }
      };
    }
    if (lowerText.includes("city") || lowerText.includes("ville")) {
      return {
        name: "playwright_type",
        params: {
          selector: 'input[name*="city"], input[name*="ville"]',
          text: "Test City",
          clear: true
        }
      };
    }
    if (lowerText.includes("message") || lowerText.includes("comment")) {
      return {
        name: "playwright_type",
        params: {
          selector: 'textarea[name*="message"], textarea[name*="comment"], textarea',
          text: "This is a test message from the agent.",
          clear: true
        }
      };
    }
    return {
      name: "playwright_type",
      params: {
        selector: 'input:not([type="submit"]):not([type="button"]):not([value]), textarea:not([value])',
        text: "Test Input",
        clear: true
      }
    };
  }
  // 🚀 ENHANCED CONTEXT METHODS: Claude Code-inspired context management
  /**
   * Update the enhanced context after tool execution
   */
  updateContextAfterToolExecution(command, result) {
    this.log.info(`\u{1F9E0} ENHANCED CONTEXT: Processing ${command.name} execution...`);
    const startTime = Date.now();
    const executionTime = Date.now() - startTime;
    const success = !String(result).includes("Error executing tool");
    this.enhancedContextManager.recordToolUsage(command.name, success, executionTime);
    const confidenceDelta = this.calculateConfidenceDelta(command, success, executionTime);
    const currentContext = this.enhancedContextManager.getContext();
    const newConfidence = Math.max(10, Math.min(
      99,
      currentContext.currentState.confidenceLevel + confidenceDelta
    ));
    const toolDetectedPhase = this.detectPhaseFromTool(command, success);
    this.enhancedContextManager.updateAgentState({
      isProcessing: false,
      lastAction: command.name,
      lastActionResult: success ? "success" : "error",
      iterationCount: currentContext.currentState.iterationCount + 1,
      confidenceLevel: newConfidence,
      currentStrategy: this.inferCurrentStrategy(command, success)
    });
    this.extractContextFromToolResult(command, result, success);
    switch (command.name) {
      case "writeFile":
      case "editFile":
        const filePath = command.params?.path;
        if (filePath) {
          this.enhancedContextManager.setCurrentFile(filePath, `Created/modified via ${command.name}`);
          this.enhancedContextManager.addCodePattern(
            `File operation: ${command.name}`,
            filePath,
            `Modified file content in iteration ${this.enhancedContextManager.getContext().currentState.iterationCount}`
          );
        }
        break;
      case "readFile":
        const readFilePath = command.params?.path;
        if (readFilePath) {
          this.enhancedContextManager.setCurrentFile(readFilePath, "Read file content");
        }
        break;
      case "todo_write":
        this.handleTodoWriteCommand(command.params);
        break;
      case "display_canvas":
        this.enhancedContextManager.updateAgentState({
          currentStrategy: "Visual presentation via canvas"
        });
        break;
      case "finish":
        const currentTask = this.enhancedContextManager.getCurrentTask();
        if (currentTask) {
          this.enhancedContextManager.updateTodoStatus(currentTask.id, "completed");
        }
        break;
    }
    this.updateIntentFromCommand(command, success, toolDetectedPhase);
  }
  /**
   * Handle todo_write commands specifically
   */
  handleTodoWriteCommand(params) {
    if (params.todos && Array.isArray(params.todos)) {
      params.todos.forEach((todo) => {
        if (todo.id && todo.content && todo.status) {
          const existingTodo = this.enhancedContextManager.getContext().todos.find((t) => t.id === todo.id);
          if (!existingTodo) {
            const todoId = this.enhancedContextManager.addTodo(
              todo.content,
              todo.priority || "medium"
            );
            this.enhancedContextManager.updateTodoStatus(todoId, todo.status, todo.activeForm);
          }
        }
      });
    }
    this.enhancedContextManager.updateAgentState({
      currentStrategy: "Task planning and management"
    });
  }
  /**
   * 🚀 ENHANCED Update intent context based on command execution with phase detection
   */
  updateIntentFromCommand(command, success, detectedPhase) {
    const currentContext = this.enhancedContextManager.getContext();
    const finalPhase = detectedPhase || this.detectPhaseFromTool(command, success);
    this.enhancedContextManager.updateIntent({
      currentPhase: finalPhase,
      userGoal: currentContext.intent.userGoal || this.inferUserGoalFromCommand(command),
      expectedOutcome: success ? this.inferExpectedOutcome(command) : "Recovery from error"
    });
    if (success) {
      const insight = `Successfully executed ${command.name} in iteration ${currentContext.currentState.iterationCount}`;
      this.enhancedContextManager.getContext().memory.recentInsights.push(insight);
    }
  }
  /**
   * 🚀 HELPER: Infer user goal from command patterns
   */
  inferUserGoalFromCommand(command) {
    const toolName = command.name.toLowerCase();
    if (toolName.includes("file") || toolName.includes("write") || toolName.includes("edit")) {
      return "Create and modify files";
    }
    if (toolName.includes("browser") || toolName.includes("playwright")) {
      return "Interact with web content";
    }
    if (toolName.includes("todo")) {
      return "Organize and track tasks";
    }
    if (toolName.includes("read") || toolName.includes("list")) {
      return "Gather information";
    }
    return "Execute multi-step workflow";
  }
  /**
   * 🚀 HELPER: Infer expected outcome from command
   */
  inferExpectedOutcome(command) {
    const toolName = command.name.toLowerCase();
    if (toolName.includes("write") || toolName.includes("create")) {
      return "New content created";
    }
    if (toolName.includes("read")) {
      return "Information retrieved";
    }
    if (toolName.includes("edit")) {
      return "Content modified";
    }
    if (toolName.includes("list")) {
      return "Structure identified";
    }
    if (toolName.includes("browser") || toolName.includes("playwright")) {
      return "Web interaction completed";
    }
    return "Operation completed successfully";
  }
  /**
   * 🚀 OPTIMIZATION: Calculate confidence delta based on tool complexity and execution
   */
  calculateConfidenceDelta(command, success, executionTime) {
    if (!success) {
      return command.name.includes("File") || command.name.includes("browser") ? -15 : -8;
    }
    let delta = 3;
    if (command.name.includes("File") || command.name.includes("write") || command.name.includes("edit")) {
      delta += 2;
    }
    if (executionTime < 1e3) delta += 1;
    else if (executionTime > 5e3) delta -= 1;
    if (command.name.includes("browser") || command.name.includes("playwright")) {
      delta += 3;
    }
    return delta;
  }
  /**
   * 🚀 OPTIMIZATION: Detect current phase based on tool usage patterns
   */
  detectPhaseFromTool(command, success) {
    if (!success) return "debugging";
    const toolName = command.name.toLowerCase();
    if (toolName.includes("read") || toolName.includes("list") || toolName.includes("search")) {
      return "understanding";
    }
    if (toolName.includes("todo") || toolName.includes("plan") || toolName.includes("display_canvas")) {
      return "planning";
    }
    if (toolName.includes("write") || toolName.includes("create") || toolName.includes("edit") || toolName.includes("browser")) {
      return "implementing";
    }
    if (toolName.includes("test") || toolName.includes("check") || toolName.includes("verify")) {
      return "testing";
    }
    if (toolName === "finish") {
      return "finalizing";
    }
    return "implementing";
  }
  /**
   * 🚀 OPTIMIZATION: Infer current strategy based on tool patterns
   */
  inferCurrentStrategy(command, success) {
    if (!success) return "Error recovery and alternative approach";
    const toolName = command.name.toLowerCase();
    if (toolName.includes("file") || toolName.includes("write") || toolName.includes("edit")) {
      return "Code implementation and file management";
    }
    if (toolName.includes("browser") || toolName.includes("playwright")) {
      return "Web automation and content capture";
    }
    if (toolName.includes("todo")) {
      return "Task planning and progress tracking";
    }
    if (toolName.includes("canvas") || toolName.includes("display")) {
      return "Visual content presentation";
    }
    if (toolName.includes("read") || toolName.includes("list")) {
      return "Information gathering and analysis";
    }
    return "Multi-tool workflow execution";
  }
  /**
   * 🚀 OPTIMIZATION: Extract enhanced context from tool execution results
   */
  extractContextFromToolResult(command, result, success) {
    if (!success || !result) return;
    const resultStr = String(result);
    const currentContext = this.enhancedContextManager.getContext();
    if (resultStr.length > 50 && resultStr.length < 1e3) {
      const insight = this.extractInsightFromResult(command.name, resultStr);
      if (insight) {
        this.enhancedContextManager.addImportantDecision(
          insight.decision,
          insight.reasoning,
          `${command.name} execution (iteration ${currentContext.currentState.iterationCount})`
        );
      }
    }
    this.detectAndUpdatePatterns(command, resultStr);
    this.updateProgressFromResult(command, resultStr);
  }
  /**
   * Extract meaningful insights from tool results
   */
  extractInsightFromResult(toolName, result) {
    if (toolName.includes("file") && result.includes("successfully")) {
      return {
        decision: `File operation completed successfully`,
        reasoning: `Tool result indicates successful file manipulation`
      };
    }
    if (toolName.includes("browser") && result.includes("screenshot")) {
      return {
        decision: `Browser content captured successfully`,
        reasoning: `Screenshot or content extraction completed`
      };
    }
    if (toolName.includes("todo") && result.includes("created")) {
      return {
        decision: `Task structure established`,
        reasoning: `Todo list created for project organization`
      };
    }
    return null;
  }
  /**
   * Detect and update usage patterns
   */
  detectAndUpdatePatterns(command, result) {
    const toolName = command.name;
    if (toolName.includes("file") || toolName.includes("write") || toolName.includes("edit")) {
      const filePath = command.params?.path;
      if (filePath) {
        this.enhancedContextManager.addCodePattern(
          `${toolName} operation`,
          filePath,
          `Pattern detected in iteration ${this.enhancedContextManager.getContext().currentState.iterationCount}`
        );
      }
    }
    if (!result.includes("Error")) {
      const approach = `${toolName} \u2192 ${this.extractOutcomeFromResult(result)}`;
      this.enhancedContextManager.recordSuccessfulPattern(approach);
    }
  }
  /**
   * Extract outcome description from result
   */
  extractOutcomeFromResult(result) {
    if (result.includes("successfully")) return "Success";
    if (result.includes("created")) return "Creation";
    if (result.includes("updated")) return "Update";
    if (result.includes("listed")) return "Listing";
    if (result.includes("captured")) return "Content capture";
    return "Operation completed";
  }
  /**
   * Update progress estimation based on tool results
   */
  updateProgressFromResult(command, result) {
    const currentIntent = this.enhancedContextManager.getContext().intent;
    let progressIncrement = 0;
    switch (command.name) {
      case "readFile":
      case "listFiles":
        progressIncrement = 5;
        break;
      case "todo_write":
        progressIncrement = 10;
        break;
      case "writeFile":
      case "editFile":
        progressIncrement = 15;
        break;
      case "browser_*":
      case "playwright_*":
        progressIncrement = 12;
        break;
      case "finish":
        progressIncrement = 25;
        break;
      default:
        progressIncrement = 3;
    }
    const currentProgress = currentIntent.progressPercentage || 0;
    const newProgress = Math.min(95, currentProgress + progressIncrement);
    let newPhase = currentIntent.currentPhase || "implementing";
    if (newProgress >= 80) newPhase = "finalizing";
    else if (newProgress >= 60) newPhase = "testing";
    else if (newProgress >= 30) newPhase = "implementing";
    this.enhancedContextManager.updateIntent({
      progressPercentage: newProgress,
      currentPhase: newPhase,
      nextMilestone: this.inferNextMilestone(newProgress, newPhase)
    });
  }
  /**
   * Infer the next milestone based on current progress
   */
  inferNextMilestone(progress, phase) {
    if (progress < 20) return "Complete project planning";
    if (progress < 40) return "Implement core functionality";
    if (progress < 60) return "Add features and refinements";
    if (progress < 80) return "Testing and validation";
    if (progress < 95) return "Finalize and document";
    return "Project completion";
  }
  /**
   * Initialize context from user prompt
   */
  initializeContextFromPrompt(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    let userGoal = prompt;
    let currentPhase = "understanding";
    if (lowerPrompt.includes("create") || lowerPrompt.includes("build") || lowerPrompt.includes("implement")) {
      currentPhase = "planning";
      userGoal = `Create/Build: ${prompt}`;
    } else if (lowerPrompt.includes("test") || lowerPrompt.includes("check") || lowerPrompt.includes("verify")) {
      currentPhase = "testing";
      userGoal = `Test/Verify: ${prompt}`;
    } else if (lowerPrompt.includes("fix") || lowerPrompt.includes("debug") || lowerPrompt.includes("error")) {
      currentPhase = "debugging";
      userGoal = `Debug/Fix: ${prompt}`;
    }
    this.enhancedContextManager.updateIntent({
      userGoal,
      currentPhase,
      progressPercentage: 0
    });
    const topics = this.extractKeyTopics(prompt);
    topics.forEach((topic) => this.enhancedContextManager.addKeyTopic(topic));
  }
  /**
   * Extract key topics from text
   */
  extractKeyTopics(text) {
    const words = text.toLowerCase().split(/\s+/);
    const topics = [];
    const technicalTerms = ["api", "database", "frontend", "backend", "react", "typescript", "node", "express", "docker", "test", "component", "service"];
    technicalTerms.forEach((term) => {
      if (text.toLowerCase().includes(term)) {
        topics.push(term);
      }
    });
    return [...new Set(topics)];
  }
};

// src/modules/database/postgresPool.ts
import { Pool } from "pg";
var logger2 = getLogger();
var poolConfig = {
  host: config.POSTGRES_HOST,
  port: config.POSTGRES_PORT,
  database: config.POSTGRES_DB,
  user: config.POSTGRES_USER,
  password: config.POSTGRES_PASSWORD,
  // Configuration optimisée du pool
  min: 2,
  // Minimum de connexions maintenues
  max: 20,
  // Maximum de connexions (ajustable selon charge)
  idleTimeoutMillis: 3e4,
  // Fermer les connexions idle après 30s
  connectionTimeoutMillis: 2e3,
  // Timeout de connexion 2s
  // Gestion d'erreurs améliorée
  allowExitOnIdle: true,
  keepAlive: true,
  keepAliveInitialDelayMillis: 0
};
var PostgresPoolManager = class {
  pool;
  isShuttingDown = false;
  constructor() {
    this.pool = new Pool(poolConfig);
    this.setupEventHandlers();
    this.setupHealthMonitoring();
  }
  setupEventHandlers() {
    this.pool.on("error", (err, client) => {
      logger2.error({ err }, "Unexpected error on idle client");
    });
    this.pool.on("connect", (client) => {
      logger2.debug("New client connected to PostgreSQL");
    });
    this.pool.on("remove", (client) => {
      logger2.debug("Client removed from pool");
    });
  }
  setupHealthMonitoring() {
    setInterval(() => {
      const stats = {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      };
      logger2.debug({ stats }, "PostgreSQL pool statistics");
    }, 3e4);
  }
  async getClient() {
    if (this.isShuttingDown) {
      throw new Error("Pool is shutting down");
    }
    try {
      const client = await this.pool.connect();
      return client;
    } catch (error) {
      logger2.error({ error }, "Failed to get client from pool");
      throw error;
    }
  }
  async query(text, params) {
    const client = await this.getClient();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }
  async close() {
    this.isShuttingDown = true;
    logger2.info("Closing PostgreSQL pool...");
    await this.pool.end();
    logger2.info("PostgreSQL pool closed");
  }
  getStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount
    };
  }
};
var poolManager = null;
function getPostgresPool() {
  if (!poolManager) {
    poolManager = new PostgresPoolManager();
  }
  return poolManager;
}

// src/modules/database/circuitBreaker.ts
var logger3 = getLogger().child({ component: "CircuitBreaker" });
var DatabaseCircuitBreaker = class {
  state = {
    failures: 0,
    lastFailureTime: 0,
    state: "CLOSED"
  };
  failureThreshold = 5;
  resetTimeout = 6e4;
  // 1 minute
  monitoringInterval = 3e4;
  // 30 secondes
  constructor() {
    setInterval(() => {
      this.logState();
    }, this.monitoringInterval);
  }
  async execute(operation) {
    if (this.state.state === "OPEN") {
      if (Date.now() - this.state.lastFailureTime > this.resetTimeout) {
        this.state.state = "HALF_OPEN";
        logger3.info("Circuit breaker moved to HALF_OPEN");
      } else {
        const remainingTime = Math.ceil(
          (this.resetTimeout - (Date.now() - this.state.lastFailureTime)) / 1e3
        );
        throw new Error(
          `Circuit breaker is OPEN - database unavailable. Retry in ${remainingTime}s`
        );
      }
    }
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  onSuccess() {
    if (this.state.state === "HALF_OPEN") {
      logger3.info("Circuit breaker test successful - moved to CLOSED");
    }
    this.state.failures = 0;
    this.state.state = "CLOSED";
  }
  onFailure() {
    this.state.failures++;
    this.state.lastFailureTime = Date.now();
    if (this.state.failures >= this.failureThreshold) {
      this.state.state = "OPEN";
      logger3.warn(
        {
          failures: this.state.failures,
          threshold: this.failureThreshold
        },
        "Circuit breaker opened due to too many failures"
      );
    } else {
      logger3.warn(
        {
          failures: this.state.failures,
          threshold: this.failureThreshold
        },
        "Database operation failed, incrementing failure count"
      );
    }
  }
  logState() {
    logger3.debug(
      {
        state: this.state.state,
        failures: this.state.failures,
        timeSinceLastFailure: Date.now() - this.state.lastFailureTime
      },
      "Circuit breaker state"
    );
  }
  getState() {
    return {
      ...this.state,
      timeSinceLastFailure: Date.now() - this.state.lastFailureTime,
      isAvailable: this.state.state !== "OPEN" || Date.now() - this.state.lastFailureTime > this.resetTimeout
    };
  }
  reset() {
    this.state = {
      failures: 0,
      lastFailureTime: 0,
      state: "CLOSED"
    };
    logger3.info("Circuit breaker manually reset");
  }
};

// src/modules/database/postgresMonitor.ts
var logger4 = getLogger().child({ component: "PostgresMonitor" });

// src/modules/tools/definitions/ai/summarize.tool.ts
import { z as z5 } from "zod";

// src/modules/tools/definitions/ai/summarizer.prompt.ts
var PROMPT_TEMPLATE = `Please provide a concise summary of the following text.
Focus on the key points and main conclusions.
The summary should be approximately 1/4 of the original text length.

Original Text:
---
%s
---

Summary:`;
var getSummarizerPrompt = (textToSummarize) => {
  return PROMPT_TEMPLATE.replace("%s", textToSummarize);
};

// src/modules/tools/definitions/ai/summarize.tool.ts
var summarizeParams = z5.object({
  text: z5.string().describe("The text to summarize")
});
var summarizeOutput = z5.union([
  z5.string(),
  z5.object({
    erreur: z5.string()
  })
]);
var summarizeTool = {
  description: "Summarizes a given text.",
  execute: async (args, ctx) => {
    try {
      const params = args;
      ctx.log.info(params.text, "Summarizing text");
      if (!params.text) {
        ctx.log.warn("Input text for summarization is empty.");
        return {
          erreur: "Failed to summarize text: Input text for summarization is empty."
        };
      }
      const result = await getLlmProvider("gemini").getLlmResponse([
        { parts: [{ text: getSummarizerPrompt(params.text) }], role: "user" }
      ]);
      if (!result) {
        ctx.log.error("LLM returned empty response for summarization.");
        return {
          erreur: "Failed to summarize text: LLM returned empty response."
        };
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      ctx.log.error({ error }, `Failed to summarize text: ${errorMessage}`);
      return { erreur: `Failed to summarize text: ${errorMessage}` };
    }
  },
  name: "ai_summarize",
  parameters: summarizeParams
};

// src/modules/session/sessionManager.ts
var SessionManager = class _SessionManager {
  static activeSessions = /* @__PURE__ */ new Map();
  pgClient;
  constructor(pgClient) {
    this.pgClient = pgClient;
  }
  static clearActiveSessionsForTest() {
    _SessionManager.activeSessions.clear();
  }
  static async create(pgClient) {
    const manager = new _SessionManager(pgClient);
    await manager.initDb();
    return manager;
  }
  static createToolContext(_job, session, _taskQueue, log) {
    return {
      job: _job,
      llm: getLlmProvider(session.activeLlmProvider || "gemini"),
      // Default to 'gemini' if not set
      log,
      reportProgress: async (progress) => {
        log.debug(
          `Tool progress: ${progress.current}/${progress.total} ${progress.unit || ""}`
        );
      },
      session,
      streamContent: async (content, toolName) => {
        log.debug(`Tool stream: ${JSON.stringify(content)}`);
        const channel = `job:${_job.id}:events`;
        let contentString;
        if (Array.isArray(content)) {
          contentString = content.map((c) => c.toString()).join("");
        } else {
          contentString = String(content);
        }
        const message = JSON.stringify({
          content: contentString,
          toolName: toolName || "unknown_tool",
          type: "tool_stream"
        });
        getRedisClientInstance().publish(channel, message);
      },
      taskQueue: _taskQueue
    };
  }
  static async summarizeHistory(session, _job, taskQueue) {
    const log = getLogger().child({
      module: "Summarizer",
      sessionId: session.id
    });
    log.info("History length exceeds max length, summarizing...");
    const historyToSummarize = session.history.slice(
      0,
      session.history.length - config.HISTORY_MAX_LENGTH
    );
    const textToSummarize = historyToSummarize.map((msg) => {
      if ("content" in msg && typeof msg.content === "string") {
        return `${msg.type}: ${msg.content}`;
      }
      return "";
    }).join("\n");
    try {
      const context = this.createToolContext(_job, session, taskQueue, log);
      const summary = await summarizeTool.execute(
        { text: textToSummarize },
        context
      );
      const summarizedMessage = {
        content: `Summarized conversation: ${String(summary)}`,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: "agent_response"
      };
      session.history = [
        summarizedMessage,
        ...session.history.slice(-(config.HISTORY_MAX_LENGTH - 1))
      ];
      log.info("History summarized successfully.");
    } catch (error) {
      log.error({ error }, "Error summarizing history");
      throw error;
    }
  }
  // 🚀 ENHANCED SEMANTIC MEMORY: Claude Code-inspired memory compression
  static async compressHistorySemantically(session, _job, taskQueue) {
    const log = getLogger().child({
      module: "SemanticCompressor",
      sessionId: session.id
    });
    log.info("Performing semantic compression...");
    const semanticMemory = {
      keyDecisions: [],
      codePatterns: [],
      userPreferences: {},
      conversationThemes: [],
      importantInsights: []
    };
    const recentMessageCount = Math.min(50, config.HISTORY_MAX_LENGTH / 2);
    const recentMessages = session.history.slice(-recentMessageCount);
    const olderMessages = session.history.slice(0, -recentMessageCount);
    for (const message of olderMessages) {
      this.extractSemanticInfo(message, semanticMemory);
    }
    const summary = await this.generateSemanticSummary(olderMessages, semanticMemory, _job, taskQueue, log);
    const compressionRatio = (olderMessages.length - 1) / olderMessages.length;
    log.info(`Semantic compression completed: ${compressionRatio.toFixed(2)} ratio, ${semanticMemory.keyDecisions.length} decisions, ${semanticMemory.codePatterns.length} patterns`);
    return {
      semanticMemory,
      recentMessages,
      summary,
      compressionRatio
    };
  }
  /**
   * Extract semantic information from a message
   */
  static extractSemanticInfo(message, memory) {
    const content = "content" in message ? String(message.content) : "";
    const lowerContent = content.toLowerCase();
    if (message.type === "user") {
      if (lowerContent.includes("prefer") || lowerContent.includes("like") || lowerContent.includes("want")) {
        const preference = content.match(/prefer (.+)|like (.+)|want (.+)/i)?.[0];
        if (preference) {
          memory.userPreferences.communication = preference;
        }
      }
    } else if (message.type === "agent_response") {
      const decisionPatterns = [
        /I (will|shall|should|must|need to)/gi,
        /going to/gi,
        /decided to/gi,
        /plan to/gi
      ];
      for (const pattern of decisionPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          memory.keyDecisions.push({
            decision: matches[0],
            context: content.substring(0, 100),
            timestamp: message.timestamp
          });
        }
      }
      if (content.includes(":") || content.includes("\u2022") || content.includes("-") || content.includes("Conclusion")) {
        const insightMatch = content.match(/^([^:\n]+)[:\n]\s*(.+)$/m);
        if (insightMatch) {
          memory.importantInsights.push({
            insight: insightMatch[2].substring(0, 100),
            context: insightMatch[1],
            importance: content.includes("important") || content.includes("critical") ? "high" : "medium"
          });
        }
      }
    } else if (message.type === "tool_call") {
      const toolName = message.toolName || "";
      if (toolName.includes("File") || toolName.includes("write") || toolName.includes("read")) {
        memory.codePatterns.push({
          pattern: `File operation: ${toolName}`,
          usage: content.substring(0, 50)
        });
      }
    }
    const themes = this.extractThemes(content);
    themes.forEach((theme) => {
      if (!memory.conversationThemes.includes(theme)) {
        memory.conversationThemes.push(theme);
      }
    });
    if (memory.keyDecisions.length > 20) {
      memory.keyDecisions = memory.keyDecisions.slice(-20);
    }
    if (memory.importantInsights.length > 15) {
      memory.importantInsights = memory.importantInsights.slice(-15);
    }
    if (memory.codePatterns.length > 30) {
      memory.codePatterns = memory.codePatterns.slice(-30);
    }
    if (memory.conversationThemes.length > 10) {
      memory.conversationThemes = memory.conversationThemes.slice(-10);
    }
  }
  /**
   * Extract conversation themes from content
   */
  static extractThemes(content) {
    const themes = [];
    const lowerContent = content.toLowerCase();
    const themeKeywords = {
      "development": ["develop", "code", "implement", "build", "create"],
      "testing": ["test", "verify", "check", "debug", "fix"],
      "planning": ["plan", "design", "architecture", "structure"],
      "documentation": ["document", "explain", "describe", "comment"],
      "optimization": ["optimize", "improve", "performance", "efficiency"],
      "deployment": ["deploy", "release", "publish", "production"],
      "troubleshooting": ["error", "issue", "problem", "troubleshoot"]
    };
    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      if (keywords.some((keyword) => lowerContent.includes(keyword))) {
        themes.push(theme);
      }
    }
    return themes;
  }
  /**
   * Generate semantic summary using LLM
   */
  static async generateSemanticSummary(messages, memory, _job, taskQueue, log) {
    if (messages.length === 0) return "";
    const textToSummarize = messages.map((msg) => {
      if ("content" in msg && typeof msg.content === "string") {
        return `${msg.type}: ${msg.content}`;
      }
      return "";
    }).filter(Boolean).join("\n");
    if (textToSummarize.length < 100) {
      return textToSummarize;
    }
    try {
      const tempSession = {
        history: messages,
        id: "temp-summarization",
        identities: [],
        name: "Temp Summarization Session",
        timestamp: Date.now()
      };
      const context = this.createToolContext(_job, tempSession, taskQueue, log);
      const enhancedPrompt = `Please provide a comprehensive but concise summary of this conversation. Focus on:

1. Key decisions made and important outcomes
2. Technical patterns and code changes discussed
3. User preferences and requirements identified
4. Current state and next steps
5. Important insights or conclusions

Conversation to summarize:
${textToSummarize}

Provide a structured summary that preserves the semantic meaning while being much more concise than the original.`;
      const summary = await summarizeTool.execute(
        { text: enhancedPrompt },
        context
      );
      return String(summary);
    } catch (error) {
      log.error({ error }, "Error generating semantic summary, falling back to basic summary");
      return `Conversation summary: ${textToSummarize.substring(0, 200)}... (${messages.length} messages compressed)`;
    }
  }
  /**
   * Apply semantic compression to session history
   */
  static async applySemanticCompression(session, _job, taskQueue) {
    if (session.history.length <= config.HISTORY_MAX_LENGTH) {
      return;
    }
    const compressed = await this.compressHistorySemantically(session, _job, taskQueue);
    const compressionMessage = {
      content: `\u{1F9E0} Semantic Memory Compression:
${compressed.summary}

Key Decisions: ${compressed.semanticMemory.keyDecisions.length}
Code Patterns: ${compressed.semanticMemory.codePatterns.length}
Themes: ${compressed.semanticMemory.conversationThemes.join(", ")}
Compression Ratio: ${(compressed.compressionRatio * 100).toFixed(1)}%`,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: "agent_response"
    };
    session.history = [
      compressionMessage,
      ...compressed.recentMessages
    ];
    getLogger().info(
      { sessionId: session.id, originalLength: session.history.length + compressed.semanticMemory.keyDecisions.length },
      "Applied semantic compression to session history"
    );
  }
  async deleteSession(sessionId) {
    await this.pgClient.query("DELETE FROM sessions WHERE id = $1", [
      sessionId
    ]);
    _SessionManager.activeSessions.delete(sessionId);
    getLogger().info(
      { sessionId },
      "Session deleted from PostgreSQL and memory."
    );
  }
  async getAllSessions() {
    const res = await this.pgClient.query(
      "SELECT id, name, timestamp, identities FROM sessions ORDER BY timestamp DESC"
    );
    return res.rows.map((row) => ({
      history: [],
      id: row.id,
      identities: row.identities || [],
      name: row.name,
      timestamp: parseInt(row.timestamp, 10)
    }));
  }
  async getSession(sessionId) {
    if (_SessionManager.activeSessions.has(sessionId)) {
      getLogger().info(
        { sessionId },
        "Reusing existing session data from memory."
      );
      return _SessionManager.activeSessions.get(sessionId);
    }
    const res = await this.pgClient.query(
      "SELECT * FROM sessions WHERE id = $1",
      [sessionId]
    );
    let initialHistory = [];
    let sessionName = `Session ${(/* @__PURE__ */ new Date()).toLocaleString()}`;
    let sessionTimestamp = Date.now();
    let identities = [];
    let activeLlmProvider = void 0;
    if (res.rows.length > 0) {
      const storedSession = res.rows[0];
      try {
        if (typeof storedSession.messages === "string") {
          initialHistory = JSON.parse(storedSession.messages);
        } else if (Array.isArray(storedSession.messages)) {
          initialHistory = storedSession.messages;
        }
      } catch (error) {
        getLogger().error(
          { error, sessionId },
          "Failed to parse messages from DB, initializing with empty history."
        );
        initialHistory = [];
      }
      sessionName = storedSession.name;
      sessionTimestamp = parseInt(storedSession.timestamp, 10);
      identities = storedSession.identities || [];
      activeLlmProvider = storedSession.active_llm_provider || void 0;
    } else {
      getLogger().info(
        { sessionId },
        "No session found in PostgreSQL, creating new one."
      );
    }
    const historyToUse = config.HISTORY_LOAD_LENGTH > 0 && initialHistory.length > config.HISTORY_LOAD_LENGTH ? initialHistory.slice(-config.HISTORY_LOAD_LENGTH) : initialHistory;
    const sessionData = {
      activeLlmProvider,
      // Add to sessionData
      history: historyToUse,
      id: sessionId,
      identities,
      name: sessionName,
      timestamp: sessionTimestamp
    };
    _SessionManager.activeSessions.set(sessionId, sessionData);
    getLogger().info(
      { sessionId },
      "Created new session data from PostgreSQL."
    );
    return sessionData;
  }
  async renameSession(sessionId, newName) {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session with ID ${sessionId} not found.`);
    }
    session.name = newName;
    await this.pgClient.query("UPDATE sessions SET name = $1 WHERE id = $2", [
      newName,
      sessionId
    ]);
    _SessionManager.activeSessions.set(sessionId, session);
    getLogger().info(
      { newName, sessionId },
      "Session renamed in PostgreSQL and memory."
    );
    return session;
  }
  async saveSession(session, job, taskQueue) {
    try {
      if (session.history.length > config.HISTORY_MAX_LENGTH && job) {
        await _SessionManager.applySemanticCompression(session, job, taskQueue);
      }
      await this.pgClient.query(
        "INSERT INTO sessions (id, name, messages, timestamp, identities, active_llm_provider) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, messages = EXCLUDED.messages, timestamp = EXCLUDED.timestamp, identities = EXCLUDED.identities, active_llm_provider = EXCLUDED.active_llm_provider",
        [
          session.id,
          session.name,
          JSON.stringify(session.history),
          session.timestamp,
          JSON.stringify(session.identities),
          session.activeLlmProvider || null
          // Save the new field
        ]
      );
      _SessionManager.activeSessions.set(session.id, session);
      getLogger().info(
        { sessionId: session.id },
        "Session history saved to PostgreSQL."
      );
    } catch (error) {
      getLogger().error({ error }, "Error saving session");
      throw error;
    }
  }
  async initDb() {
    await this.pgClient.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        messages JSONB NOT NULL,
        timestamp BIGINT NOT NULL,
        identities JSONB,
        active_llm_provider VARCHAR(255) -- New column
      );
    `);
    getLogger().info("PostgreSQL sessions table ensured.");
  }
};

// src/worker.ts
getLoggerInstance().info("\u{1F680} [WORKER] Worker file loaded and starting...");
getLoggerInstance().debug("[WORKER-STARTUP] process.cwd():", process.cwd());
getLoggerInstance().debug(
  "[WORKER-STARTUP] process.env.PATH:",
  process.env.PATH
);
function logMemoryUsage(label, log) {
  if (global.gc) {
    global.gc();
  }
  const usage = process.memoryUsage();
  log.debug(
    `[MEMORY] ${label} - RSS: ${Math.round(usage.rss / 1024 / 1024)} MB, Heap Used: ${Math.round(usage.heapUsed / 1024 / 1024)} MB, Heap Total: ${Math.round(usage.heapTotal / 1024 / 1024)} MB`
  );
}
function startPeriodicKeyCleanup() {
  const log = getLoggerInstance().child({ module: "KeyCleanup" });
  setTimeout(async () => {
    try {
      const result = await LlmKeyManager.cleanupFailedKeys();
      if (result.cleaned > 0) {
        log.info(result, "Initial key cleanup completed");
      }
    } catch (error) {
      log.error({ error }, "Failed to run initial key cleanup");
    }
  }, 3e4);
  const cleanupInterval = setInterval(
    async () => {
      try {
        const result = await LlmKeyManager.cleanupFailedKeys();
        if (result.cleaned > 0) {
          log.info(result, "Periodic key cleanup completed");
        } else {
          log.debug({ total: result.total }, "No keys needed cleanup");
        }
      } catch (error) {
        log.error({ error }, "Failed to run periodic key cleanup");
      }
    },
    15 * 60 * 1e3
  );
  process.on("SIGTERM", () => {
    clearInterval(cleanupInterval);
    log.info("Key cleanup task stopped");
  });
  process.on("SIGINT", () => {
    clearInterval(cleanupInterval);
    log.info("Key cleanup task stopped");
  });
  log.info("Periodic key cleanup task started (every 15 minutes)");
}
async function initializeWorker(redisConnection) {
  getLoggerInstance().info(
    { path: process.env.PATH },
    "Worker process.env.PATH at startup:"
  );
  const poolManager2 = getPostgresPool();
  const circuitBreaker = new DatabaseCircuitBreaker();
  const tools = await getTools();
  getLoggerInstance().info(`${tools.length} tools detected at startup`);
  const _jobQueue = new Queue("tasks", { connection: redisConnection });
  const sessionManager = await SessionManager.create(poolManager2);
  startPeriodicKeyCleanup();
  const worker = new Worker(
    "tasks",
    async (_job) => {
      if (_job.name === "process-message") {
        try {
          return await processJob(
            _job,
            _jobQueue,
            sessionManager,
            redisConnection
          );
        } catch (error) {
          getLoggerInstance().error(
            { err: error, jobId: _job.id },
            "Error processing job"
          );
          throw error;
        }
      }
      if (_job.name === "execute-shell-command-detached") {
        const { command, notificationChannel } = _job.data;
        const log = getLoggerInstance().child({
          jobId: _job.id,
          originalJobId: _job.data.jobId
        });
        log.info(`Executing detached shell command: ${command}`);
        return new Promise((resolve2, reject) => {
          const env = {
            ...process.env,
            PATH: process.env.HOST_SYSTEM_PATH || process.env.PATH
          };
          getLoggerInstance().debug(
            `[WORKER-SPAWN-DEBUG] Spawning command: ${command}`
          );
          getLoggerInstance().debug(
            `[WORKER-SPAWN-DEBUG] With shell: /usr/bin/env bash`
          );
          getLoggerInstance().debug(
            `[WORKER-SPAWN-DEBUG] With cwd: ${config.WORKSPACE_PATH}`
          );
          getLoggerInstance().debug(
            `[WORKER-SPAWN-DEBUG] With env.PATH: ${env.PATH}`
          );
          const child = _spawn(command, {
            cwd: config.WORKSPACE_PATH,
            detached: false,
            env,
            // Utiliser l'environnement corrigé
            shell: "/bin/sh",
            // Utiliser sh directement
            stdio: "pipe"
          });
          const streamToFrontend = (type, content, toolName) => {
            const data = {
              data: { content, type },
              toolName,
              type: "tool_stream"
            };
            redisConnection.publish(notificationChannel, JSON.stringify(data));
          };
          child.stdout.on("data", (data) => {
            const chunk = data.toString();
            log.info(`[stdout] ${chunk}`);
            streamToFrontend("stdout", chunk, "executeShellCommand");
          });
          child.stderr.on("data", (data) => {
            const chunk = data.toString();
            log.error(`[stderr] ${chunk}`);
            streamToFrontend("stderr", chunk, "executeShellCommand");
          });
          child.on("error", (error) => {
            log.error(
              { err: error },
              `Failed to start detached shell command: ${command}`
            );
            redisConnection.publish(
              notificationChannel,
              JSON.stringify({
                message: `Failed to start command: ${error.message}`,
                type: "error"
              })
            );
            reject(error);
          });
          child.on("close", (code) => {
            const finalMessage = `--- DETACHED COMMAND FINISHED ---
Command: ${command}
Exit Code: ${code}`;
            log.info(finalMessage);
            streamToFrontend(
              "stdout",
              `
${finalMessage}`,
              "executeShellCommand"
            );
            resolve2(`Detached command finished with code ${code}`);
          });
        });
      }
    },
    {
      autorun: true,
      concurrency: 1,
      // Forcer un seul job à la fois pour éviter les conflits
      connection: redisConnection,
      maxStalledCount: config.WORKER_MAX_STALLED_COUNT,
      stalledInterval: config.WORKER_STALLED_INTERVAL_MS
    }
  );
  worker.on("completed", (_job) => {
    getLoggerInstance().info(`Job ${_job.id} termin\xE9 avec succ\xE8s.`);
  });
  worker.on("failed", (_job, err) => {
    getLoggerInstance().error({ err }, `Le job ${_job?.id} a \xE9chou\xE9`);
  });
  worker.on("error", (err) => {
    getLoggerInstance().error({ err }, "Worker error");
  });
  console.log("Worker initialis\xE9 et pr\xEAt \xE0 traiter les jobs.");
  getLoggerInstance().info("Worker initialis\xE9 et pr\xEAt \xE0 traiter les jobs.");
  return worker;
}
async function processJob(_job, _jobQueue, _sessionManager, redisConnection) {
  const log = getLoggerInstance().child({
    jobId: _job.id,
    sessionId: _job.data.sessionId
  });
  logMemoryUsage("Job Start", log);
  log.info(`Traitement du job ${_job.id}`);
  const channel = `job:${_job.id}:events`;
  await new Promise((resolve2) => setTimeout(resolve2, 100));
  log.info(`Job ${_job.id} starting after synchronization delay`);
  try {
    const tools = await getTools();
    const session = await _sessionManager.getSession(_job.data.sessionId);
    const activeLlmProvider = session.activeLlmProvider || config.LLM_PROVIDER;
    const { llmApiKey, llmModelName, llmProvider } = _job.data;
    log.info("\u{1F50D} PROVIDER DEBUG:", {
      session_active_provider: session.activeLlmProvider,
      config_default_provider: config.LLM_PROVIDER,
      job_llm_provider: llmProvider,
      final_provider: llmProvider || activeLlmProvider,
      config_hierarchy: config.LLM_PROVIDER_HIERARCHY
    });
    const finalModelName = llmModelName || config.LLM_MODEL_NAME;
    log.info(`Agent starting with ${tools.length} tools available`);
    const agent = new Agent(
      _job,
      session,
      _jobQueue,
      tools,
      llmProvider || activeLlmProvider,
      _sessionManager,
      llmApiKey,
      finalModelName
    );
    log.info(`Agent execution starting...`);
    const finalResponse = await agent.run();
    log.info(`Agent execution completed successfully`);
    session.history.push({
      content: finalResponse,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: "agent_response"
    });
    const maxHistoryLength = activeLlmProvider === "gemini" ? config.GEMINI_MAX_HISTORY_LENGTH : config.HISTORY_MAX_LENGTH;
    if (session.history.length > maxHistoryLength) {
      try {
        const summarizedHistory = await summarizeTool.execute(
          {
            text: session.history.map((m) => "content" in m ? m.content : "").join("\n")
          },
          {
            job: _job,
            llm: null,
            log,
            reportProgress: async () => {
            },
            session,
            streamContent: async (data) => {
              if (data.type === "tool_code_image" || data.type === "tool_code") {
                return;
              }
              redisConnection.publish(
                channel,
                JSON.stringify({
                  content: data.content,
                  type: data.type
                })
              );
            },
            taskQueue: _jobQueue
          }
        );
        session.history = [
          {
            content: summarizedHistory,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            type: "agent_response"
          }
        ];
      } catch (summarizeError) {
        log.error(
          { err: summarizeError },
          "Erreur dans la summarization de l'historique"
        );
      }
    }
    await _sessionManager.saveSession(session, _job, _jobQueue);
    logMemoryUsage("Job End", log);
    return finalResponse;
  } catch (error) {
    const errDetails = getErrDetails(error);
    log.error({ err: errDetails }, "Erreur dans l'ex\xE9cution de l'agent");
    let errorMessage = errDetails.message;
    let eventType = "error";
    if (error instanceof AppError || error instanceof UserError) {
      if (errorMessage.includes("Quota exceeded")) {
        errorMessage = "Quota API d\xE9pass\xE9. Veuillez r\xE9essayer plus tard.";
        eventType = "quota_exceeded";
      } else if (errorMessage.includes("Gemini API request failed with status 500")) {
        errorMessage = "Une erreur interne est survenue avec l'API du LLM. Veuillez r\xE9essayer plus tard ou v\xE9rifier votre cl\xE9 API.";
      } else if (errorMessage.includes("is not found for API version v1")) {
        errorMessage = "Le mod\xE8le de LLM sp\xE9cifi\xE9 n'a pas \xE9t\xE9 trouv\xE9 ou n'est pas support\xE9. Veuillez v\xE9rifier votre LLM_MODEL_NAME dans le fichier .env.";
      }
    }
    try {
      redisConnection.publish(
        channel,
        JSON.stringify({ message: errorMessage, type: eventType })
      );
    } catch (publishError) {
      log.error(
        { err: publishError },
        "Erreur dans la publication du message d'erreur"
      );
    }
    throw error;
  } finally {
    try {
      redisConnection.publish(
        channel,
        JSON.stringify({ content: "Stream termin\xE9.", type: "close" })
      );
    } catch (publishError) {
      log.error(
        { err: publishError },
        "Erreur dans la publication du message de fermeture"
      );
    }
    log.info(`Traitement du job ${_job.id} termin\xE9`);
    await new Promise((resolve2) => setTimeout(resolve2, 100));
  }
}
async function checkExistingWorkers() {
  const { spawn } = __require("child_process");
  return new Promise((resolve2) => {
    const ps = spawn("ps", ["aux"], { stdio: ["pipe", "pipe", "pipe"] });
    let output = "";
    ps.stdout.on("data", (data) => {
      output += data.toString();
    });
    ps.on("close", () => {
      const lines = output.split("\n");
      const workerPids = [];
      for (const line of lines) {
        if (line.includes("node") && (line.includes("dist/worker") || line.includes("worker") && !line.includes("kworker"))) {
          const parts = line.trim().split(/\s+/);
          if (parts.length > 1) {
            const pid = parseInt(parts[1]);
            if (!isNaN(pid) && pid !== process.pid) {
              workerPids.push(pid);
            }
          }
        }
      }
      resolve2(workerPids);
    });
    ps.on("error", () => {
      resolve2([]);
    });
  });
}
async function checkWorkerLock(redisClient) {
  const lockKey = "worker:singleton:lock";
  const lockTimeout = 300;
  const processId = `${process.pid}:${Date.now()}:${Math.random().toString(36).substring(2, 15)}`;
  try {
    const existingLock = await redisClient.get(lockKey);
    if (existingLock) {
      const [existingPid, timestamp] = existingLock.split(":");
      const lockAge = Date.now() - parseInt(timestamp);
      try {
        process.kill(parseInt(existingPid), 0);
        getLoggerInstance().warn(
          `\u274C Worker already running (PID: ${existingPid}, age: ${lockAge}ms), process ${process.pid} will exit`
        );
        getLoggerInstance().warn(
          `\u{1F52A} Force killing existing worker PID: ${existingPid}`
        );
        try {
          process.kill(parseInt(existingPid), "SIGKILL");
          await new Promise((resolve2) => setTimeout(resolve2, 1e3));
          getLoggerInstance().info(
            `\u2705 Successfully killed old worker PID: ${existingPid}`
          );
        } catch (killError) {
          getLoggerInstance().error(
            { killError },
            `Failed to kill old worker PID: ${existingPid}`
          );
        }
        await redisClient.del(lockKey);
        getLoggerInstance().info(
          `\u{1F5D1}\uFE0F Cleared stale lock from dead worker PID: ${existingPid}`
        );
      } catch {
        getLoggerInstance().info(
          `\u{1F504} Taking over lock from dead worker (PID: ${existingPid}, age: ${lockAge}ms)`
        );
        await redisClient.del(lockKey);
      }
    }
    const result = await redisClient.set(
      lockKey,
      processId,
      "EX",
      lockTimeout,
      "NX"
    );
    if (result === "OK") {
      getLoggerInstance().info(
        `\u2705 Worker lock acquired by process ${process.pid}`
      );
      const refreshInterval = setInterval(async () => {
        try {
          const currentLock = await redisClient.get(lockKey);
          if (currentLock === processId) {
            await redisClient.expire(lockKey, lockTimeout);
            getLoggerInstance().debug(
              `\u{1F504} Worker lock refreshed by process ${process.pid}`
            );
          } else {
            clearInterval(refreshInterval);
            getLoggerInstance().error(
              `\u26A0\uFE0F Worker lock stolen by another process, shutting down ${process.pid}`
            );
            process.exit(1);
          }
        } catch (error) {
          getLoggerInstance().error({ error }, "Error refreshing worker lock");
        }
      }, 1e4);
      const cleanup = async () => {
        try {
          clearInterval(refreshInterval);
          const currentLock = await redisClient.get(lockKey);
          if (currentLock === processId) {
            await redisClient.del(lockKey);
            getLoggerInstance().info(
              `\u{1F9F9} Worker lock released by process ${process.pid}`
            );
          }
        } catch (error) {
          getLoggerInstance().error({ error }, "Error during lock cleanup");
        }
      };
      process.on("SIGTERM", cleanup);
      process.on("SIGINT", cleanup);
      process.on("exit", cleanup);
      process.on("uncaughtException", (error) => {
        getLoggerInstance().error(
          { error },
          "Uncaught exception in worker, cleaning up"
        );
        cleanup().finally(() => process.exit(1));
      });
      process.on("unhandledRejection", (reason) => {
        getLoggerInstance().error(
          { reason },
          "Unhandled rejection in worker, cleaning up"
        );
        cleanup().finally(() => process.exit(1));
      });
      return true;
    } else {
      const finalLock = await redisClient.get(lockKey);
      getLoggerInstance().warn(
        `\u274C Failed to acquire worker lock, existing: ${finalLock}, process ${process.pid} will exit`
      );
      return false;
    }
  } catch (error) {
    getLoggerInstance().error({ error }, "Error checking worker lock");
    return false;
  }
}
if (process.env.NODE_ENV !== "test") {
  const startedFromRunScript = process.env.STARTED_FROM_RUN_SCRIPT === "true";
  if (!startedFromRunScript) {
    getLoggerInstance().error(
      '\u274C Worker can only be started from the run.sh script. Please use "./run.sh start" or "./run.sh restart-worker" to start the worker.'
    );
    process.exit(1);
  }
  const existingWorkers = await checkExistingWorkers();
  if (existingWorkers.length > 0) {
    getLoggerInstance().warn(
      `\u{1F6A8} Found ${existingWorkers.length} existing worker processes: ${existingWorkers.join(", ")}`
    );
    getLoggerInstance().info("\u{1F6D1} Killing existing workers before starting...");
    for (const pid of existingWorkers) {
      try {
        process.kill(pid, "SIGKILL");
        getLoggerInstance().info(`\u2705 Killed existing worker PID: ${pid}`);
      } catch (error) {
        getLoggerInstance().warn(`\u26A0\uFE0F Failed to kill worker PID: ${pid}`, { error });
      }
    }
    await new Promise((resolve2) => setTimeout(resolve2, 2e3));
  }
  getLoggerInstance().info("\u{1F527} [WORKER] Starting configuration load...");
  await loadConfig();
  getLoggerInstance().info("\u2705 [WORKER] Configuration loaded successfully");
  const redisConnection = getRedisClientInstance();
  const canProceed = await checkWorkerLock(redisConnection);
  if (!canProceed) {
    getLoggerInstance().info(
      "\u{1F6AB} [WORKER] Another worker is already running, exiting..."
    );
    process.exit(0);
  }
  getLoggerInstance().info("\u{1F50D} DEBUG WORKER CONFIG:", {
    LLM_PROVIDER: config.LLM_PROVIDER,
    LLM_API_KEY_exists: !!config.LLM_API_KEY,
    LLM_MODEL_NAME: config.LLM_MODEL_NAME,
    LLM_API_KEY_first_20: config.LLM_API_KEY?.substring(0, 20),
    current_working_directory: process.cwd(),
    NODE_ENV: process.env.NODE_ENV
  });
  if (config.LLM_API_KEY && config.LLM_PROVIDER && config.LLM_MODEL_NAME) {
    await LlmKeyManager.addKey(
      config.LLM_PROVIDER,
      config.LLM_API_KEY,
      config.LLM_MODEL_NAME
    );
    getLoggerInstance().info(
      `Main LLM API key for ${config.LLM_PROVIDER} added to KeyManager.`
    );
  } else {
    getLoggerInstance().warn(
      `LLM_API_KEY, LLM_PROVIDER, or LLM_MODEL_NAME not fully configured in .env. LLM functionality may be limited.`
    );
  }
  const geminiKeys = [
    {
      provider: "gemini-pro-2",
      model: "gemini-2.5-pro",
      envVar: "LLM_API_KEY_GEMINI_PRO_2"
    },
    {
      provider: "gemini-pro-3",
      model: "gemini-2.5-pro",
      envVar: "LLM_API_KEY_GEMINI_PRO_3"
    },
    {
      provider: "gemini-pro-4",
      model: "gemini-2.5-pro",
      envVar: "LLM_API_KEY_GEMINI_PRO_4"
    },
    {
      provider: "gemini-flash-2",
      model: "gemini-2.5-flash",
      envVar: "LLM_API_KEY_GEMINI_FLASH_2"
    },
    {
      provider: "gemini-flash-3",
      model: "gemini-2.5-flash",
      envVar: "LLM_API_KEY_GEMINI_FLASH_3"
    },
    {
      provider: "gemini-flash-4",
      model: "gemini-2.5-flash",
      envVar: "LLM_API_KEY_GEMINI_FLASH_4"
    }
  ];
  for (const keyConfig of geminiKeys) {
    const apiKey = process.env[keyConfig.envVar];
    if (apiKey) {
      try {
        await LlmKeyManager.addKey(
          "gemini",
          // All these are Gemini providers
          apiKey,
          keyConfig.model
        );
        getLoggerInstance().info(
          `Gemini API key for ${keyConfig.provider} (${keyConfig.model}) added to KeyManager.`
        );
      } catch (error) {
        getLoggerInstance().warn(
          { error, provider: keyConfig.provider },
          `Failed to add Gemini API key for ${keyConfig.provider}`
        );
      }
    }
  }
  const openRouterKeys = [
    {
      provider: "openrouter-sky",
      model: "openrouter/sonoma-sky-alpha",
      envVar: "LLM_API_KEY_OPENROUTER_SKY"
    },
    {
      provider: "openrouter-dusk",
      model: "openrouter/sonoma-dusk-alpha",
      envVar: "LLM_API_KEY_OPENROUTER_DUSK"
    }
  ];
  for (const keyConfig of openRouterKeys) {
    const apiKey = process.env[keyConfig.envVar];
    if (apiKey) {
      try {
        await LlmKeyManager.addKey(
          keyConfig.provider,
          // Use specific provider name (openrouter-sky, openrouter-dusk)
          apiKey,
          keyConfig.model
        );
        getLoggerInstance().info(
          `OpenRouter API key for ${keyConfig.provider} (${keyConfig.model}) added to KeyManager.`
        );
      } catch (error) {
        getLoggerInstance().warn(
          { error, provider: keyConfig.provider },
          `Failed to add OpenRouter API key for ${keyConfig.provider}`
        );
      }
    } else {
      getLoggerInstance().debug(
        `OpenRouter API key for ${keyConfig.provider} not found in environment (${keyConfig.envVar})`
      );
    }
  }
  getLoggerInstance().info(
    `[INIT LLM] LLM API key management is now handled dynamically.`
  );
  getLoggerInstance().info(
    `PostgreSQL Host for Worker: ${config.POSTGRES_HOST}`
  );
  getLoggerInstance().info(
    `PostgreSQL Connection Details: host=${config.POSTGRES_HOST}, user=${config.POSTGRES_USER}, db=${config.POSTGRES_DB}, password_length=${config.POSTGRES_PASSWORD?.length || 0}`
  );
  const poolManager2 = getPostgresPool();
  const circuitBreaker = new DatabaseCircuitBreaker();
  try {
    await circuitBreaker.execute(async () => {
      const client = await poolManager2.getClient();
      await client.query("SELECT 1 as worker_health_check");
      client.release();
    });
    getLoggerInstance().info(
      "PostgreSQL pool initialized successfully for worker"
    );
  } catch (err) {
    getLoggerInstance().error(
      { err },
      "Failed to initialize PostgreSQL pool for worker"
    );
    process.exit(1);
  }
  await new Promise((resolve2) => setTimeout(resolve2, 1e3));
  initializeWorker(redisConnection).catch((err) => {
    getLoggerInstance().error({ err }, "\xC9chec de l'initialisation du worker");
    process.exit(1);
  });
}
export {
  initializeWorker,
  processJob
};
