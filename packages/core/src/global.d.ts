declare namespace Express {
  interface Request {
    sessionId?: string;
    job?: import('bullmq').Job;
  }
}
