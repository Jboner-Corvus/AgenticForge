import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

import { SessionData } from './types.js';
export declare const redisConnection: Redis;
export interface AsyncTaskJobPayload<TParams> {
    auth: SessionData | undefined;
    cbUrl?: string;
    params: TParams;
    taskId: string;
    toolName: string;
}
export declare const jobQueue: Queue<AsyncTaskJobPayload<unknown>, unknown, string>;
export declare const deadLetterQueue: Queue<AsyncTaskJobPayload<unknown>, unknown, string>;
//# sourceMappingURL=queue.d.ts.map
