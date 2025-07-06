abstract class FastMCPError extends Error {
  public constructor(message?: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class AppError extends FastMCPError {
  public constructor(
    message: string,
    public details?: any,
  ) {
    super(message);
  }
}

export class WebhookError extends AppError {}

export const handleError = (err: any, message: string) => {
  // TODO: Implement proper error handling
  console.error(message, err);
};

export interface ErrorDetails {
  message: string;
  name: string;
  stack?: string;
}

export const getErrDetails = (err: any): ErrorDetails => {
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
