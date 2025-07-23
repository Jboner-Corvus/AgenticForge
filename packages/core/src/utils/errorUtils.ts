import { NextFunction, Request, Response } from 'express';

import logger from '../logger.js';

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
  public constructor(
    message: string,
    public details?: AppErrorDetails,
  ) {
    super(message);
  }
}

export class WebhookError extends AppError {}

export const handleError = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  logger.error({ err, method: req.method, url: req.originalUrl }, 'Error caught by error handling middleware');

  if (res.headersSent) {
    return next(err);
  }

  const statusCode =
    err instanceof AppError && err.details?.statusCode
      ? err.details.statusCode
      : 500;

  const errorResponse: { error: string; stack?: string } = {
    error: err.message || 'An unexpected error occurred.',
  };

  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

export interface ErrorDetails {
  message: string;
  name: string;
  stack?: string;
}

export const getErrDetails = (err: unknown): ErrorDetails => {
  if (err instanceof Error) {
    return {
      message: err.message ?? 'Unknown error',
      name: err.name ?? 'Error',
      stack: err.stack,
    };
  }
  return {
    message: String(err),
    name: 'NonError',
  };
};

export class EnqueueTaskError extends AppError {
  public constructor(
    message: string,
    public details?: AppErrorDetails,
  ) {
    super(message);
  }
}

export class UnexpectedStateError extends FastMCPError {
  public extras?: unknown;

  public constructor(message: string, extras?: unknown) {
    super(message);
    this.name = new.target.name;
    this.extras = extras;
  }
}

/**
 * An error that is meant to be surfaced to the user.
 */
export class UserError extends UnexpectedStateError {}
