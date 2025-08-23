import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  getLogger
} from "./chunk-5JE7E5SU.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

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

export {
  AppError,
  handleError,
  getErrDetails,
  EnqueueTaskError,
  UnexpectedStateError,
  UserError,
  WebhookError
};
