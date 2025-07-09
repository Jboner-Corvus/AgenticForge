import { NextFunction, Request, Response } from 'express';
declare abstract class FastMCPError extends Error {
  constructor(message?: string);
}
export declare class AppError extends FastMCPError {
  details?: undefined | unknown;
  constructor(message: string, details?: undefined | unknown);
}
export declare class WebhookError extends AppError {}
export declare const handleError: (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => void;
export interface ErrorDetails {
  message: string;
  name: string;
  stack?: string;
}
export declare const getErrDetails: (err: unknown) => ErrorDetails;
export declare class EnqueueTaskError extends AppError {
  details?: undefined | unknown;
  constructor(message: string, details?: undefined | unknown);
}
export declare class UnexpectedStateError extends FastMCPError {
  extras?: unknown;
  constructor(message: string, extras?: unknown);
}
/**
 * An error that is meant to be surfaced to the user.
 */
export declare class UserError extends UnexpectedStateError {}
export {};
//# sourceMappingURL=errorUtils.d.ts.map
