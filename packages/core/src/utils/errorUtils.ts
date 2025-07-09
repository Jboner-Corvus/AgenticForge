import { NextFunction, Request, Response } from 'express';

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
  // TODO: Implement proper error handling
  console.error(err);
  if (res.headersSent) {
    return next(err);
  }
  const statusCode =
    err instanceof AppError && err.details?.statusCode
      ? err.details.statusCode
      : 500;
  res
    .status(statusCode)
    .json({ message: err.message || 'An unexpected error occurred.' });
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
