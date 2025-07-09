class FastMCPError extends Error {
  constructor(message) {
    super(message);
    this.name = new.target.name;
  }
}
export class AppError extends FastMCPError {
  details;
  constructor(message, details) {
    super(message);
    this.details = details;
  }
}
export class WebhookError extends AppError {}
export const handleError = (err, req, res, next) => {
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
export const getErrDetails = (err) => {
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
  details;
  constructor(message, details) {
    super(message);
    this.details = details;
  }
}
export class UnexpectedStateError extends FastMCPError {
  extras;
  constructor(message, extras) {
    super(message);
    this.name = new.target.name;
    this.extras = extras;
  }
}
/**
 * An error that is meant to be surfaced to the user.
 */
export class UserError extends UnexpectedStateError {}
//# sourceMappingURL=errorUtils.js.map
