import { Worker, Job, Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { S as SessionManager } from './types-CXEr7hYR.js';
import 'fastmcp';
import 'zod';
import 'pg';
import './modules/llm/LlmKeyManager.js';
import 'pino';

declare function initializeWorker(redisConnection: Redis): Promise<Worker<any, any, string>>;
declare function processJob(_job: Job, _jobQueue: Queue, _sessionManager: SessionManager, redisConnection: Redis): Promise<string>;

export { initializeWorker, processJob };
