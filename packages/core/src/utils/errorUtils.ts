import { NextFunction, Request, Response } from 'express';

import { getLogger } from '../logger.js';

export interface AppErrorDetails {
  [key: string]: unknown;
  statusCode?: number;
}

abstract class FastMCPError extends Error {
  public constructor(message?: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class AppError extends FastMCPError {
  /**
   * Represents an application-specific error. It is recommended to always provide a `statusCode`
   * within the `details` object for proper HTTP response handling.
   */
  public constructor(
    message: string,
    public details?: AppErrorDetails,
  ) {
    super(message);
  }
}

export const handleError = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  getLogger().error(
    { err: getErrDetails(err), method: req.method, url: req.originalUrl },
    'Error caught by error handling middleware',
  );

  if (res.headersSent) {
    return next(err);
  }

  const statusCode =
    err instanceof AppError && err.details?.statusCode
      ? err.details.statusCode
      : 500;

  const errorResponse: {
    error: {
      details?: AppErrorDetails;
      message: string;
      name?: string;
      stack?: string;
    };
  } = {
    error: {
      message: err.message || 'An unexpected error occurred.',
      name: err.name || 'Error',
    },
  };

  if (err instanceof AppError && err.details) {
    errorResponse.error.details = err.details;
  }

  if (process.env.NODE_ENV !== 'production') {
    errorResponse.error.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

export interface ErrorDetails {
  details?: AppErrorDetails;
  message: string;
  name: string;
  stack?: string;
}

export const getErrDetails = (err: unknown): ErrorDetails => {
  if (err instanceof AppError) {
    return {
      details: err.details, // Include details for AppError
      message: err.message ?? 'Unknown AppError',
      name: err.name ?? 'AppError',
      stack: err.stack,
    };
  } else if (err instanceof Error) {
    return {
      message: err.message ?? 'Unknown error',
      name: err.name ?? 'Error',
      stack: err.stack,
    };
  }
  // Handle plain objects that might have a 'message' property
  if (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as any).message === 'string'
  ) {
    return {
      message: (err as any).message,
      name: 'NonErrorObject',
    };
  }
  return {
    message: String(err),
    name: 'NonErrorPrimitive',
  };
};

export class EnqueueTaskError extends AppError {
  public constructor(message: string, details?: AppErrorDetails) {
    super(message, details);
    this.name = 'EnqueueTaskError';
  }
}

export class UnexpectedStateError extends FastMCPError {
  /**
   * Additional debugging information for unexpected states. This field should always be used
   * to provide relevant context when an unexpected state occurs.
   */
  public extras?: unknown;

  public constructor(message: string, extras?: unknown) {
    super(message);
    this.name = new.target.name;
    this.extras = extras;
  }
}
export class UserError extends UnexpectedStateError {
  public constructor(message: string, extras?: unknown) {
    super(message, extras);
    this.name = 'UserError';
  }
}
export class WebhookError extends AppError {
  public constructor(message: string, details?: AppErrorDetails) {
    super(message, details);
    this.name = 'WebhookError';
  }
}
