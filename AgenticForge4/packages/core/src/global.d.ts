declare const vi: import('vitest').Mocked<any>;

declare namespace Express {
  interface Request {
    sessionId?: string;
    job?: import('bullmq').Job;
  }
}
