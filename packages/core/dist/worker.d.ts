import { Worker, Job, Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { Client } from 'pg';
import { S as SessionManager } from './types-C2iGLYUf.js';
import 'fastmcp';
import 'zod';
import 'pino';

declare function initializeWorker(redisConnection: Redis, pgClient: Client): Promise<Worker<any, any, string>>;
declare function processJob(_job: Job, _jobQueue: Queue, _sessionManager: SessionManager, redisConnection: Redis): Promise<string>;

export { initializeWorker, processJob };
