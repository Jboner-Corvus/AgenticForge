import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  getLogger,
  getLoggerInstance
} from "./chunk-5JE7E5SU.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/modules/tools/toolRegistry.ts
init_esm_shims();
import { z } from "zod";

// src/utils/errorUtils.ts
init_esm_shims();
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
var handleError = (err, req, res, next) => {
  getLogger().error(
    { err: getErrDetails(err), method: req.method, url: req.originalUrl },
    "Error caught by error handling middleware"
  );
  if (res.headersSent) {
    return next(err);
  }
  const statusCode = err instanceof AppError && err.details?.statusCode ? err.details.statusCode : 500;
  const errorResponse = {
    error: {
      message: err.message || "An unexpected error occurred.",
      name: err.name || "Error"
    }
  };
  if (err instanceof AppError && err.details) {
    errorResponse.error.details = err.details;
  }
  if (process.env.NODE_ENV !== "production") {
    errorResponse.error.stack = err.stack;
  }
  res.status(statusCode).json(errorResponse);
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
var EnqueueTaskError = class extends AppError {
  constructor(message, details) {
    super(message, details);
    this.name = "EnqueueTaskError";
  }
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
var WebhookError = class extends AppError {
  constructor(message, details) {
    super(message, details);
    this.name = "WebhookError";
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

export {
  AppError,
  handleError,
  getErrDetails,
  EnqueueTaskError,
  UnexpectedStateError,
  UserError,
  WebhookError,
  toolRegistry
};
